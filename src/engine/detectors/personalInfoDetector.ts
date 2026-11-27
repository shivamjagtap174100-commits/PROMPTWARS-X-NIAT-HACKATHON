import type { DetectionMatch, SensitivityLevel } from '../../types/privacy';

const EXCLUDED_NON_PERSON_WORDS = new Set([
  'pvt',
  'ltd',
  'limited',
  'inc',
  'llc',
  'corp',
  'corporation',
  'systems',
  'services',
  'solutions',
  'technologies',
  'environment',
  'gateway',
  'server',
  'unknown',
  'none',
  'null',
  'pending',
  'active',
  'verified',
  'completed',
  'rejected',
  'default',
  'admin',
  'untitled',
  'document',
  'sample',
  'internal',
  'ticket',
  'invoice',
  'primary',
  'secondary',
]);

const LABELED_PERSON_REGEX =
  /\b(?:(?:Customer|Full|Patient|Applicant|Employee|Candidate|Contact|Authorized)\s+Name|Authorized\s+Signatory|Signatory|Account\s+Holder|Holder|Patient|Employee|Applicant|Candidate|Agent|Director|Reported\s+by|Signed\s+by|Name)\s*[:=-]\s*([^\r\n,;|(\d@]{2,48})/gi;

const TITLE_PERSON_REGEX =
  /\b(?:Mr|Mrs|Ms|Miss|Dr|Prof|Shri|Smt|Adv)\.?[ \t]+(\p{Lu}\p{Ll}{1,24}(?:[ \t]+\p{Lu}\p{Ll}{1,24}){1,2})\b/gu;

const STANDALONE_TWO_WORD_NAME_REGEX =
  /\b(\p{Lu}\p{Ll}{1,20}(?:\s+\p{Lu}\p{Ll}{1,20}){1,2})\b/gu;

const CONTEXTUAL_DOB_REGEX =
  /\b(?:DOB|D\.O\.B|Date\s+of\s+Birth|Birth\s*Date|Born(?:\s+on)?)\s*[:=-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;

const CONTEXTUAL_AGE_REGEX = /\bAge\s*[:=-]\s*(\d{1,3}(?:\s*(?:years?|yrs?))?)\b/gi;

const CONTEXTUAL_GENDER_REGEX =
  /\b(?:Gender|Sex)\s*[:=-]\s*(Male|Female|Non-binary|Transgender|Other)\b/gi;

function isPlausiblePersonName(candidate: string): boolean {
  const cleaned = candidate.trim();
  if (!cleaned || /[@\d:/\\[\]{}]/.test(cleaned)) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;

  let capitalizedWords = 0;
  for (const word of words) {
    const bare = word.replace(/[.,'-]/g, '').toLowerCase();
    if (!bare || EXCLUDED_NON_PERSON_WORDS.has(bare)) return false;
    if (/^\p{Lu}/u.test(word)) {
      capitalizedWords += 1;
    }
  }

  return capitalizedWords >= 2;
}

export function detectPersonNames(
  text: string,
  prefix = 'text',
  sensitivity: SensitivityLevel = 'BALANCED',
  columnHeader?: string
): DetectionMatch[] {
  const matches: DetectionMatch[] = [];
  const seenSpans = new Set<string>();

  const pushName = (raw: string, start: number, method: 'Context + Pattern' | 'Local Heuristic NER', score: number, reason: string) => {
    const trimmed = raw.trim().replace(/[.\s]+$/, '');
    if (!trimmed) return;
    const leadSpaces = raw.length - raw.trimStart().length;
    const s = start + leadSpaces;
    const e = s + trimmed.length;
    const spanKey = `${s}-${e}`;
    if (seenSpans.has(spanKey) || !isPlausiblePersonName(trimmed)) return;
    seenSpans.add(spanKey);

    matches.push({
      id: `${prefix}-PERSON_NAME-${s}-${e}`,
      category: 'PERSON_NAME',
      entityType: 'Personal Name',
      classification: 'Personal Identity',
      severity: 'MEDIUM',
      value: trimmed,
      start: s,
      end: e,
      validationStatus: 'CONTEXT_MATCHED',
      detectionSource: 'Local Heuristic Person NER',
      detectionMethod: method,
      confidence: method === 'Context + Pattern' ? 'Contextual' : 'Format only',
      confidenceScore: score,
      confidenceReason: reason,
      suggestedAction: 'PSEUDONYM',
    });
  };

  LABELED_PERSON_REGEX.lastIndex = 0;
  let labeled: RegExpExecArray | null;
  while ((labeled = LABELED_PERSON_REGEX.exec(text)) !== null) {
    const captured = labeled[1];
    // Cut cleanly before trailing pipe/label delimiters
    const truncated = captured.split(/\s+\|\s+|\s{2,}/)[0] || '';
    const rel = labeled[0].indexOf(captured);
    if (rel >= 0 && truncated) {
      pushName(
        truncated,
        labeled.index + rel,
        'Context + Pattern',
        87,
        'Identified capitalized personal name immediately following an identity label'
      );
    }
  }

  TITLE_PERSON_REGEX.lastIndex = 0;
  let titled: RegExpExecArray | null;
  while ((titled = TITLE_PERSON_REGEX.exec(text)) !== null) {
    const captured = titled[1];
    const rel = titled[0].indexOf(captured);
    if (rel >= 0 && captured) {
      pushName(
        captured,
        titled.index + rel,
        'Local Heuristic NER',
        85,
        'Identified full name following an honorific salutation (Mr./Ms./Dr./Shri)'
      );
    }
  }

  if (
    sensitivity === 'STRICT' &&
    columnHeader &&
    /\b(?:name|customer|employee|patient|owner|applicant|contact)\b/i.test(columnHeader)
  ) {
    STANDALONE_TWO_WORD_NAME_REGEX.lastIndex = 0;
    let cellName: RegExpExecArray | null;
    while ((cellName = STANDALONE_TWO_WORD_NAME_REGEX.exec(text)) !== null) {
      pushName(
        cellName[1],
        cellName.index,
        'Local Heuristic NER',
        76,
        `Strict column-aware NER matched capitalized name in "${columnHeader}" column`
      );
    }
  }

  return matches;
}

export function detectDobAndAge(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];

  const scanContext = (
    regex: RegExp,
    entityType: string,
    score: number,
    reason: string,
    severity: DetectionMatch['severity']
  ) => {
    regex.lastIndex = 0;
    let execRes: RegExpExecArray | null;
    while ((execRes = regex.exec(text)) !== null) {
      const value = execRes[1];
      const rel = execRes[0].indexOf(value);
      if (rel < 0 || !value) continue;
      const start = execRes.index + rel;
      const end = start + value.length;
      matches.push({
        id: `${prefix}-DOB_AGE-${start}-${end}`,
        category: 'DOB_AGE',
        entityType,
        classification: 'Personal Identity',
        severity,
        value,
        start,
        end,
        validationStatus: 'CONTEXT_MATCHED',
        detectionSource: 'Demographic Context Detector',
        detectionMethod: 'Context + Pattern',
        confidence: 'Contextual',
        confidenceScore: score,
        confidenceReason: reason,
        suggestedAction: 'FULL_MASK',
      });
    }
  };

  scanContext(
    CONTEXTUAL_DOB_REGEX,
    'Date of Birth',
    91,
    'Matched explicit DOB / Birth Date keyword followed by formatted calendar date',
    'HIGH'
  );
  scanContext(
    CONTEXTUAL_AGE_REGEX,
    'Age Attribute',
    82,
    'Matched explicit Age field label',
    'LOW'
  );
  scanContext(
    CONTEXTUAL_GENDER_REGEX,
    'Gender Identifier',
    80,
    'Matched explicit Gender / Sex demographic label',
    'LOW'
  );

  return matches;
}
