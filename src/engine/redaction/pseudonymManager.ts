import type { EntityCategory } from '../../types/privacy';

const CATEGORY_PREFIX: Record<EntityCategory, string> = {
  EMAIL: 'USER',
  PHONE: 'PHONE',
  IP: 'IP',
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  CREDIT_CARD: 'CARD',
};

/**
 * Session-scoped deterministic pseudonymization manager.
 * Guarantees same original value maps to the same placeholder within a session,
 * maintains isolated category counters, and never exposes internal mappings to audit logs.
 */
export class PseudonymizationManager {
  private readonly mapping = new Map<string, string>();
  private counters: Record<EntityCategory, number> = {
    EMAIL: 0,
    PHONE: 0,
    IP: 0,
    PAN: 0,
    AADHAAR: 0,
    CREDIT_CARD: 0,
  };

  private buildCanonicalKey(category: EntityCategory, value: string): string {
    const normalized = category === 'EMAIL' ? value.trim().toLowerCase() : value.trim();
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
    this.counters = {
      EMAIL: 0,
      PHONE: 0,
      IP: 0,
      PAN: 0,
      AADHAAR: 0,
      CREDIT_CARD: 0,
    };
  }
}
