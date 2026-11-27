import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { detectCustomRules } from '../engine/detectors/customRuleDetector';
import { DEFAULT_ENABLED_CATEGORIES, detectAllEntities } from '../engine/detectors/detectAll';
import { detectDigitalSecrets } from '../engine/detectors/digitalSecretDetector';
import { detectFinancialIds } from '../engine/detectors/financialDetector';
import { detectGovIds } from '../engine/detectors/govIdDetector';
import { detectLocations } from '../engine/detectors/locationDetector';
import { detectDobAndAge, detectPersonNames } from '../engine/detectors/personalInfoDetector';
import { processTextDocument } from '../engine/pipeline';
import { buildSanitizationReport, formatSanitizationReportMarkdown } from '../engine/riskAnalyzer';

describe('PrivacyGuard 2.0 Extended Detection, Classification, Redaction & QA Suite', () => {
  it('detects Personal Info, Gov IDs, Financial IDs, Digital Secrets, Locations & Unicode cleanly while suppressing false positives', () => {
    const names = detectPersonNames(
      'Customer Name: José Álvarez\nDr. Ananya Rao\nEnvironment: prod-ap-south-1\nCompany: Sahyadri Systems Pvt.'
    );
    expect(names.map((m) => m.value)).toEqual(['José Álvarez', 'Ananya Rao']);

    const bio = detectDobAndAge(
      'DOB: 14/05/1994 | Age: 32 yrs | Gender: Female | Timestamp 2026-11-27 | Batch Qty: 4500'
    );
    expect(bio.map((m) => m.value)).toEqual(['14/05/1994', '32 yrs', 'Female']);

    const govIds = detectGovIds(
      'Passport No: K4829103 | Voter ID: MHZ1234567 | Ignore ticket SUP-44920 and 000-12-3456'
    );
    expect(govIds.map((m) => m.value)).toEqual(['K4829103', 'MHZ1234567']);

    const fin = detectFinancialIds(
      'IFSC: HDFC0001234 | UPI: siddharth@okicici | Bank Account No: 918273645512 | Ref INV2026884'
    );
    expect(fin.map((m) => m.value)).toEqual(['HDFC0001234', 'siddharth@okicici', '918273645512']);

    const secrets = detectDigitalSecrets(
      'token=ghp_9X7aK3mP2vQ8wR5tN4yB6cF1hJ0sL2dZ9xM4 password=DemoPass9941! url https://portal.example.in/cb?token=secret9981'
    );
    expect(secrets.length).toBeGreaterThanOrEqual(3);
    expect(secrets.some((s) => s.value.includes('ghp_'))).toBe(true);
    expect(secrets.some((s) => s.value === 'DemoPass9941!')).toBe(true);
    expect(secrets.some((s) => s.value.includes('token=secret9981'))).toBe(true);

    const locs = detectLocations(
      'Residential Address: Flat 402, MG Road, Pune | PIN Code: 411005 | Batch Qty: 4500'
    );
    expect(locs.map((m) => m.value)).toEqual(['Flat 402, MG Road, Pune', '411005']);

    // Custom regex + malformed regex resilience
    const custom = detectCustomRules('Badge EMP-88412 active.', [
      {
        id: 'r1',
        name: 'Badge ID',
        pattern: 'EMP-\\d{5}',
        replacementLabel: '[BADGE]',
        severity: 'HIGH',
        enabled: true,
      },
      {
        id: 'r2',
        name: 'Broken Regex',
        pattern: '[unclosed',
        replacementLabel: '[BAD]',
        severity: 'LOW',
        enabled: true,
      },
    ]);
    expect(custom.map((m) => m.value)).toEqual(['EMP-88412']);
  });

  it('supports REPLACE, REMOVE, and PSEUDONYM modes cleanly without corrupting offsets or leaking PII into risk reports', () => {
    const sample =
      'Holder: Rohan Deshmukh | Email: rohan@fintech.in | Phone: 9876543210 | IFSC: HDFC0001234';

    const replaced = processTextDocument(sample, 'REPLACE');
    expect(replaced.sanitizedText).toBe(
      'Holder: [PERSON_NAME] | Email: [EMAIL_ADDRESS] | Phone: [PHONE_NUMBER] | IFSC: [FINANCIAL_ID]'
    );

    const customLabelled = processTextDocument(sample, 'REPLACE', [], false, DEFAULT_ENABLED_CATEGORIES, {
      customLabels: { EMAIL: '<MAIL_MASKED>' },
    });
    expect(customLabelled.sanitizedText).toContain('<MAIL_MASKED>');

    const removed = processTextDocument('Call 9876543210 tomorrow.', 'REMOVE');
    expect(removed.sanitizedText).toBe('Call tomorrow.');

    const pseudo = processTextDocument(sample, 'PSEUDONYM');
    expect(pseudo.sanitizedText).toContain('PERSON_01');
    expect(pseudo.sanitizedText).toContain('USER_01');
    expect(pseudo.sanitizedText).toContain('PHONE_01');
    expect(pseudo.sanitizedText).toContain('FIN_01');

    // Genuine risk scoring & non-PII compliance report
    expect(pseudo.risk.overallRiskScore).toBeGreaterThan(25);
    expect(pseudo.risk.residualRiskScore).toBe(0);
    expect(pseudo.risk.explanations.join(' ')).not.toContain('Rohan Deshmukh');
    expect(pseudo.risk.explanations.join(' ')).not.toContain('rohan@fintech.in');

    const report = buildSanitizationReport({
      fileName: 'kyc-sample.txt',
      fileKind: 'text',
      redactionMode: 'PSEUDONYM',
      result: pseudo,
    });
    const markdown = formatSanitizationReportMarkdown(report);
    expect(markdown).toContain('kyc-sample.txt');
    expect(markdown).toContain('Risk Score Before Sanitization');
    expect(markdown).not.toContain('rohan@fintech.in');
    expect(markdown).not.toContain('HDFC0001234');
    expect(markdown).not.toContain('9876543210');

    // Every detection satisfies structured PrivacyGuard 2.0 schema
    const entities = detectAllEntities(sample);
    for (const e of entities) {
      expect(e.entityType).toBeTruthy();
      expect(e.classification).toBeTruthy();
      expect(e.confidenceScore).toBeGreaterThanOrEqual(70);
      expect(e.detectionMethod).toBeTruthy();
      expect(e.suggestedAction).toBeTruthy();
    }
  });

  it('supports Replace/Remove UI radios, Undo/Redo, and Severity filters in Workspace', async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole('button', { name: /Demo Access/i }));
    await user.click(screen.getByRole('button', { name: /^Workspace$/i }));

    // Load Credentials & URLs synthetic playground preset
    await user.click(screen.getByRole('button', { name: /Credentials & URLs/i }));
    await waitFor(() => {
      expect(screen.getByTestId('risk-score-badge')).toHaveTextContent(/Exposure Risk:/i);
      expect(Number(screen.getByTestId('total-entities-count').textContent)).toBeGreaterThanOrEqual(5);
    });

    // Switch to Replace Label mode & verify typed replacement
    await user.click(screen.getByRole('radio', { name: /Replace Label/i }));
    await waitFor(() => {
      const output = screen.getByLabelText(/Sanitized output document/i) as HTMLTextAreaElement;
      expect(output.value).toContain('[DIGITAL_CREDENTIAL]');
      expect(output.value).toContain('[EMAIL_ADDRESS]');
    });

    // Undo restores previous mode cleanly, Redo reapplies it
    await user.click(screen.getByRole('button', { name: /Undo last workspace change/i }));
    await waitFor(() => {
      const output = screen.getByLabelText(/Sanitized output document/i) as HTMLTextAreaElement;
      expect(output.value).toContain('[REDACTED]');
    });
    await user.click(screen.getByRole('button', { name: /Redo last workspace change/i }));
    await waitFor(() => {
      const output = screen.getByLabelText(/Sanitized output document/i) as HTMLTextAreaElement;
      expect(output.value).toContain('[DIGITAL_CREDENTIAL]');
    });

    // Search & filter findings by CRITICAL severity without leaking secrets
    fireEvent.change(screen.getByLabelText(/Filter by severity/i), {
      target: { value: 'CRITICAL' },
    });
    expect(screen.getAllByText(/API Token Signature Detector/i).length).toBeGreaterThanOrEqual(1);
  });

  it('supports Custom Rules tab, CSV per-cell toggles, and Compliance Report download', async () => {
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
    URL.createObjectURL = vi.fn().mockReturnValue('blob:pg-v2');
    URL.revokeObjectURL = vi.fn();

    render(<App />);
    await user.click(screen.getByRole('button', { name: /Demo Access/i }));
    await user.click(screen.getByRole('button', { name: /^Workspace$/i }));
    await user.click(screen.getByRole('button', { name: /Credentials & URLs/i }));

    // Custom Rules & Labels workbench tab
    await user.click(screen.getByRole('tab', { name: /Custom Rules & Labels/i }));
    fireEvent.change(screen.getByLabelText(/Rule name/i), {
      target: { value: 'Incident Tag' },
    });
    fireEvent.change(screen.getByLabelText(/Regular expression/i), {
      target: { value: 'CI/CD' },
    });
    fireEvent.change(screen.getByLabelText(/Replacement label/i), {
      target: { value: '[PIPELINE_NAME]' },
    });
    await user.click(screen.getByRole('button', { name: /Add custom rule/i }));
    await user.click(screen.getByRole('radio', { name: /Replace Label/i }));
    await waitFor(() => {
      const output = screen.getByLabelText(/Sanitized output document/i) as HTMLTextAreaElement;
      expect(output.value).toContain('[PIPELINE_NAME]');
    });

    // CSV per-cell Exclude / Redact toggle
    await user.click(screen.getByRole('button', { name: /CSV Export Sample/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Exclude row/i }).length).toBeGreaterThan(0);
    });
    const firstExcludeCellBtn = screen.getAllByRole('button', { name: /Exclude row/i })[0];
    await user.click(firstExcludeCellBtn);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Redact row/i }).length).toBeGreaterThan(0);
    });

    // Navigate to Documents & Reports and export Sanitization Report
    await user.click(screen.getByRole('button', { name: /^Documents$/i }));
    await user.click(screen.getByRole('button', { name: /Download Report \(\.md\)/i }));
    await waitFor(() => expect(capturedBlobs.length).toBeGreaterThanOrEqual(1));
    const reportMd = await capturedBlobs[capturedBlobs.length - 1].text();
    expect(reportMd).toContain('PRIVACYGUARD — SANITIZATION COMPLIANCE REPORT');
    expect(reportMd).not.toContain('shivam@example.com');
    expect(reportMd).not.toContain('ABCDE1234F');

    vi.unstubAllGlobals();
    anchorClickSpy.mockRestore();
  });
});
