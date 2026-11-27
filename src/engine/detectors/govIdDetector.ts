import type { DetectionMatch } from '../../types/privacy';

const PASSPORT_CONTEXT_REGEX =
  /\b(?:Passport(?:\s*(?:No\.?|Number|ID|#))?)\s*[:=-]\s*([A-PR-WY][1-9]\d{6})\b/gi;

const VOTER_CONTEXT_REGEX =
  /\b(?:Voter\s*ID|EPIC(?:\s*(?:No\.?|Number))?)\s*[:=-]\s*([A-Z]{3}\d{7})\b/gi;

const DL_CONTEXT_REGEX =
  /\b(?:DL(?:\s*No\.?)?|Driving\s*Licen[cs]e(?:\s*(?:No\.?|Number))?)\s*[:=-]\s*([A-Z]{2}[ -]?\d{2}[ -]?(?:19|20)?\d{2}\d{7})\b/gi;

const SSN_REGEX =
  /(?<![A-Za-z0-9-])((?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4})(?![A-Za-z0-9-])/g;

export function detectGovIds(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];

  const captureContextual = (
    regex: RegExp,
    entityType: string,
    score: number,
    reason: string,
    severity: DetectionMatch['severity']
  ) => {
    regex.lastIndex = 0;
    let res: RegExpExecArray | null;
    while ((res = regex.exec(text)) !== null) {
      const value = res[1];
      const rel = res[0].indexOf(value);
      if (rel < 0 || !value) continue;
      const start = res.index + rel;
      const end = start + value.length;
      matches.push({
        id: `${prefix}-GOV_ID-${start}-${end}`,
        category: 'GOV_ID',
        entityType,
        classification: 'Government Identification',
        severity,
        value,
        start,
        end,
        validationStatus: 'FORMAT_VALIDATED',
        detectionSource: 'Government ID Format & Context Validator',
        detectionMethod: 'Context + Pattern',
        confidence: 'Contextual',
        confidenceScore: score,
        confidenceReason: reason,
        suggestedAction: 'FULL_MASK',
      });
    }
  };

  captureContextual(
    PASSPORT_CONTEXT_REGEX,
    'Passport Number',
    89,
    'Matched Indian Passport structure [A-PR-WY][1-9]\\d{6} with explicit Passport context',
    'CRITICAL'
  );
  captureContextual(
    VOTER_CONTEXT_REGEX,
    'Voter ID / EPIC',
    86,
    'Matched [A-Z]{3}\\d{7} format with explicit Voter/EPIC label',
    'HIGH'
  );
  captureContextual(
    DL_CONTEXT_REGEX,
    'Driving License Number',
    85,
    'Matched state-coded Driving License syntax with explicit DL context',
    'HIGH'
  );

  SSN_REGEX.lastIndex = 0;
  let ssnRes: RegExpExecArray | null;
  while ((ssnRes = SSN_REGEX.exec(text)) !== null) {
    const value = ssnRes[1];
    const start = ssnRes.index;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-GOV_ID-${start}-${end}`,
      category: 'GOV_ID',
      entityType: 'SSN Identifier Format',
      classification: 'Government Identification',
      severity: 'CRITICAL',
      value,
      start,
      end,
      validationStatus: 'FORMAT_VALIDATED',
      detectionSource: 'SSN Area-Group-Serial Structure Validator',
      detectionMethod: 'Format Pattern Only',
      confidence: 'Format only',
      confidenceScore: 84,
      confidenceReason:
        'Matched XXX-XX-XXXX national ID pattern excluding reserved 000/666/9XX ranges',
      suggestedAction: 'FULL_MASK',
    });
  }

  return matches;
}
