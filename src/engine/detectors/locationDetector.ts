import type { DetectionMatch } from '../../types/privacy';

const LABELED_ADDRESS_REGEX =
  /\b(?:Residential\s+Address|Mailing\s+Address|Home\s+Address|Street\s+Address|Address|Location)\s*[:=-]\s*([^\r\n;|]{10,120})/gi;

const LABELED_PIN_REGEX =
  /\b(?:PIN(?:\s*Code)?|Pincode|Postal(?:\s*Code)?|ZIP(?:\s*Code)?)\s*[:=-]?\s*([1-9]\d{5}|\d{5}(?:-\d{4})?)\b/gi;

const CITY_PIN_REGEX =
  /\b((?:Pune|Mumbai|Delhi|New Delhi|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Ahmedabad|Jaipur|Surat|Noida|Gurugram|Thane|Nagpur|Kochi)\s*[-–,]?\s*[1-9]\d{5})\b/gi;

export function detectLocations(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];

  LABELED_ADDRESS_REGEX.lastIndex = 0;
  let addrRes: RegExpExecArray | null;
  while ((addrRes = LABELED_ADDRESS_REGEX.exec(text)) !== null) {
    const raw = addrRes[1];
    const value = raw.trim().replace(/[.\s]+$/, '');
    if (!value) continue;
    const rel = addrRes[0].indexOf(raw) + (raw.length - raw.trimStart().length);
    const start = addrRes.index + rel;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-LOCATION_ADDRESS-${start}-${end}`,
      category: 'LOCATION_ADDRESS',
      entityType: 'Residential / Street Address',
      classification: 'Location Information',
      severity: 'MEDIUM',
      value,
      start,
      end,
      validationStatus: 'CONTEXT_MATCHED',
      detectionSource: 'Address Context Detector',
      detectionMethod: 'Context + Pattern',
      confidence: 'Contextual',
      confidenceScore: 86,
      confidenceReason: 'Matched multi-token physical address following explicit Address/Location label',
      suggestedAction: 'REPLACE',
    });
  }

  LABELED_PIN_REGEX.lastIndex = 0;
  let pinRes: RegExpExecArray | null;
  while ((pinRes = LABELED_PIN_REGEX.exec(text)) !== null) {
    const value = pinRes[1];
    const rel = pinRes[0].indexOf(value);
    if (rel < 0 || !value) continue;
    const start = pinRes.index + rel;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-LOCATION_ADDRESS-${start}-${end}`,
      category: 'LOCATION_ADDRESS',
      entityType: 'Postal / PIN Code',
      classification: 'Location Information',
      severity: 'LOW',
      value,
      start,
      end,
      validationStatus: 'CONTEXT_MATCHED',
      detectionSource: 'Postal / PIN Code Validator',
      detectionMethod: 'Context + Pattern',
      confidence: 'Contextual',
      confidenceScore: 85,
      confidenceReason: 'Matched valid 6-digit Indian PIN or ZIP format with postal keyword',
      suggestedAction: 'FULL_MASK',
    });
  }

  CITY_PIN_REGEX.lastIndex = 0;
  let cityPin: RegExpExecArray | null;
  while ((cityPin = CITY_PIN_REGEX.exec(text)) !== null) {
    const value = cityPin[1];
    const start = cityPin.index;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-LOCATION_ADDRESS-${start}-${end}`,
      category: 'LOCATION_ADDRESS',
      entityType: 'City & PIN Pair',
      classification: 'Location Information',
      severity: 'LOW',
      value,
      start,
      end,
      validationStatus: 'VALIDATED',
      detectionSource: 'City-PIN Geographic Pair Detector',
      detectionMethod: 'Context + Pattern',
      confidence: 'High',
      confidenceScore: 88,
      confidenceReason: 'Matched recognized city paired directly with 6-digit Indian PIN code',
      suggestedAction: 'REPLACE',
    });
  }

  return matches;
}
