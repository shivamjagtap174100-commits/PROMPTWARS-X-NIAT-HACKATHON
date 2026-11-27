import type { DetectionMatch } from '../../types/privacy';
import { isValidCreditCard } from '../validators/luhn';

const CARD_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9.+]|(?:\d[ -]))(\d(?:[ -]?\d){12,18})(?![A-Za-z0-9-]|(?:[ -]\d)|(?:\.\d))/g;

export function detectCreditCards(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];
  CARD_CANDIDATE_REGEX.lastIndex = 0;

  let execResult: RegExpExecArray | null;
  while ((execResult = CARD_CANDIDATE_REGEX.exec(text)) !== null) {
    const candidate = execResult[1];
    const start = execResult.index;
    const end = start + candidate.length;

    if (isValidCreditCard(candidate)) {
      matches.push({
        id: `${prefix}-CREDIT_CARD-${start}-${end}`,
        category: 'CREDIT_CARD',
        value: candidate,
        start,
        end,
        validationStatus: 'VALIDATED',
        detectionSource: 'ISO/IEC 7812 Luhn Checksum Validator',
        confidence: 'High',
        confidenceReason:
          'Passed 13–19 digit length bounds and ISO/IEC 7812 Luhn mod-10 checksum (format check only)',
      });
    }
  }

  return matches;
}
