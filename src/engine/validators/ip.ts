/**
 * Validates strict IPv4 structure: exactly 4 octets between 0 and 255 without invalid leading zeros.
 */
export function isValidIPv4(raw: string): boolean {
  const parts = raw.split('.');
  if (parts.length !== 4) {
    return false;
  }

  for (const part of parts) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) {
      return false;
    }
    const num = Number(part);
    if (!Number.isInteger(num) || num < 0 || num > 255) {
      return false;
    }
  }

  return true;
}

/**
 * Validates strict IPv6 forms: full 8-hextet, zero-compressed (::), and IPv4-mapped (::ffff:192.0.2.128).
 * Rejects timestamps (e.g., 10:24:01) and malformed multiple compressions.
 */
export function isValidIPv6(raw: string): boolean {
  if (!raw || !raw.includes(':')) {
    return false;
  }

  // Strip optional zone ID only if valid, though standard addresses usually exclude it
  if (raw.includes(':::')) {
    return false;
  }

  const compressionParts = raw.split('::');
  if (compressionParts.length > 2) {
    return false;
  }

  const hasCompression = compressionParts.length === 2;
  const leftGroups = compressionParts[0] ? compressionParts[0].split(':') : [];
  const rightGroups = hasCompression && compressionParts[1] ? compressionParts[1].split(':') : [];

  // Check if the final segment is an embedded IPv4 address
  let embeddedIPv4 = false;
  if (rightGroups.length > 0 && rightGroups[rightGroups.length - 1].includes('.')) {
    const last = rightGroups[rightGroups.length - 1];
    if (!isValidIPv4(last)) {
      return false;
    }
    embeddedIPv4 = true;
  } else if (!hasCompression && leftGroups.length > 0 && leftGroups[leftGroups.length - 1].includes('.')) {
    const last = leftGroups[leftGroups.length - 1];
    if (!isValidIPv4(last)) {
      return false;
    }
    embeddedIPv4 = true;
  }

  const hexGroupRegex = /^[0-9a-fA-F]{1,4}$/;
  const validateGroupList = (groups: string[], skipLastIfIPv4: boolean): boolean => {
    const limit = skipLastIfIPv4 ? groups.length - 1 : groups.length;
    for (let i = 0; i < limit; i += 1) {
      if (!hexGroupRegex.test(groups[i])) {
        return false;
      }
    }
    return true;
  };

  if (hasCompression) {
    if (!validateGroupList(leftGroups, false) || !validateGroupList(rightGroups, embeddedIPv4)) {
      return false;
    }
    const hextetEquivalentCount =
      leftGroups.length + (embeddedIPv4 ? rightGroups.length - 1 + 2 : rightGroups.length);
    // Compression :: must represent at least 1 missing hextet (or 0? RFC 5952 requires >=1; max 7 explicit hextets)
    return hextetEquivalentCount < 8;
  }

  if (!validateGroupList(leftGroups, embeddedIPv4)) {
    return false;
  }
  const totalHextets = embeddedIPv4 ? leftGroups.length - 1 + 2 : leftGroups.length;
  return totalHextets === 8;
}
