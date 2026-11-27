import type { DetectionMatch } from '../../types/privacy';
import { isValidEmail } from '../validators/emailPhone';

const EMAIL_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9._%+-])([A-Za-z0-9][A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{0,63}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24})(?![A-Za-z0-9_%+-]|(?:\.[A-Za-z0-9]))/g;

export function detectEmails(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];
  EMAIL_CANDIDATE_REGEX.lastIndex = 0;

  let execResult: RegExpExecArray | null;
  while ((execResult = EMAIL_CANDIDATE_REGEX.exec(text)) !== null) {
    const candidate = execResult[1];
    const start = execResult.index;
    const end = start + candidate.length;

    if (isValidEmail(candidate)) {
      matches.push({
        id: `${prefix}-EMAIL-${start}-${end}`,
        category: 'EMAIL',
        entityType: 'Email Address',
        classification: 'Contact Information',
        severity: 'MEDIUM',
        value: candidate,
        start,
        end,
        validationStatus: 'VALIDATED',
        detectionSource: 'RFC Structural Email Validator',
        detectionMethod: 'Structural Validator',
        confidence: 'High',
        confidenceScore: 95,
        confidenceReason: 'Valid local-part syntax, domain labels, and alphabetic TLD',
        suggestedAction: 'PARTIAL_MASK',
      });
    }
  }

  return matches;
}
