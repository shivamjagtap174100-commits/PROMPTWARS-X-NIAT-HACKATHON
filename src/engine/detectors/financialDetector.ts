import type { DetectionMatch } from '../../types/privacy';

const IFSC_REGEX = /(?<![A-Za-z0-9])([A-Z]{4}0[A-Z0-9]{6})(?![A-Za-z0-9])/g;

const UPI_REGEX =
  /(?<![A-Za-z0-9._%+-])([A-Za-z0-9][A-Za-z0-9._-]{1,48}@(?:okicici|okaxis|okhdfcbank|oksbi|ybl|ibl|axl|paytm|upi|icici|hdfcbank|sbi|kotak|fbl|jupiteraxis|indus|barodampay|pingpay|hsbc|waaxis|wahdfcbank|waicici|wasbi))(?![A-Za-z0-9._-])/gi;

const BANK_ACCOUNT_CONTEXT_REGEX =
  /\b(?:Bank\s*Account(?:\s*(?:No\.?|Number|#))?|Account(?:\s*(?:No\.?|Number|#))|A\/c(?:\s*No\.?)?|IBAN)\s*[:=-]?\s*([A-Z]{2}\d{2}[A-Z0-9]{11,28}|\d(?:[ -]?\d){8,17})\b/gi;

export function detectFinancialIds(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];

  IFSC_REGEX.lastIndex = 0;
  let ifscRes: RegExpExecArray | null;
  while ((ifscRes = IFSC_REGEX.exec(text)) !== null) {
    const value = ifscRes[1];
    const start = ifscRes.index;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-FINANCIAL_ID-${start}-${end}`,
      category: 'FINANCIAL_ID',
      entityType: 'Indian IFSC Code',
      classification: 'Financial Information',
      severity: 'HIGH',
      value,
      start,
      end,
      validationStatus: 'VALIDATED',
      detectionSource: 'RBI IFSC Branch Code Validator',
      detectionMethod: 'Structural Validator',
      confidence: 'High',
      confidenceScore: 91,
      confidenceReason: 'Matched 11-char IFSC specification (4 alpha bank + 0 + 6 branch chars)',
      suggestedAction: 'PARTIAL_MASK',
    });
  }

  UPI_REGEX.lastIndex = 0;
  let upiRes: RegExpExecArray | null;
  while ((upiRes = UPI_REGEX.exec(text)) !== null) {
    const value = upiRes[1];
    const start = upiRes.index;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-FINANCIAL_ID-${start}-${end}`,
      category: 'FINANCIAL_ID',
      entityType: 'UPI Virtual Payment Address',
      classification: 'Financial Information',
      severity: 'HIGH',
      value,
      start,
      end,
      validationStatus: 'VALIDATED',
      detectionSource: 'NPCI UPI Handle Validator',
      detectionMethod: 'Structural Validator',
      confidence: 'High',
      confidenceScore: 93,
      confidenceReason: 'Matched verified Indian PSP UPI Virtual Payment Address handle',
      suggestedAction: 'PARTIAL_MASK',
    });
  }

  BANK_ACCOUNT_CONTEXT_REGEX.lastIndex = 0;
  let acctRes: RegExpExecArray | null;
  while ((acctRes = BANK_ACCOUNT_CONTEXT_REGEX.exec(text)) !== null) {
    const value = acctRes[1];
    const rel = acctRes[0].indexOf(value);
    if (rel < 0 || !value) continue;
    const start = acctRes.index + rel;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-FINANCIAL_ID-${start}-${end}`,
      category: 'FINANCIAL_ID',
      entityType: /^[A-Z]{2}/.test(value) ? 'IBAN Account Number' : 'Bank Account Number',
      classification: 'Financial Information',
      severity: 'CRITICAL',
      value,
      start,
      end,
      validationStatus: 'CONTEXT_MATCHED',
      detectionSource: 'Bank Account / IBAN Context Validator',
      detectionMethod: 'Context + Pattern',
      confidence: 'Contextual',
      confidenceScore: 88,
      confidenceReason: 'Matched account digit / IBAN sequence anchored by explicit banking label',
      suggestedAction: 'PARTIAL_MASK',
    });
  }

  return matches;
}
