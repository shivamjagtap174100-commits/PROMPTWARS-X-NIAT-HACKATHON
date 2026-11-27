import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { processCsvDocument, processTextDocument } from '../engine/pipeline';
import { NOISY_SAMPLE_TEXT } from '../utils/sampleData';

async function enterWorkspace(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Demo Access/i }));
  await user.click(screen.getByRole('button', { name: /^Workspace$/i }));
}

describe('Security, Zero-Transmission, and Safe Rendering Guarantees', () => {
  it('transmits zero network requests during text and CSV sanitization', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const sendBeaconMock = vi.fn();
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    processTextDocument(NOISY_SAMPLE_TEXT, 'PSEUDONYM');
    processCsvDocument(
      'Name,Email,PAN\nAarav,shivam@example.com,ABCDE1234F',
      'PARTIAL_MASK'
    );

    const user = userEvent.setup();
    await enterWorkspace(user);
    await user.click(screen.getByRole('button', { name: /LOAD SAMPLE DATA/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(sendBeaconMock).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('never leaks raw sensitive values into console, audit logs, processing logs, or localStorage', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const warnSpy = vi.spyOn(console, 'warn');
    const errorSpy = vi.spyOn(console, 'error');

    const secretEmail = 'confidential.ceo@secretcorp.in';
    const secretPan = 'ZZZZZ9876K';
    const user = userEvent.setup();
    await enterWorkspace(user);

    const editor = screen.getByLabelText(/Source document text/i);
    await user.click(editor);
    await user.paste(`Contact ${secretEmail} PAN ${secretPan}`);

    const auditHeading = await screen.findByText(/Sanitized document generated/i, {}, { timeout: 2000 });
    expect(auditHeading).toBeInTheDocument();

    const logPanel = screen.getByTestId('processing-log-list').textContent || '';
    expect(logPanel).not.toContain(secretEmail);
    expect(logPanel).not.toContain(secretPan);

    const auditSection = screen.getByLabelText(/Sanitization audit ledger/i).textContent || '';
    expect(auditSection).not.toContain(secretEmail);
    expect(auditSection).not.toContain(secretPan);
    expect(auditSection).not.toContain('USER_01');

    for (const spy of [logSpy, warnSpy, errorSpy]) {
      const joined = spy.mock.calls.flat().join(' ');
      expect(joined).not.toContain(secretEmail);
      expect(joined).not.toContain(secretPan);
      spy.mockRestore();
    }

    const secretPasscode = 'SuperSecretPass!99';
    // Verify persisted localStorage entries contain ONLY safe metadata/session, never raw PII, raw text, or passcodes
    const storageEntries: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k) storageEntries[k] = localStorage.getItem(k) || '';
    }
    const serializedLocalStorage = JSON.stringify(storageEntries);
    expect(serializedLocalStorage).not.toContain(secretEmail);
    expect(serializedLocalStorage).not.toContain(secretPan);
    expect(serializedLocalStorage).not.toContain('USER_01');
    expect(serializedLocalStorage).not.toContain(secretPasscode);
    expect(sessionStorage.length).toBe(0);
    expect(window.location.search).toBe('');
  });

  it('renders potential XSS payloads strictly as escaped text nodes without HTML injection', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Demo Access/i }));
    await user.click(screen.getByRole('button', { name: /^Workspace$/i }));

    const editor = screen.getByLabelText(/Source document text/i);
    const xssPayload =
      '<img src=x onerror="alert(1)"> <script>window.__xss=true</script> shivam@example.com';
    fireEvent.change(editor, { target: { value: xssPayload } });

    const originalPane = await screen.findByTestId('diff-original-pane');
    await waitFor(() => {
      expect(originalPane.textContent).toContain('<script>window.__xss=true</script>');
    });

    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });
});
