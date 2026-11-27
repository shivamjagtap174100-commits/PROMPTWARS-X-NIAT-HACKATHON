import type {
  CustomRuleDefinition,
  DetectionMatch,
  EnabledCategoriesMap,
  EntityCategory,
  SensitivityLevel,
} from '../../types/privacy';
import { detectAadhaar } from './aadhaarDetector';
import { detectCreditCards } from './creditCardDetector';
import { detectCustomRules } from './customRuleDetector';
import { detectDigitalSecrets } from './digitalSecretDetector';
import { detectEmails } from './emailDetector';
import { detectFinancialIds } from './financialDetector';
import { detectGovIds } from './govIdDetector';
import { detectIps } from './ipDetector';
import { detectLocations } from './locationDetector';
import { detectPans } from './panDetector';
import { detectDobAndAge, detectPersonNames } from './personalInfoDetector';
import { detectPhones } from './phoneDetector';

export const DEFAULT_ENABLED_CATEGORIES: EnabledCategoriesMap = {
  EMAIL: true,
  PHONE: true,
  IP: true,
  PAN: true,
  AADHAAR: true,
  CREDIT_CARD: true,
  PERSON_NAME: true,
  DOB_AGE: true,
  GOV_ID: true,
  FINANCIAL_ID: true,
  DIGITAL_SECRET: true,
  LOCATION_ADDRESS: true,
  CUSTOM: true,
};

const CATEGORY_PRIORITY: Record<EntityCategory, number> = {
  DIGITAL_SECRET: 1,
  EMAIL: 2,
  FINANCIAL_ID: 3,
  IP: 4,
  CREDIT_CARD: 5,
  GOV_ID: 6,
  PAN: 7,
  AADHAAR: 8,
  PHONE: 9,
  DOB_AGE: 10,
  LOCATION_ADDRESS: 11,
  PERSON_NAME: 12,
  CUSTOM: 13,
};

/**
 * Resolves overlapping candidates deterministically by start offset, category specificity,
 * confidence score, and span length so no character range is double-counted or corrupted.
 */
export function resolveOverlappingMatches(candidates: DetectionMatch[]): DetectionMatch[] {
  if (candidates.length === 0) return [];

  const sorted = [...candidates].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const priorityDiff = CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category];
    if (priorityDiff !== 0) return priorityDiff;
    if (b.confidenceScore !== a.confidenceScore) return b.confidenceScore - a.confidenceScore;
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

export interface DetectEntitiesOptions {
  sensitivity?: SensitivityLevel;
  customRules?: CustomRuleDefinition[];
  columnHeader?: string;
}

/**
 * Runs enabled local PII detectors over text and returns non-overlapping validated matches.
 */
export function detectAllEntities(
  text: string,
  prefix = 'text',
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES,
  options: DetectEntitiesOptions = {}
): DetectionMatch[] {
  if (!text) return [];

  const sensitivity = options.sensitivity || 'BALANCED';
  const customRules = options.customRules || [];

  const allCandidates: DetectionMatch[] = [];
  if (enabledCategories.DIGITAL_SECRET) {
    allCandidates.push(...detectDigitalSecrets(text, prefix, sensitivity));
  }
  if (enabledCategories.EMAIL) allCandidates.push(...detectEmails(text, prefix));
  if (enabledCategories.FINANCIAL_ID) allCandidates.push(...detectFinancialIds(text, prefix));
  if (enabledCategories.IP) allCandidates.push(...detectIps(text, prefix));
  if (enabledCategories.CREDIT_CARD) allCandidates.push(...detectCreditCards(text, prefix));
  if (enabledCategories.GOV_ID) allCandidates.push(...detectGovIds(text, prefix));
  if (enabledCategories.PAN) allCandidates.push(...detectPans(text, prefix));
  if (enabledCategories.AADHAAR) allCandidates.push(...detectAadhaar(text, prefix));
  if (enabledCategories.PHONE) allCandidates.push(...detectPhones(text, prefix));
  if (enabledCategories.DOB_AGE) allCandidates.push(...detectDobAndAge(text, prefix));
  if (enabledCategories.LOCATION_ADDRESS) allCandidates.push(...detectLocations(text, prefix));
  if (enabledCategories.PERSON_NAME) {
    allCandidates.push(...detectPersonNames(text, prefix, sensitivity, options.columnHeader));
  }
  if (enabledCategories.CUSTOM && customRules.length > 0) {
    allCandidates.push(...detectCustomRules(text, customRules, prefix));
  }

  return resolveOverlappingMatches(allCandidates);
}
