export interface BrowserTelemetrySnapshot {
  apiRequestCount: number;
  externalAssetOrigins: string[];
  localStorageKeys: number;
  sessionStorageKeys: number;
  persistedMetadataKeys: number;
  checkedAt: string;
}

const EXPECTED_SAFE_KEYS = new Set([
  'privacyguard-theme',
  'privacyguard-auth-session',
  'privacyguard-auth-accounts',
  'privacyguard-active-route',
  'privacyguard-sidebar-collapsed',
  'privacyguard-preferences',
  'privacyguard-audit-entries',
  'privacyguard-documents-meta',
  'privacyguard-processing-logs',
]);

export function collectBrowserTelemetry(): BrowserTelemetrySnapshot {
  let apiRequestCount = 0;
  const externalOrigins = new Set<string>();

  try {
    if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

      for (const entry of resources) {
        if (
          entry.initiatorType === 'fetch' ||
          entry.initiatorType === 'xmlhttprequest' ||
          entry.initiatorType === 'beacon'
        ) {
          apiRequestCount += 1;
        }
        try {
          const parsedUrl = new URL(entry.name);
          if (currentOrigin && parsedUrl.origin !== currentOrigin) {
            externalOrigins.add(parsedUrl.hostname);
          }
        } catch {
          // Ignore relative URLs
        }
      }
    }
  } catch {
    // Performance API unavailable
  }

  let localStorageKeys = 0;
  let sessionStorageKeys = 0;
  let persistedMetadataKeys = 0;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorageKeys = localStorage.length;
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && EXPECTED_SAFE_KEYS.has(key)) {
          persistedMetadataKeys += 1;
        }
      }
    }
    sessionStorageKeys = typeof sessionStorage !== 'undefined' ? sessionStorage.length : 0;
  } catch {
    // Storage access unavailable
  }

  return {
    apiRequestCount,
    externalAssetOrigins: Array.from(externalOrigins),
    localStorageKeys,
    sessionStorageKeys,
    persistedMetadataKeys,
    checkedAt: new Date().toLocaleTimeString('en-GB', { hour12: false }),
  };
}
