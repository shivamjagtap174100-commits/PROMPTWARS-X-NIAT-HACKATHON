import { useCallback, useState } from 'react';
import type { AuthSession } from '../types/privacy';
import {
  readStoredJson,
  removeStoredKey,
  STORAGE_KEYS,
  writeStoredJson,
} from '../utils/localPersistence';

export interface AuthFormInput {
  name?: string;
  email: string;
  role?: string;
  password: string;
}

export interface AuthActionResult {
  ok: boolean;
  message: string;
  session?: AuthSession;
}

interface StoredAccountProfile {
  email: string;
  name: string;
  role: string;
  avatarInitials: string;
  lastSignedInAt: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function deriveNameFromEmail(email: string): string {
  const local = email.trim().split('@')[0] || 'Privacy User';
  const words = local
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return words.join(' ') || 'Privacy User';
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function saveNonSensitiveProfile(session: AuthSession): void {
  const existing = readStoredJson<StoredAccountProfile[]>(STORAGE_KEYS.AUTH_ACCOUNTS, []);
  const profile: StoredAccountProfile = {
    email: session.email,
    name: session.name,
    role: session.role,
    avatarInitials: session.avatarInitials,
    lastSignedInAt: session.signedInAt,
  };
  const updated = [
    profile,
    ...existing.filter((item) => item.email !== session.email).slice(0, 9),
  ];
  writeStoredJson(STORAGE_KEYS.AUTH_ACCOUNTS, updated);
}

/**
 * Local session hook persisting non-password AuthSession & profile metadata cleanly across refreshes.
 * Plaintext passcodes are never stored in browser storage; Login still gates initial unauthenticated entry.
 */
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readStoredJson<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null)
  );

  const isAuthenticated = session !== null;

  const signIn = useCallback((input: AuthFormInput): AuthActionResult => {
    const emailClean = input.email.trim().toLowerCase();
    const roleClean = (input.role || 'Privacy Engineer').trim() || 'Privacy Engineer';
    const passwordClean = input.password;

    if (!isValidEmail(emailClean)) {
      return { ok: false, message: 'Enter a valid work email address (name@organization.com).' };
    }

    if (passwordClean.length < 6) {
      return { ok: false, message: 'Passcode must be at least 6 characters.' };
    }

    const displayName =
      input.name && input.name.trim().length >= 2
        ? input.name.trim()
        : deriveNameFromEmail(emailClean);

    const nextSession: AuthSession = {
      userId: `session-${Date.now().toString(36)}`,
      name: displayName,
      email: emailClean,
      role: roleClean,
      avatarInitials: deriveInitials(displayName),
      signedInAt: new Date().toISOString(),
    };

    setSession(nextSession);
    writeStoredJson(STORAGE_KEYS.AUTH_SESSION, nextSession);
    saveNonSensitiveProfile(nextSession);

    return {
      ok: true,
      message: `Signed in cleanly as ${nextSession.name}.`,
      session: nextSession,
    };
  }, []);

  const signInDemo = useCallback((): AuthActionResult => {
    const demoSession: AuthSession = {
      userId: `demo-${Date.now().toString(36)}`,
      name: 'Demo Engineer',
      email: 'demo@privacyguard.local',
      role: 'Privacy Engineer',
      avatarInitials: 'DE',
      signedInAt: new Date().toISOString(),
    };
    setSession(demoSession);
    writeStoredJson(STORAGE_KEYS.AUTH_SESSION, demoSession);
    saveNonSensitiveProfile(demoSession);

    return {
      ok: true,
      message: 'Session saved locally in browser storage (zero passcodes saved).',
      session: demoSession,
    };
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    removeStoredKey(STORAGE_KEYS.AUTH_SESSION);
  }, []);

  return {
    session,
    isAuthenticated,
    signIn,
    signInDemo,
    logout,
  };
}
