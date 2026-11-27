import type { DetectionMatch } from '../../types/privacy';
import { isValidPan } from '../validators/indianIds';

const PAN_CANDIDATE_REGEX = /(?<![A-Za-z0-9])([A-Z]{5}[0-9]{4}[A-Z])(?![A-Za-z0-9])/g;

export function detectPans(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];
  PAN_CANDIDATE_REGEX.lastIndex = 0;

  let execResult: RegExpExecArray | null;
  while ((execResult = PAN_CANDIDATE_REGEX.exec(text)) !== null) {
    const candidate = execResult[1];
    const start = execResult.index;
    const end = start + candidate.length;

    if (isValidPan(candidate)) {
      const hasPanContext = /\b(?:pan|tax|kyc)\b/i.test(text.slice(Math.max(0, start - 24), start));
      matches.push({
        id: `${prefix}-PAN-${start}-${end}`,
        category: 'PAN',
        entityType: 'Indian PAN Identifier',
        classification: 'Government Identification',
        severity: 'HIGH',
        value: candidate,
        start,
        end,
        validationStatus: 'FORMAT_VALIDATED',
        detectionSource: 'Indian PAN Structure Validator',
        detectionMethod: hasPanContext ? 'Context + Pattern' : 'Format Pattern Only',
        confidence: 'Format only',
        confidenceScore: hasPanContext ? 89 : 79,
        confidenceReason:
          'Matched [A-Z]{5}[0-9]{4}[A-Z] pattern (format detection only, not registry verified)',
        suggestedAction: 'FULL_MASK',
      });
    }
  }

  return matches;
}
