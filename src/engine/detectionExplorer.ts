import type { DetectionMatch, EntityCategory } from '../types/privacy';
import { detectAadhaar } from './detectors/aadhaarDetector';
import { detectCreditCards } from './detectors/creditCardDetector';
import { detectEmails } from './detectors/emailDetector';
import { detectIps } from './detectors/ipDetector';
import { detectPans } from './detectors/panDetector';
import { detectPhones } from './detectors/phoneDetector';

export interface DetectionRuleDefinition {
  category: EntityCategory;
  modulePath: string;
  validatorName: string;
  patternSummary: string;
  validationScope: string;
  validSamples: string[];
  rejectedSamples: string[];
}

export const DETECTION_RULE_DEFINITIONS: DetectionRuleDefinition[] = [
  {
    category: 'EMAIL',
    modulePath: 'src/engine/detectors/emailDetector.ts',
    validatorName: 'RFC Structural Email Validator',
    patternSummary: 'Local part (<=64 chars) @ valid multi-label domain . TLD (2–24 letters)',
    validationScope: 'Checks boundary isolation, local/domain octet lengths, and TLD syntax',
    validSamples: ['ananya.deshmukh@fintech.in', 'sec-ops+alert@company.co.uk'],
    rejectedSamples: ['invalid-email@', 'missing-tld@localhost'],
  },
  {
    category: 'PHONE',
    modulePath: 'src/engine/detectors/phoneDetector.ts',
    validatorName: 'Indian & International Phone Validator',
    patternSummary: 'Indian (+91 / 0 / 6–9 prefix 10 digits) and ITU international E.164 groups',
    validationScope: 'Excludes plain numeric IDs, order numbers, dates, and repeating digit spam',
    validSamples: ['+91 98765 43210', '987-654-3210', '+1 (415) 555-0192'],
    rejectedSamples: ['123-456-7890', '4500129901', '2026-11-27'],
  },
  {
    category: 'IP',
    modulePath: 'src/engine/detectors/ipDetector.ts',
    validatorName: 'Strict IPv4 Octet & IPv6 Validator',
    patternSummary: 'IPv4 0–255 dotted quads (including :port suffix) and full/compressed (::) IPv6',
    validationScope: 'Verifies numeric range 0..255 per octet; rejects malformed versions like v1.2.3.4.5',
    validSamples: ['192.168.1.45', '10.0.0.1:8080', '2001:db8::1'],
    rejectedSamples: ['999.312.10.1', '1.2.3.4.5'],
  },
  {
    category: 'PAN',
    modulePath: 'src/engine/detectors/panDetector.ts',
    validatorName: 'Indian PAN Structure Validator',
    patternSummary: '[A-Z]{5}[0-9]{4}[A-Z] surrounded by strict alphanumeric boundaries',
    validationScope: 'Format pattern detection only (never verifies against external NSDL registry)',
    validSamples: ['ABCDE1234F', 'ZZZPK9988M'],
    rejectedSamples: ['ABCD1234F', 'ABCDE12345'],
  },
  {
    category: 'AADHAAR',
    modulePath: 'src/engine/detectors/aadhaarDetector.ts',
    validatorName: 'Aadhaar 12-Digit Format Validator',
    patternSummary: '12 digits in grouped 4-4-4 space/hyphen or contiguous 12-digit blocks',
    validationScope: 'Structural format validation only (no UIDAI registry verification)',
    validSamples: ['2345 6789 0123', '3456-7890-1234'],
    rejectedSamples: ['0000 0000 0000', '1234567890'],
  },
  {
    category: 'CREDIT_CARD',
    modulePath: 'src/engine/detectors/creditCardDetector.ts',
    validatorName: 'ISO/IEC 7812 Luhn Checksum Validator',
    patternSummary: '13–19 digits (with optional space/hyphen separators) passing Luhn mod-10',
    validationScope: 'Mathematical Luhn checksum verification prevents false positives on reference IDs',
    validSamples: ['4111-1111-1111-1111', '5500000000000004'],
    rejectedSamples: ['4111-1111-1111-1112', '9812345678901234'],
  },
];

export function inspectInputWithRule(
  category: EntityCategory,
  sampleText: string
): DetectionMatch[] {
  if (!sampleText) return [];
  switch (category) {
    case 'EMAIL':
      return detectEmails(sampleText, 'sandbox');
    case 'PHONE':
      return detectPhones(sampleText, 'sandbox');
    case 'IP':
      return detectIps(sampleText, 'sandbox');
    case 'PAN':
      return detectPans(sampleText, 'sandbox');
    case 'AADHAAR':
      return detectAadhaar(sampleText, 'sandbox');
    case 'CREDIT_CARD':
      return detectCreditCards(sampleText, 'sandbox');
  }
}
