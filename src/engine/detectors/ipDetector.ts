import type { DetectionMatch } from '../../types/privacy';
import { isValidIPv4, isValidIPv6 } from '../validators/ip';

const IPV4_CANDIDATE_REGEX = /(?<![\d.])(\d{1,3}(?:\.\d{1,3}){3})(?![\d]|(?:\.\d))/g;
const IPV6_CANDIDATE_REGEX = /(?<![A-Za-z0-9:.])([0-9A-Fa-f:.]{2,45})(?![A-Za-z0-9:.])/g;

export function detectIps(text: string, prefix = 'text'): DetectionMatch[] {
  const matches: DetectionMatch[] = [];

  IPV4_CANDIDATE_REGEX.lastIndex = 0;
  let v4Result: RegExpExecArray | null;
  while ((v4Result = IPV4_CANDIDATE_REGEX.exec(text)) !== null) {
    const candidate = v4Result[1];
    const start = v4Result.index;
    const end = start + candidate.length;

    if (isValidIPv4(candidate)) {
      matches.push({
        id: `${prefix}-IP-${start}-${end}`,
        category: 'IP',
        entityType: 'IPv4 Address',
        classification: 'Digital Credentials',
        severity: 'MEDIUM',
        value: candidate,
        start,
        end,
        validationStatus: 'VALIDATED',
        detectionSource: 'Strict IPv4 Octet Validator',
        detectionMethod: 'Structural Validator',
        confidence: 'High',
        confidenceScore: 93,
        confidenceReason: 'All 4 dotted-decimal octets verified within 0–255 bounds',
        suggestedAction: 'PARTIAL_MASK',
      });
    }
  }

  IPV6_CANDIDATE_REGEX.lastIndex = 0;
  let v6Result: RegExpExecArray | null;
  while ((v6Result = IPV6_CANDIDATE_REGEX.exec(text)) !== null) {
    let candidate = v6Result[1];
    const start = v6Result.index;

    if (candidate.endsWith('.') && !candidate.endsWith('..')) {
      candidate = candidate.slice(0, -1);
    }

    if (!candidate.includes(':')) {
      continue;
    }

    const colonCount = (candidate.match(/:/g) || []).length;
    if (colonCount < 2) {
      continue;
    }

    const end = start + candidate.length;
    if (isValidIPv6(candidate)) {
      matches.push({
        id: `${prefix}-IP-${start}-${end}`,
        category: 'IP',
        entityType: 'IPv6 Address',
        classification: 'Digital Credentials',
        severity: 'MEDIUM',
        value: candidate,
        start,
        end,
        validationStatus: 'VALIDATED',
        detectionSource: 'Strict IPv6 Structure Validator',
        detectionMethod: 'Structural Validator',
        confidence: 'High',
        confidenceScore: 94,
        confidenceReason: 'Verified 128-bit hexadecimal / compressed :: IPv6 structure',
        suggestedAction: 'PARTIAL_MASK',
      });
    }
  }

  return matches;
}
