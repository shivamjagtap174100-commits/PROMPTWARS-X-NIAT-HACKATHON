/**
 * Validates Indian Permanent Account Number (PAN) format: 5 uppercase letters, 4 digits, 1 uppercase letter.
 */
export function isValidPan(raw: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(raw);
}

/**
 * Validates 12-digit Aadhaar-format identifiers (space, hyphen, or unseparated).
 * Performs format validation only; never queries or claims verification against UIDAI.
 */
export function isValidAadhaarFormat(raw: string): boolean {
  if (!/^(?:\d{4} \d{4} \d{4}|\d{4}-\d{4}-\d{4}|\d{12})$/.test(raw)) {
    return false;
  }

  const digits = raw.replace(/[ -]/g, '');
  if (digits.length !== 12) {
    return false;
  }

  // Reject trivial all-identical digits (e.g., 000000000000, 111111111111)
  if (/^(\d)\1{11}$/.test(digits)) {
    return false;
  }

  return true;
}
