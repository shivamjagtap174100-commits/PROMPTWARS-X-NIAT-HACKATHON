import { useCallback, useEffect, useState } from 'react';
import type { AppRoute } from '../types/privacy';
import { readStoredJson, STORAGE_KEYS, writeStoredJson } from '../utils/localPersistence';

function normalizePathname(pathname: string): AppRoute {
  const cleaned = pathname.replace(/\/+$/, '') || '/';
  if (cleaned === '/login') return '/login';
  if (cleaned === '/workspace') return '/workspace';
  if (cleaned === '/documents') return '/documents';
  if (cleaned === '/audit-trail') return '/audit-trail';
  if (cleaned === '/privacy-centre') return '/privacy-centre';
  if (cleaned === '/documentation') return '/documentation';
  return '/';
}

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = normalizePathname(window.location.pathname);
      if (fromUrl !== '/' && fromUrl !== '/login') {
        return fromUrl;
      }
    }
    return readStoredJson<AppRoute>(STORAGE_KEYS.ROUTE, '/');
  });

  useEffect(() => {
    const handlePopState = () => {
      const next = normalizePathname(window.location.pathname);
      setRoute(next);
      if (next !== '/login') {
        writeStoredJson(STORAGE_KEYS.ROUTE, next);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    const normalized = normalizePathname(nextRoute);
    if (typeof window !== 'undefined' && window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    setRoute(normalized);
    if (normalized !== '/login') {
      writeStoredJson(STORAGE_KEYS.ROUTE, normalized);
    }
  }, []);

  return { route, navigate };
}
