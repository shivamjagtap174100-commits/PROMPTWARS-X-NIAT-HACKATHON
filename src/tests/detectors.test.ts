import { describe, expect, it } from 'vitest';
import { detectAadhaar } from '../engine/detectors/aadhaarDetector';
import { detectCreditCards } from '../engine/detectors/creditCardDetector';
import { detectAllEntities } from '../engine/detectors/detectAll';
import { detectEmails } from '../engine/detectors/emailDetector';
import { detectIps } from '../engine/detectors/ipDetector';
import { detectPans } from '../engine/detectors/panDetector';
import { detectPhones } from '../engine/detectors/phoneDetector';
import { isValidIPv4, isValidIPv6 } from '../engine/validators/ip';
import { isValidCreditCard, isValidLuhn } from '../engine/validators/luhn';

describe('Six-Category PII Detection & Validation Engine', () => {
  it('detects valid emails and rejects malformed email candidates', () => {
    const sample =
      'Reach shivam@example.com, support@company.in, user.name@example.org. Bad: user@, @domain.com, user..name@example.com, test@internal, test@domain.123';
    const matches = detectEmails(sample);

    expect(matches.map((m) => m.value)).toEqual([
      'shivam@example.com',
      'support@company.in',
      'user.name@example.org',
    ]);
  });

  it('detects Indian and international phone numbers while rejecting unrelated numbers', () => {
    const sample =
      'Mobile: 9876543210, IN: +91 98765 43210, US: +1 (415) 555-0192, UK: +44 20 7946 0958. Ignore order 1234567890, 4500129901, date 2026-11-27, qty 4500.';
    const matches = detectPhones(sample);

    expect(matches.map((m) => m.value)).toEqual([
      '9876543210',
      '+91 98765 43210',
      '+1 (415) 555-0192',
      '+44 20 7946 0958',
    ]);
  });

  it('validates strict IPv4 octets and rejects invalid IPv4 sequences', () => {
    expect(isValidIPv4('192.168.1.45')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('256.10.1.1')).toBe(false);
    expect(isValidIPv4('999.312.10.1')).toBe(false);
    expect(isValidIPv4('01.2.3.4')).toBe(false);

    const matches = detectIps('Host 192.168.1.45 bad 999.10.20.30 ver 1.2.3.4.5');
    expect(matches.map((m) => m.value)).toEqual(['192.168.1.45']);
  });

  it('validates full, compressed, and IPv4-mapped IPv6 addresses while rejecting timestamps', () => {
    expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isValidIPv6('2001:db8::1')).toBe(true);
    expect(isValidIPv6('::1')).toBe(true);
    expect(isValidIPv6('::ffff:192.0.2.128')).toBe(true);
    expect(isValidIPv6('10:24:01')).toBe(false);
    expect(isValidIPv6('2001::db8::1')).toBe(false);
    expect(isValidIPv6('gggg::1')).toBe(false);

    const matches = detectIps(
      'Log [10:24:01] v6 2001:db8::1 full 2001:0db8:85a3:0000:0000:8a2e:0370:7334'
    );
    expect(matches.map((m) => m.value)).toEqual([
      '2001:db8::1',
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    ]);
  });

  it('detects Indian PAN format and rejects malformed PAN strings', () => {
    const matches = detectPans('Valid PAN: ABCDE1234F. Invalid: ABCD1234F abcde1234f ABCDE12345');
    expect(matches.map((m) => m.value)).toEqual(['ABCDE1234F']);
  });

  it('detects Aadhaar-format 12-digit numbers with spaces/hyphens and rejects zeros', () => {
    const matches = detectAadhaar('IDs: 2345 6789 0123 and 3456-7890-1234. Invalid: 0000 0000 0000');
    expect(matches.map((m) => m.value)).toEqual(['2345 6789 0123', '3456-7890-1234']);
  });

  it('validates credit cards strictly via Luhn and rejects invalid 16-digit numbers', () => {
    expect(isValidLuhn('4111111111111111')).toBe(true);
    expect(isValidLuhn('5500000000000004')).toBe(true);
    expect(isValidLuhn('378282246310005')).toBe(true);
    expect(isValidLuhn('4111111111111112')).toBe(false);
    expect(isValidLuhn('1234567890123456')).toBe(false);
    expect(isValidCreditCard('0000-0000-0000-0000')).toBe(false);

    const matches = detectCreditCards(
      'Card1: 4111-1111-1111-1111 Card2: 5500000000000004 Bad: 4111-1111-1111-1112 Random: 9812345678901234'
    );
    expect(matches.map((m) => m.value)).toEqual(['4111-1111-1111-1111', '5500000000000004']);
  });

  it('resolves overlapping matches cleanly without double-counting', () => {
    const text =
      'Email with digits user9876543210@example.com, Card 4111-1111-1111-1111, Phone +91 98765 43210';
    const matches = detectAllEntities(text);

    expect(matches).toHaveLength(3);
    expect(matches.map((m) => m.category)).toEqual(['EMAIL', 'CREDIT_CARD', 'PHONE']);
  });
});
