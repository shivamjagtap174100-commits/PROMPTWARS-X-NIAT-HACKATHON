import { describe, expect, it } from 'vitest';
import { processTextDocument } from '../engine/pipeline';
import { PseudonymizationManager } from '../engine/redaction/pseudonymManager';

describe('Redaction Engine & Consistent Pseudonymization', () => {
  it('applies FULL_MASK across all categories cleanly', () => {
    const input = 'Contact shivam@example.com or 9876543210 with PAN ABCDE1234F.';
    const res = processTextDocument(input, 'FULL_MASK');

    expect(res.sanitizedText).toBe('Contact [REDACTED] or [REDACTED] with PAN [REDACTED].');
    expect(res.counts.total).toBe(3);
  });

  it('applies category-specific PARTIAL_MASK rules accurately', () => {
    const input =
      'Email shivam@example.com Phone 9876543210 PAN ABCDE1234F Card 4111111111111111 Aadhaar 2345 6789 0123 IP 192.168.1.45';
    const res = processTextDocument(input, 'PARTIAL_MASK');

    expect(res.sanitizedText).toContain('sh***@example.com');
    expect(res.sanitizedText).toContain('XXXXXX3210');
    expect(res.sanitizedText).toContain('XXXXX1234F');
    expect(res.sanitizedText).toContain('XXXX-XXXX-XXXX-1111');
    expect(res.sanitizedText).toContain('XXXX XXXX 0123');
    expect(res.sanitizedText).toContain('192.168.XXX.XXX');
  });

  it('enforces consistent pseudonymization with separate category counters', () => {
    const input = [
      'Primary: shivam@example.com | Secondary: support@company.in | Repeat: shivam@example.com',
      'Phone1: 9876543210 | Phone2: +91 98111 22333 | RepeatPhone: 9876543210',
      'PAN: ABCDE1234F | RepeatPAN: ABCDE1234F | IP: 192.168.1.45',
    ].join('\n');

    const res = processTextDocument(input, 'PSEUDONYM');

    expect(res.sanitizedText).toContain('Primary: USER_01 | Secondary: USER_02 | Repeat: USER_01');
    expect(res.sanitizedText).toContain('Phone1: PHONE_01 | Phone2: PHONE_02 | RepeatPhone: PHONE_01');
    expect(res.sanitizedText).toContain('PAN: PAN_01 | RepeatPAN: PAN_01 | IP: IP_01');
  });

  it('respects individual entity exclusions and adjusts active counts', () => {
    const input = 'Keep support@company.in visible, mask shivam@example.com.';
    const initial = processTextDocument(input, 'FULL_MASK');
    expect(initial.counts.EMAIL).toBe(2);

    const supportMatch = initial.matches.find((m) => m.value === 'support@company.in')!;
    const afterExclude = processTextDocument(input, 'FULL_MASK', [supportMatch.id]);

    expect(afterExclude.sanitizedText).toBe('Keep support@company.in visible, mask [REDACTED].');
    expect(afterExclude.counts.EMAIL).toBe(1);
    expect(afterExclude.excludedCount).toBe(1);
  });

  it('resets PseudonymizationManager counters and mappings cleanly', () => {
    const mgr = new PseudonymizationManager();
    expect(mgr.getPlaceholder('EMAIL', 'a@example.com')).toBe('USER_01');
    expect(mgr.getPlaceholder('EMAIL', 'b@example.com')).toBe('USER_02');
    expect(mgr.getPlaceholder('EMAIL', 'A@example.com')).toBe('USER_01');
    expect(mgr.getUniqueMappingCount()).toBe(2);

    mgr.reset();
    expect(mgr.getUniqueMappingCount()).toBe(0);
    expect(mgr.getPlaceholder('EMAIL', 'b@example.com')).toBe('USER_01');
  });
});
