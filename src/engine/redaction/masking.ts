import type { CustomLabelsMap, EntityCategory, RedactionMode } from '../../types/privacy';
import { CATEGORY_META } from '../../utils/categoryTheme';
import { normalizeCardDigits } from '../validators/luhn';
import type { PseudonymizationManager } from './pseudonymManager';

function maskEmailPartial(value: string): string {
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) return '[REDACTED]';
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  const visiblePrefix = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visiblePrefix}***@${domain}`;
}

function maskPhonePartial(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length <= 4) return 'XXXX';

  const intlPrefixMatch = trimmed.match(/^(\+\d{1,3}[ -]+)/);
  if (intlPrefixMatch) {
    const prefix = intlPrefixMatch[1];
    const body = trimmed.slice(prefix.length);
    const bodyDigits = body.replace(/\D/g, '');
    let remainingToMask = Math.max(0, bodyDigits.length - 4);
    let maskedBody = '';

    for (const ch of body) {
      if (/\d/.test(ch)) {
        if (remainingToMask > 0) {
          maskedBody += 'X';
          remainingToMask -= 1;
        } else {
          maskedBody += ch;
        }
      } else {
        maskedBody += ch;
      }
    }
    return `${prefix}${maskedBody}`;
  }

  let toMask = digits.length - 4;
  let result = '';
  for (const ch of trimmed) {
    if (/\d/.test(ch)) {
      if (toMask > 0) {
        result += 'X';
        toMask -= 1;
      } else {
        result += ch;
      }
    } else {
      result += ch;
    }
  }
  return result;
}

function maskIpPartial(value: string): string {
  if (value.includes('.')) {
    const parts = value.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.XXX.XXX`;
    }
  }
  if (value.includes(':')) {
    const segments = value.split(':').filter(Boolean);
    const prefix = segments.slice(0, 2).join(':');
    return prefix ? `${prefix}:****:****` : '****:****';
  }
  return '[REDACTED]';
}

function maskPanPartial(value: string): string {
  if (value.length !== 10) return '[REDACTED]';
  return `XXXXX${value.slice(5)}`;
}

function maskAadhaarPartial(value: string): string {
  let digitsRemaining = 8;
  let output = '';
  for (const ch of value) {
    if (/\d/.test(ch)) {
      if (digitsRemaining > 0) {
        output += 'X';
        digitsRemaining -= 1;
      } else {
        output += ch;
      }
    } else {
      output += ch;
    }
  }
  return output;
}

function maskCreditCardPartial(value: string): string {
  const digits = normalizeCardDigits(value);
  const last4 = digits.slice(-4);
  if (digits.length === 16) {
    return `XXXX-XXXX-XXXX-${last4}`;
  }
  if (digits.length === 15) {
    return `XXXX-XXXXXX-X${last4}`;
  }
  return `${'X'.repeat(Math.max(4, digits.length - 4))}${last4}`;
}

function maskPersonPartial(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => (word.length <= 1 ? '*' : `${word[0]}${'*'.repeat(Math.min(4, word.length - 1))}`))
    .join(' ');
}

function maskGenericTailPartial(value: string, visibleTail = 4): string {
  const trimmed = value.trim();
  if (trimmed.length <= visibleTail + 1) return '*'.repeat(Math.max(4, trimmed.length));
  return `${'X'.repeat(Math.min(8, trimmed.length - visibleTail))}${trimmed.slice(-visibleTail)}`;
}

function maskSecretPartial(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const qIdx = trimmed.indexOf('?');
    return qIdx > 0 ? `${trimmed.slice(0, qIdx)}?[REDACTED_QUERY]` : `${trimmed.slice(0, 14)}***`;
  }
  const head = trimmed.slice(0, Math.min(4, trimmed.length));
  return `${head}***${trimmed.length > 8 ? trimmed.slice(-2) : ''}`;
}

export function applyPartialMask(category: EntityCategory, value: string): string {
  switch (category) {
    case 'EMAIL':
      return maskEmailPartial(value);
    case 'PHONE':
      return maskPhonePartial(value);
    case 'IP':
      return maskIpPartial(value);
    case 'PAN':
      return maskPanPartial(value);
    case 'AADHAAR':
      return maskAadhaarPartial(value);
    case 'CREDIT_CARD':
      return maskCreditCardPartial(value);
    case 'PERSON_NAME':
      return maskPersonPartial(value);
    case 'DOB_AGE':
      return maskGenericTailPartial(value, 2);
    case 'GOV_ID':
      return maskGenericTailPartial(value, 4);
    case 'FINANCIAL_ID':
      return value.includes('@') ? maskEmailPartial(value) : maskGenericTailPartial(value, 4);
    case 'DIGITAL_SECRET':
      return maskSecretPartial(value);
    case 'LOCATION_ADDRESS':
      return maskGenericTailPartial(value, 3);
    case 'CUSTOM':
      return maskGenericTailPartial(value, 3);
  }
}

export function formatReplacementValue(
  category: EntityCategory,
  originalValue: string,
  mode: RedactionMode,
  pseudonymManager: PseudonymizationManager,
  customLabels?: CustomLabelsMap,
  matchCustomLabel?: string
): string {
  switch (mode) {
    case 'FULL_MASK':
      return '[REDACTED]';
    case 'PARTIAL_MASK':
      return applyPartialMask(category, originalValue);
    case 'REPLACE':
      return customLabels?.[category]?.trim() || matchCustomLabel || CATEGORY_META[category].defaultReplaceLabel;
    case 'REMOVE':
      return '';
    case 'PSEUDONYM':
      return pseudonymManager.getPlaceholder(category, originalValue);
  }
}
