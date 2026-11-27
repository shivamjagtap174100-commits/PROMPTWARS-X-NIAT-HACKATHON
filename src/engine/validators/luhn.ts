/**
 * Strips spaces and hyphens from payment card candidates.
 */
export function normalizeCardDigits(raw: string): string {
  return raw.replace(/[ -]/g, '');
}

/**
 * Validates a digit-only string using the ISO/IEC 7812 Luhn mod-10 algorithm.
 * Enforces realistic payment card length (13-19 digits) and rejects all-identical digit runs.
 */
export function isValidLuhn(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  // Reject degenerate all-same-digit sequences (e.g., 0000000000000000)
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Normalizes a candidate payment card string and verifies length + Luhn checksum.
 */
export function isValidCreditCard(raw: string): boolean {
  if (!/^[\d -]+$/.test(raw)) {
    return false;
  }
  const normalized = normalizeCardDigits(raw);
  return isValidLuhn(normalized);
}
