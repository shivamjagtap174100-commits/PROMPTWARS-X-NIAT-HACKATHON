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
      const hasContext = /\b(?:aadhaar|uid|uidai|kyc)\b/i.test(
        text.slice(Math.max(0, start - 32), start)
      );
      matches.push({
        id: `${prefix}-AADHAAR-${start}-${end}`,
        category: 'AADHAAR',
        entityType: 'Aadhaar Format Number',
        classification: 'Government Identification',
        severity: 'CRITICAL',
        value: candidate,
        start,
        end,
        validationStatus: 'FORMAT_VALIDATED',
        detectionSource: 'Aadhaar 12-Digit Format Validator',
        detectionMethod: hasContext ? 'Context + Pattern' : 'Format Pattern Only',
        confidence: 'Format only',
        confidenceScore: hasContext ? 88 : 74,
        confidenceReason:
          'Matched 12-digit separator format (format detection only — not UIDAI verified)',
        suggestedAction: 'FULL_MASK',
      });
    }
  }

  return matches;
}
