import type { EntityCategory } from '../../types/privacy';

const CATEGORY_PREFIX: Record<EntityCategory, string> = {
  EMAIL: 'USER',
  PHONE: 'PHONE',
  IP: 'IP',
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  CREDIT_CARD: 'CARD',
  PERSON_NAME: 'PERSON',
  DOB_AGE: 'BIO',
  GOV_ID: 'GOV_ID',
  FINANCIAL_ID: 'FIN',
  DIGITAL_SECRET: 'CRED',
  LOCATION_ADDRESS: 'LOC',
  CUSTOM: 'CUSTOM',
};

function createEmptyCounters(): Record<EntityCategory, number> {
  return {
    EMAIL: 0,
    PHONE: 0,
    IP: 0,
    PAN: 0,
    AADHAAR: 0,
    CREDIT_CARD: 0,
    PERSON_NAME: 0,
    DOB_AGE: 0,
    GOV_ID: 0,
    FINANCIAL_ID: 0,
    DIGITAL_SECRET: 0,
    LOCATION_ADDRESS: 0,
    CUSTOM: 0,
  };
}

/**
 * Session-scoped deterministic pseudonymization manager.
 * Guarantees the same original value maps to the same placeholder within a run/session,
 * maintains isolated category counters, and keeps mappings strictly in ephemeral RAM.
 */
export class PseudonymizationManager {
  private readonly mapping = new Map<string, string>();
  private counters: Record<EntityCategory, number> = createEmptyCounters();

  private buildCanonicalKey(category: EntityCategory, value: string): string {
    const normalized =
      category === 'EMAIL' || category === 'PERSON_NAME'
        ? value.trim().toLowerCase()
        : value.trim();
    return `${category}::${normalized}`;
  }

  getPlaceholder(category: EntityCategory, originalValue: string): string {
    const key = this.buildCanonicalKey(category, originalValue);
    const existing = this.mapping.get(key);
    if (existing) {
      return existing;
    }

    const nextCount = this.counters[category] + 1;
    this.counters[category] = nextCount;

    const padded = String(nextCount).padStart(2, '0');
    const placeholder = `${CATEGORY_PREFIX[category]}_${padded}`;
    this.mapping.set(key, placeholder);
    return placeholder;
  }

  getUniqueMappingCount(): number {
    return this.mapping.size;
  }

  reset(): void {
    this.mapping.clear();
    this.counters = createEmptyCounters();
  }
}
