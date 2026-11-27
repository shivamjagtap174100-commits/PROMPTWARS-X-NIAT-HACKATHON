import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { detectIps } from '../engine/detectors/ipDetector';
import { detectPhones } from '../engine/detectors/phoneDetector';
import { MAX_TEXT_LENGTH_CHARS } from '../engine/parsing/fileValidation';
import { processTextDocument } from '../engine/pipeline';
import { sanitizeDocumentAsync } from '../workers/workerClient';

async function enterWorkspace(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Demo Access/i }));
  await user.click(screen.getByRole('button', { name: /^Workspace$/i }));
}

describe('PRIVACYGUARD Emergency Functionality & Export Audit', () => {
  it('detects IPv4 at sentence end and with port, plus hyphenated and 91-prefixed Indian phones', () => {
    const ipMatches = detectIps(
      'Primary host is 192.168.1.45. Proxy 10.0.0.1:8080. Invalid 999.10.20.30 and 1.2.3.4.5.'
    );
    expect(ipMatches.map((m) => m.value)).toEqual(['192.168.1.45', '10.0.0.1']);

    const phoneMatches = detectPhones(
      'Call 987-654-3210, 9876 543 210, 91-9876543210, +91 98765 43210, or 09876543210. Ignore 123-456-7890.'
    );
    expect(phoneMatches.map((m) => m.value)).toEqual([
      '987-654-3210',
      '9876 543 210',
      '91-9876543210',
      '+91 98765 43210',
      '09876543210',
    ]);
  });

  it('rejects null-byte binary text and oversized text documents cleanly', () => {
    const binaryResult = processTextDocument('hello\u0000world shivam@example.com', 'FULL_MASK');
    expect(binaryResult.parseError).toMatch(/Binary or null-byte/i);
    expect(binaryResult.sanitizedText).toBe('');

    const hugeText = 'a'.repeat(MAX_TEXT_LENGTH_CHARS + 1);
    const hugeResult = processTextDocument(hugeText, 'FULL_MASK');
    expect(hugeResult.parseError).toMatch(/character browser safety limit/i);
    expect(hugeResult.sanitizedText).toBe('');
  });

  it('processes large 30,000+ char documents cleanly through sanitizeDocumentAsync fallback/worker path', async () => {
    const repeatedBlock =
      'Audit entry: email shivam@example.com, phone +91 98765 43210, IP 192.168.1.45, PAN ABCDE1234F, card 4111-1111-1111-1111. Normal text.\n';
    const largeDoc = repeatedBlock.repeat(260); // ~33,800 chars (> 25,000 worker threshold)
    expect(largeDoc.length).toBeGreaterThan(25_000);

    const result = await sanitizeDocumentAsync({
      inputText: largeDoc,
      fileKind: 'text',
      mode: 'FULL_MASK',
      excludedIds: [],
      preserveCsvHeader: true,
      workerThresholdChars: 25_000,
    });

    expect(result.parseError).toBeUndefined();
    expect(result.counts.EMAIL).toBe(260);
    expect(result.counts.PHONE).toBe(260);
    expect(result.counts.IP).toBe(260);
    expect(result.counts.PAN).toBe(260);
    expect(result.counts.CREDIT_CARD).toBe(260);
    expect(result.sanitizedText).not.toContain('shivam@example.com');
    expect(result.sanitizedText).not.toContain('ABCDE1234F');
    expect(result.sanitizedText).toContain('Normal text.');
  });

  it('verifies actual exported Blob text and Clipboard content contain zero original sensitive values', async () => {
    const user = userEvent.setup();
    const capturedBlobs: Blob[] = [];
    const OriginalBlob = globalThis.Blob;

    class SpyBlob extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        capturedBlobs.push(this);
      }
    }
    vi.stubGlobal('Blob', SpyBlob);

    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    URL.createObjectURL = vi.fn().mockReturnValue('blob:qa-verify');
    URL.revokeObjectURL = vi.fn();

    await enterWorkspace(user);

    const secretInput =
      'Ticket 9042: user priya.sharma@fintech.in, mobile +91 98765 43210, PAN ABCDE1234F, card 4111-1111-1111-1111, IP 192.168.1.45. Keep public note intact.';
    const editor = screen.getByLabelText(/Source document text/i);
    fireEvent.change(editor, { target: { value: secretInput } });

    await waitFor(() => {
      expect(Number(screen.getByTestId('total-entities-count').textContent)).toBe(5);
    });

    // Copy & inspect exact copied string
    await user.click(screen.getByRole('button', { name: /^Copy$/i }));
    await waitFor(() => expect(writeTextSpy).toHaveBeenCalledTimes(1));
    const copiedContent = writeTextSpy.mock.calls[0][0];
    expect(copiedContent).toContain('Ticket 9042:');
    expect(copiedContent).toContain('Keep public note intact.');
    expect(copiedContent).not.toContain('priya.sharma@fintech.in');
    expect(copiedContent).not.toContain('98765 43210');
    expect(copiedContent).not.toContain('ABCDE1234F');
    expect(copiedContent).not.toContain('4111-1111-1111-1111');
    expect(copiedContent).not.toContain('192.168.1.45');

    // Download & inspect exact exported Blob text
    await user.click(screen.getByRole('button', { name: /Download TXT/i }));
    await waitFor(() => expect(capturedBlobs.length).toBeGreaterThanOrEqual(1));
    const exportedText = await capturedBlobs[capturedBlobs.length - 1].text();
    expect(exportedText).toBe(copiedContent);
    expect(exportedText).not.toContain('priya.sharma@fintech.in');

    // Manual clear via textarea edit resets CSV/text state cleanly and disables empty Copy/Download
    fireEvent.change(editor, { target: { value: '' } });
    await waitFor(() => {
      expect(Number(screen.getByTestId('total-entities-count').textContent)).toBe(0);
      expect(screen.getByRole('button', { name: /^(Copy|Copied)$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Download TXT/i })).toBeDisabled();
    });

    vi.unstubAllGlobals();
    writeTextSpy.mockRestore();
    anchorClickSpy.mockRestore();
  });

  it('rejects empty whitespace-only TXT file uploads and binary files in UI cleanly', async () => {
    const user = userEvent.setup({ applyAccept: false });
    await enterWorkspace(user);

    const fileInput = screen.getByLabelText(/Upload TXT or CSV file/i) as HTMLInputElement;
    const whitespaceFile = new File(['   \n\t  '], 'blank.txt', { type: 'text/plain' });
    await user.upload(fileInput, whitespaceFile);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no readable text/i);
    });

    const binaryTxtFile = new File(['abc\u0000def'], 'binary.txt', { type: 'text/plain' });
    await user.upload(fileInput, binaryTxtFile);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Binary or null-byte/i);
    });
  });

  it('exposes accessible landmarks, settings dialog, and responsive container behavior', async () => {
    const user = userEvent.setup();
    await enterWorkspace(user);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Open workspace settings/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Done/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
