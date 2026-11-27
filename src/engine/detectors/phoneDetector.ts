import type { DetectionMatch } from '../../types/privacy';
import { isValidPhone } from '../validators/emailPhone';

const PHONE_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9.+]|(?:\d[ -]))(\+\d{1,3}[ -]?(?:\(\d{2,4}\)[ -]?)?(?:\d[ -]?){6,13}\d|\(\d{3,4}\)[ -]?\d{3,4}[ -]?\d{4}|(?:(?:0|91)[ -]?)?[6-9]\d{4}[ -]?\d{5}|(?:(?:0|91)[ -]?)?[6-9]\d{2}[ -]?\d{3}[ -]?\d{4}|(?:(?:0|91)[ -]?)?[6-9]\d{3}[ -]?\d{3}[ -]?\d{3}|(?:(?:0|91)[ -]?)?[6-9]\d{9})(?![A-Za-z0-9]|(?:[ -]\d)|(?:\.\d))/g;

export function detectPhones(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];
  PHONE_CANDIDATE_REGEX.lastIndex = 0;

  let execResult: RegExpExecArray | null;
  while ((execResult = PHONE_CANDIDATE_REGEX.exec(text)) !== null) {
    const raw = execResult[1];
    const candidate = raw.trimEnd();
    if (!candidate) continue;

    const start = execResult.index;
    const end = start + candidate.length;

    if (isValidPhone(candidate)) {
      const isIndian =
        candidate.startsWith('+91') || /^(?:0|91)?[6-9]/.test(candidate.replace(/\D/g, ''));
      const hasIntlPrefix = candidate.startsWith('+');
      matches.push({
        id: `${prefix}-PHONE-${start}-${end}`,
        category: 'PHONE',
        entityType: isIndian ? 'Indian Mobile Number' : 'International Phone Number',
        classification: 'Contact Information',
        severity: 'MEDIUM',
        value: candidate,
        start,
        end,
        validationStatus: 'VALIDATED',
        detectionSource: 'Indian / E.164 Phone Validator',
        detectionMethod: 'Structural Validator',
        confidence: 'High',
        confidenceScore: hasIntlPrefix ? 96 : isIndian ? 92 : 90,
        confidenceReason: isIndian
          ? 'Matched Indian mobile (+91 / 6–9 prefix) numbering structure'
          : 'Matched E.164 international dialing code and digit length',
        suggestedAction: 'PARTIAL_MASK',
      });
    }
  }

  return matches;
}
