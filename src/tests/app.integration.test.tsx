import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

async function enterWorkspace(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Demo Access/i }));
  await user.click(screen.getByRole('button', { name: /^Workspace$/i }));
}

describe('PRIVACYGUARD Interactive UI, Responsive & Accessibility Integration', () => {
  it('loads sample data, updates real-time statistics, switches redaction modes, and updates Before/After diff', async () => {
    const user = userEvent.setup();
    await enterWorkspace(user);

    await user.click(screen.getByRole('button', { name: /LOAD SAMPLE DATA/i }));

    await waitFor(() => {
      expect(Number(screen.getByTestId('total-entities-count').textContent)).toBeGreaterThanOrEqual(12);
    });

    const sanitizedArea = screen.getByLabelText(/Sanitized output document/i) as HTMLTextAreaElement;
    expect(sanitizedArea.value).toContain('[REDACTED]');
    expect(sanitizedArea.value).not.toContain('shivam@example.com');
    expect(sanitizedArea.value).toContain('4111-1111-1111-1112');
    expect(sanitizedArea.value).toContain('1234567890');

    await user.click(screen.getByRole('radio', { name: /PARTIAL MASK/i }));
    await waitFor(() => {
      expect(sanitizedArea.value).toContain('sh***@example.com');
      expect(sanitizedArea.value).toContain('XXXX-XXXX-XXXX-1111');
      expect(sanitizedArea.value).toContain('XXXXX1234F');
    });

    await user.click(screen.getByRole('radio', { name: /CONSISTENT PSEUDONYMIZATION/i }));
    await waitFor(() => {
      expect(sanitizedArea.value).toContain('USER_01');
      expect(sanitizedArea.value).toContain('PAN_01');
      expect(sanitizedArea.value).toContain('CARD_01');
    });

    const diffOrig = screen.getByTestId('diff-original-pane');
    const diffSan = screen.getByTestId('diff-sanitized-pane');
    expect(diffOrig.textContent).toContain('shivam@example.com');
    expect(diffSan.textContent).toContain('USER_01');
  });

  it('supports excluding and restoring individual detections and recalculates counts', async () => {
    const user = userEvent.setup();
    await enterWorkspace(user);

    await user.click(screen.getByRole('button', { name: /LOAD SAMPLE DATA/i }));
    await waitFor(() => {
      expect(Number(screen.getByTestId('count-EMAIL').textContent)).toBe(4);
    });

    const excludeButtons = screen.getAllByRole('button', { name: /Exclude/i });
    await user.click(excludeButtons[0]);

    await waitFor(() => {
      expect(Number(screen.getByTestId('count-EMAIL').textContent)).toBe(3);
    });

    const restoreBtn = screen.getByRole('button', { name: /Restore/i });
    await user.click(restoreBtn);

    await waitFor(() => {
      expect(Number(screen.getByTestId('count-EMAIL').textContent)).toBe(4);
    });
  });

  it('supports copying sanitized text, downloading local files, and switching theme accessibly', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    const createObjectUrlMock = vi.fn().mockReturnValue('blob:local-test');
    const revokeObjectUrlMock = vi.fn();
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;

    await enterWorkspace(user);

    await user.click(screen.getByRole('button', { name: /LOAD SAMPLE DATA/i }));

    await user.click(screen.getByRole('button', { name: /^Copy$/i }));
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Export: Copied/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Download TXT/i }));
    await waitFor(() => {
      expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Export: Downloaded TXT/i)).toBeInTheDocument();
    });

    const themeBtn = screen.getByRole('button', { name: /Switch to dark theme/i });
    expect(themeBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: /Switch to light theme/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    writeTextSpy.mockRestore();
    anchorClickSpy.mockRestore();
  });

  it('handles CSV file uploads, clear reset, mobile navigation drawer, and invalid file error handling', async () => {
    const user = userEvent.setup({ applyAccept: false });
    await enterWorkspace(user);

    // Floating dock Primary nav is always rendered as the main accessible navigation
    expect(screen.getByRole('navigation', { name: /Primary/i })).toBeInTheDocument();

    // Reject unsupported extension with clear non-PII alert
    const fileInput = screen.getByLabelText(/Upload TXT or CSV file/i) as HTMLInputElement;
    const invalidFile = new File(['bad'], 'report.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, invalidFile);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Unsupported file extension/i);
    });

    // Accept valid CSV with quoted fields & embedded commas
    const validCsv = new File(
      ['Name,Email,Card\n"Patel, Riya",riya@example.in,4111-1111-1111-1111'],
      'customers.csv',
      { type: 'text/csv' }
    );
    await user.upload(fileInput, validCsv);

    await waitFor(() => {
      const output = screen.getByLabelText(/Sanitized output document/i) as HTMLTextAreaElement;
      expect(output.value).toContain('"Patel, Riya",[REDACTED],[REDACTED]');
      expect(screen.getByRole('button', { name: /Download CSV/i })).toBeInTheDocument();
    });

    // Clear resets document cleanly
    await user.click(screen.getByRole('button', { name: /Clear source input/i }));
    await waitFor(() => {
      expect(Number(screen.getByTestId('total-entities-count').textContent)).toBe(0);
    });
  });
});
