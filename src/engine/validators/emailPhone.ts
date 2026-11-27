/**
 * Validates practical email structure while rejecting malformed local/domain segments.
 */
export function isValidEmail(raw: string): boolean {
  const parts = raw.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;
  if (!local || !domain || local.length > 64 || domain.length > 253) {
    return false;
  }

  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }

  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return false;
  }

  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }

  for (const label of labels) {
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) {
      return false;
    }
  }

  const tld = labels[labels.length - 1];
  return /^[A-Za-z]{2,24}$/.test(tld);
}

/**
 * Validates Indian mobile numbers, +91 numbers, and international/formatted phone numbers
 * while rejecting unrelated numeric sequences such as IDs, timestamps, or sequential digits.
 */
export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }

  // Reject ISO dates or decimal numbers
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(trimmed) || /^\d+\.\d+$/.test(trimmed)) {
    return false;
  }

  const hasPlus = trimmed.startsWith('+');
  const hasParens = /\(\d{2,4}\)/.test(trimmed);
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    return false;
  }

  // Reject all-identical digits or standard synthetic counting sequence
  if (/^(\d)\1+$/.test(digits) || digits === '1234567890') {
    return false;
  }

  // Indian +91 formats
  if (hasPlus && digits.startsWith('91')) {
    const subscriber = digits.slice(2);
    return /^[1-9]\d{9}$/.test(subscriber);
  }

  // Other explicit international E.164 formats (+1, +44, +65, etc.)
  if (hasPlus) {
    return digits.length >= 10 && digits.length <= 15;
  }

  // Unprefixed or 0-prefixed Indian 10-digit mobile numbers must begin with 6-9
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return true;
  }

  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    return true;
  }

  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return true;
  }

  // Parenthesized North American / formatted numbers like (415) 555-0192
  if (hasParens && digits.length >= 10 && digits.length <= 11) {
    return true;
  }

  return false;
}
