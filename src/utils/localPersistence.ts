export const STORAGE_KEYS = {
  THEME: 'privacyguard-theme',
  AUTH_SESSION: 'privacyguard-auth-session',
  AUTH_ACCOUNTS: 'privacyguard-auth-accounts',
  ROUTE: 'privacyguard-active-route',
  SIDEBAR_COLLAPSED: 'privacyguard-sidebar-collapsed',
  PREFERENCES: 'privacyguard-preferences',
  AUDIT_ENTRIES: 'privacyguard-audit-entries',
  DOCUMENTS_META: 'privacyguard-documents-meta',
  PROCESSING_LOGS: 'privacyguard-processing-logs',
} as const;

export function readStoredJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJson<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or storage-restricted browser modes
  }
}

export function removeStoredKey(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // Ignore storage removal errors
  }
}
