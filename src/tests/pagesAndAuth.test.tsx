import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

describe('PrivacyGuard Swiss Precision QA & Persistence Suite', () => {
  it('enforces Login first when unauthenticated, persists session/preferences/metadata across reload without passcodes/PII, and clears on Logout', async () => {
    const user = userEvent.setup();

    window.history.pushState({}, '', '/workspace');
    const view = render(<App />);

    expect(window.location.pathname).toBe('/login');
    expect(screen.getByRole('heading', { name: /Login to Your Account/i })).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', { name: /Your data\. Your control\./i })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Source document text/i)).not.toBeInTheDocument();
    // Floating dock's Primary nav should not appear on login screen
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();

    expect(screen.queryByText(/Saved local accounts/i)).not.toBeInTheDocument();
    const emailInput = screen.getByLabelText(/Work Email \/ User ID/i) as HTMLInputElement;
    const passInput = screen.getByLabelText(/^Passcode$/i) as HTMLInputElement;
    expect(emailInput.value).toBe('');
    expect(passInput.value).toBe('');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    await user.click(screen.getByRole('button', { name: /Login to Your Account/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid work email/i);

    fireEvent.change(emailInput, { target: { value: 'ananya.deshmukh@fintech.in' } });
    fireEvent.change(passInput, { target: { value: 'secpass123' } });
    await user.click(screen.getByRole('button', { name: /Login to Your Account/i }));

    // After sign-in, always lands on Overview (Privacy starts with control.)
    expect(screen.getByText(/Privacy starts with control\./i)).toBeInTheDocument();
    expect(screen.getByTestId('navbar-user-name')).toHaveTextContent('Ananya Deshmukh');

    // Switch theme, navigate to Workspace, and load sample document
    await user.click(screen.getByRole('button', { name: /Switch to dark theme/i }));
    await user.click(screen.getByRole('button', { name: /^Workspace$/i }));
    await user.click(screen.getByRole('button', { name: /LOAD SAMPLE DATA/i }));
    await waitFor(() => {
      expect(Number(screen.getByTestId('total-entities-count').textContent)).toBeGreaterThanOrEqual(
        12
      );
    });

    // Confirm raw passcode & raw PII are NEVER persisted in localStorage
    // jsdom localStorage.key(i) iteration to reliably serialize all keys
    const storageEntries: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      storageEntries[k] = localStorage.getItem(k) ?? '';
    }
    const dump = JSON.stringify(storageEntries);
    expect(dump).toContain('ananya.deshmukh@fintech.in');
    expect(dump).not.toContain('secpass123');
    expect(dump).not.toContain('shivam@example.com');
    expect(dump).not.toContain('ABCDE1234F');

    // Simulate page reload (unmount & fresh mount of <App /> with saved localStorage intact)
    view.unmount();
    render(<App />);

    // User stays signed in, stays on Workspace (persisted route), Dark mode preserved
    expect(screen.getByTestId('navbar-user-name')).toHaveTextContent('Ananya Deshmukh');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    // Workspace textarea still accessible (route was /workspace)
    expect(screen.getByLabelText(/Source document text/i)).toBeInTheDocument();

    // Check Documents library retains metadata across reload while Open is disabled safely (no raw text on disk)
    await user.click(screen.getByRole('button', { name: /^Documents$/i }));
    expect(screen.getByText('Full Benchmark (Sample)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Full Benchmark \(Sample\)/i })).toBeDisabled();

    // Logout clears persisted active auth & session data and restores Login gate
    await user.click(screen.getByRole('button', { name: /^Logout$/i }));
    expect(window.location.pathname).toBe('/login');
    expect(localStorage.getItem('privacyguard-auth-session')).toBeNull();
    // Floating dock Primary nav removed when unauthenticated
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
  });

  it('supports floating dock navigation, Overview actions, Privacy Centre, and Command Palette', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Demo Access/i }));
    // After demo login, lands on Overview
    expect(screen.getByText(/No activity in this session yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start New Scan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Document/i })).toBeInTheDocument();

    // Floating dock tooltips are always present (dock is not collapsible)
    expect(screen.getAllByRole('tooltip').length).toBeGreaterThanOrEqual(6);

    // Dock navigation: Privacy Centre
    await user.click(screen.getByRole('button', { name: /Explore Privacy Architecture/i }));
    expect(window.location.pathname).toBe('/privacy-centre');
    expect(screen.getByRole('button', { name: /Clear Session Data/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /REDACTION ENGINE/i }));
    expect(screen.getByTestId('privacy-stage-detail')).toHaveTextContent(/REDACTION ENGINE/i);

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog', { name: /Command palette/i })).toBeInTheDocument();
    const paletteInput = screen.getByLabelText(/Search PrivacyGuard commands/i);
    fireEvent.change(paletteInput, { target: { value: 'Load Sample' } });
    await user.click(screen.getByRole('button', { name: /Load Sample/i }));
    expect(window.location.pathname).toBe('/workspace');
    expect(Number(screen.getByTestId('total-entities-count').textContent)).toBeGreaterThanOrEqual(
      12
    );
  });

  it('supports masked Detection Review previews, summary counts, CSV Column Preview, Mapping Inspector, and Rule Explorer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Demo Access/i }));
    await user.click(screen.getByRole('button', { name: /^Workspace$/i }));

    await user.click(screen.getByRole('button', { name: /CSV Export Sample/i }));
    await user.click(screen.getByRole('radio', { name: /CONSISTENT PSEUDONYMIZATION/i }));

    await user.click(screen.getByRole('button', { name: /^Scan$/i }));

    await waitFor(() => {
      expect(screen.getByText(/CSV Column Preview/i)).toBeInTheDocument();
      expect(screen.getByText(/ready for sanitization/i)).toBeInTheDocument();
      expect(screen.getByText(/categories identified/i)).toBeInTheDocument();
    });

    const inspectorSection = screen.getByLabelText(/Pseudonymization mapping inspector/i);
    expect(inspectorSection).toHaveTextContent('USER_01');
    expect(inspectorSection).toHaveTextContent('sh***@example.com');
    expect(inspectorSection).not.toHaveTextContent('shivam@example.com');

    await user.click(screen.getAllByRole('button', { name: /Reveal/i })[0]);
    expect(inspectorSection).toHaveTextContent('shivam@example.com');

    const auditSection = screen.getByLabelText(/Sanitization audit ledger/i).textContent || '';
    expect(auditSection).not.toContain('shivam@example.com');
    expect(auditSection).not.toContain('USER_01');

    await user.click(screen.getByRole('tab', { name: /Detection Rule Explorer/i }));
    await user.click(screen.getByRole('button', { name: /^Card$/i }));
    const sandboxInput = screen.getByLabelText(/Live rule sandbox input/i);
    fireEvent.change(sandboxInput, { target: { value: '4111-1111-1111-1112' } });
    expect(screen.getByTestId('rule-explorer-output')).toHaveTextContent(/Rejected/i);
    fireEvent.change(sandboxInput, { target: { value: '4111-1111-1111-1111' } });
    expect(screen.getByTestId('rule-explorer-output')).toHaveTextContent(/Matched 1 Card entity/i);
  });

  it('supports Documents Open/Download/Delete/Clear All, Audit Trail filters & metadata export, Batch Scan, and Dark Mode', async () => {
    const user = userEvent.setup({ applyAccept: false });
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
    URL.createObjectURL = vi.fn().mockReturnValue('blob:qa-verify');
    URL.revokeObjectURL = vi.fn();

    render(<App />);
    await user.click(screen.getByRole('button', { name: /Demo Access/i }));
    await user.click(screen.getByRole('button', { name: /^Documents$/i }));

    const batchInput = screen.getByLabelText(
      /Upload multiple TXT or CSV files for batch sanitization/i
    ) as HTMLInputElement;
    const validTxt = new File(['Contact alert@fintech.in immediately.'], 'alerts.txt', {
      type: 'text/plain',
    });
    const validCsv = new File(['User,PAN\nRohan,ABCDE1234F'], 'kyc.csv', { type: 'text/csv' });
    const badPdf = new File(['%PDF-1.4'], 'bad.pdf', { type: 'application/pdf' });

    await user.upload(batchInput, [validTxt, validCsv, badPdf]);

    await waitFor(() => {
      expect(screen.getAllByText('alerts.txt').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('kyc.csv').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('bad.pdf')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Download sanitized alerts\.txt/i }));
    await user.click(screen.getByRole('button', { name: /Delete kyc\.csv/i }));
    expect(screen.getByRole('table').textContent).not.toContain('kyc.csv');

    await user.click(screen.getByRole('button', { name: /Open alerts\.txt/i }));
    expect(window.location.pathname).toBe('/workspace');
    expect((screen.getByLabelText(/Source document text/i) as HTMLTextAreaElement).value).toContain(
      'alert@fintech.in'
    );
    await user.click(screen.getByRole('button', { name: /Clear source input/i }));

    await user.click(screen.getByRole('button', { name: /Audit Trail/i }));
    await user.click(screen.getByRole('button', { name: /^Resets$/i }));
    expect(screen.getByRole('main').textContent).toContain('Session reset');

    await user.click(screen.getByRole('button', { name: /^All events$/i }));
    await user.click(screen.getByRole('button', { name: /Export metadata/i }));
    await waitFor(() => expect(capturedBlobs.length).toBeGreaterThanOrEqual(2));
    const auditJsonText = await capturedBlobs[capturedBlobs.length - 1].text();
    expect(auditJsonText).not.toContain('alert@fintech.in');
    expect(auditJsonText).not.toContain('ABCDE1234F');

    await user.click(screen.getByRole('button', { name: /^Documents$/i }));
    await user.click(screen.getByRole('button', { name: /Clear all session data/i }));
    expect(screen.getByText(/No session documents in memory/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Switch to dark theme/i }));
    expect(localStorage.getItem('privacyguard-theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: /Documentation/i }));
    const faqBtn = screen.getByRole('button', {
      name: /Does PrivacyGuard verify Aadhaar numbers against UIDAI/i,
    });
    await user.click(faqBtn);
    expect(faqBtn).toHaveAttribute('aria-expanded', 'true');

    vi.unstubAllGlobals();
    anchorClickSpy.mockRestore();
  });
});
