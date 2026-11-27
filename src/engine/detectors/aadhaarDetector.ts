import type { DetectionMatch } from '../../types/privacy';
import { isValidAadhaarFormat } from '../validators/indianIds';

const AADHAAR_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9.+]|(?:\d[ -]))(\d{4}[ -]?\d{4}[ -]?\d{4})(?![A-Za-z0-9-]|(?:[ -]\d)|(?:\.\d))/g;

export function detectAadhaar(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];
  AADHAAR_CANDIDATE_REGEX.lastIndex = 0;

  let execResult: RegExpExecArray | null;
  while ((execResult = AADHAAR_CANDIDATE_REGEX.exec(text)) !== null) {
    const candidate = execResult[1];
    const start = execResult.index;
    const end = start + candidate.length;

    if (isValidAadhaarFormat(candidate)) {
      matches.push({
        id: `${prefix}-AADHAAR-${start}-${end}`,
        category: 'AADHAAR',
        value: candidate,
        start,
        end,
        validationStatus: 'FORMAT_VALIDATED',
        detectionSource: 'Aadhaar 12-Digit Format Validator',
        confidence: 'Format only',
        confidenceReason:
          'Matched 12-digit separator format (format detection only — not UIDAI verified)',
      });
    }
  }

  return matches;
}
