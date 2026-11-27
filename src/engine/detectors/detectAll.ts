import type {
  DetectionMatch,
  EnabledCategoriesMap,
  EntityCategory,
} from '../../types/privacy';
import { detectAadhaar } from './aadhaarDetector';
import { detectCreditCards } from './creditCardDetector';
import { detectEmails } from './emailDetector';
import { detectIps } from './ipDetector';
import { detectPans } from './panDetector';
import { detectPhones } from './phoneDetector';

export const DEFAULT_ENABLED_CATEGORIES: EnabledCategoriesMap = {
  EMAIL: true,
  PHONE: true,
  IP: true,
  PAN: true,
  AADHAAR: true,
  CREDIT_CARD: true,
};

const CATEGORY_PRIORITY: Record<EntityCategory, number> = {
  EMAIL: 1,
  IP: 2,
  CREDIT_CARD: 3,
  PAN: 4,
  AADHAAR: 5,
  PHONE: 6,
};

/**
 * Resolves overlapping candidates deterministically by start offset, category specificity,
 * and span length so no character range is ever double-counted or corrupted.
 */
export function resolveOverlappingMatches(candidates: DetectionMatch[]): DetectionMatch[] {
  if (candidates.length === 0) return [];

  const sorted = [...candidates].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const priorityDiff = CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category];
    if (priorityDiff !== 0) return priorityDiff;
    return b.end - b.start - (a.end - a.start);
  });

  const accepted: DetectionMatch[] = [];
  for (const candidate of sorted) {
    let overlaps = false;
    for (let i = accepted.length - 1; i >= 0; i -= 1) {
      const existing = accepted[i];
      if (existing.end <= candidate.start) {
        break;
      }
      if (candidate.start < existing.end && candidate.end > existing.start) {
        if (CATEGORY_PRIORITY[candidate.category] < CATEGORY_PRIORITY[existing.category]) {
          accepted.splice(i, 1);
        } else {
          overlaps = true;
          break;
        }
      }
    }

    if (!overlaps) {
      accepted.push(candidate);
      accepted.sort((a, b) => a.start - b.start);
    }
  }

  return accepted;
}

/**
 * Runs enabled local PII detectors over text and returns non-overlapping validated matches.
 */
export function detectAllEntities(
  text: string,
  prefix = 'text',
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES
): DetectionMatch[] {
  if (!text) return [];

  const allCandidates: DetectionMatch[] = [];
  if (enabledCategories.EMAIL) allCandidates.push(...detectEmails(text, prefix));
  if (enabledCategories.IP) allCandidates.push(...detectIps(text, prefix));
  if (enabledCategories.CREDIT_CARD) allCandidates.push(...detectCreditCards(text, prefix));
  if (enabledCategories.PAN) allCandidates.push(...detectPans(text, prefix));
  if (enabledCategories.AADHAAR) allCandidates.push(...detectAadhaar(text, prefix));
  if (enabledCategories.PHONE) allCandidates.push(...detectPhones(text, prefix));

  return resolveOverlappingMatches(allCandidates);
}
