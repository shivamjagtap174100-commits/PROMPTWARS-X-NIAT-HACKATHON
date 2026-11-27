import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { parseCsv } from '../engine/parsing/csvParser';

async function enterWorkspace(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Demo Access/i }));
  await user.click(screen.getByRole('button', { name: /^Workspace$/i }));
}

describe('PRIVACYGUARD Competition Upgrade Features', () => {
  it('supports Smart Sample Laboratory presets and one-click Instant Demo Mode', async () => {
    const user = userEvent.setup();
    await enterWorkspace(user);

    await user.click(screen.getByRole('button', { name: /Run instant demo/i }));

    await waitFor(() => {
      const sanitizedArea = screen.getByLabelText(
        /Sanitized output document/i
      ) as HTMLTextAreaElement;
      expect(sanitizedArea.value).toContain('USER_01');
      expect(sanitizedArea.value).toContain('PHONE_01');
      expect(sanitizedArea.value).not.toContain('ananya.rao@example.in');
    });

    await user.click(screen.getByRole('button', { name: /Technical Log/i }));
    await waitFor(() => {
      expect(Number(screen.getByTestId('count-IP').textContent)).toBe(3);
    });

    await user.click(screen.getByRole('button', { name: /CSV Export Sample/i }));
    await waitFor(() => {
      const sanitizedArea = screen.getByLabelText(
        /Sanitized output document/i
      ) as HTMLTextAreaElement;
      expect(sanitizedArea.value).toContain('"Kulkarni, Aarav"');
      expect(sanitizedArea.value).toContain('USER_01');
    });
  });

  it('toggles individual PII categories live and shows explainable match reasons', async () => {
    const user = userEvent.setup();
    await enterWorkspace(user);

    await user.click(screen.getByRole('button', { name: /Indian Business KYC/i }));

    await waitFor(() => {
      expect(Number(screen.getByTestId('count-EMAIL').textContent)).toBe(3);
      expect(Number(screen.getByTestId('count-PAN').textContent)).toBe(2);
    });

    // Explainable reasons & non-verification disclaimer visible
    expect(screen.getAllByText(/ISO\/IEC 7812 Luhn/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/format detection only/i).length).toBeGreaterThan(0);

    // Disable Email detector live
    const emailSwitch = screen.getByRole('switch', { name: /Toggle Email address detector/i });
    await user.click(emailSwitch);

    await waitFor(() => {
      expect(Number(screen.getByTestId('count-EMAIL').textContent)).toBe(0);
      const sanitizedArea = screen.getByLabelText(
        /Sanitized output document/i
      ) as HTMLTextAreaElement;
      expect(sanitizedArea.value).toContain('finance@sahyadrisystems.in');
      expect(sanitizedArea.value).not.toContain('ABCDE1234F');
    });

    // Re-enable all detectors
    await user.click(screen.getByRole('button', { name: /Enable all/i }));
    await waitFor(() => {
      expect(Number(screen.getByTestId('count-EMAIL').textContent)).toBe(3);
    });
  });

  it('switches Source pane into safe inline Highlights view and exports valid CSV from plain text', async () => {
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

    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    URL.createObjectURL = vi.fn().mockReturnValue('blob:upgrade-csv');
    URL.revokeObjectURL = vi.fn();

    await enterWorkspace(user);
    await user.click(screen.getByRole('button', { name: /Indian Business KYC/i }));

    // Toggle Source Highlights view
    await user.click(screen.getByRole('button', { name: /^Highlights$/i }));
    const highlightPreview = await screen.findByTestId('source-highlight-preview');
    expect(highlightPreview.textContent).toContain('finance@sahyadrisystems.in');
    expect(highlightPreview.querySelectorAll('mark').length).toBeGreaterThan(0);

    // Export plain text document as valid escaped CSV
    await user.click(screen.getByRole('button', { name: /Download CSV/i }));
    await waitFor(() => expect(capturedBlobs.length).toBeGreaterThanOrEqual(1));
    const csvText = await capturedBlobs[capturedBlobs.length - 1].text();
    const parsed = parseCsv(csvText);
    expect(parsed.error).toBeUndefined();
    expect(parsed.rows[0]).toEqual(['Line', 'Sanitized_Content']);
    expect(csvText).not.toContain('finance@sahyadrisystems.in');
    expect(csvText).not.toContain('ABCDE1234F');

    vi.unstubAllGlobals();
    anchorClickSpy.mockRestore();
  });

  it('supports keyboard shortcuts Alt+2/3 for redaction mode switching and displays Privacy Inspector', async () => {
    const user = userEvent.setup();
    await enterWorkspace(user);

    await user.click(screen.getByRole('button', { name: /Load sample data/i }));
    expect(screen.getByText(/Live browser runtime & network verification/i)).toBeInTheDocument();
    expect(screen.getByTestId('privacy-api-request-count')).toHaveTextContent(
      /0 external API \/ fetch calls/i
    );
    expect(screen.getByTestId('sanitized-entities-count')).toHaveTextContent(/Sanitized:/i);
    expect(screen.getByTestId('diff-summary-badge')).toHaveTextContent(/redacted/i);

    await user.click(screen.getByRole('button', { name: /Refresh live privacy telemetry/i }));
    expect(screen.getByTestId('privacy-api-request-count')).toHaveTextContent(
      /0 external API \/ fetch calls/i
    );

    await user.keyboard('{Alt>}2{/Alt}');
    await waitFor(() => {
      const sanitizedArea = screen.getByLabelText(
        /Sanitized output document/i
      ) as HTMLTextAreaElement;
      expect(sanitizedArea.value).toContain('sh***@example.com');
    });

    await user.keyboard('{Alt>}3{/Alt}');
    await waitFor(() => {
      const sanitizedArea = screen.getByLabelText(
        /Sanitized output document/i
      ) as HTMLTextAreaElement;
      expect(sanitizedArea.value).toContain('USER_01');
    });
  });
});
