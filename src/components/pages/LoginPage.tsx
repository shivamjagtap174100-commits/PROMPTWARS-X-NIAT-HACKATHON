import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { AuthActionResult, AuthFormInput } from '../../hooks/useAuthSession';
import type { ThemeMode } from '../../types/privacy';
import { BrandLockup } from '../shared/PrivacyBadge';

interface LoginPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSignIn: (input: AuthFormInput) => AuthActionResult;
  onDemoAccess: () => AuthActionResult;
}

export function LoginPage({
  theme,
  onToggleTheme,
  onSignIn,
  onDemoAccess,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const res = onSignIn({ email, password });
    if (!res.ok) {
      setErrorMessage(res.message);
      return;
    }
    setErrorMessage(null);
    setPassword('');
  };

  const handleQuickDemo = () => {
    setErrorMessage(null);
    onDemoAccess();
  };

  return (
    <div className="pg-enter flex min-h-screen flex-col bg-[var(--pg-bg)] text-[var(--pg-text-primary)]">
      {/* Unauthenticated Top Bar: ONLY PrivacyGuard brand + Theme toggle (Zero App Nav Links) */}
      <header className="border-b border-[var(--pg-border)] bg-[var(--pg-bg)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLockup />

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            aria-pressed={theme === 'dark'}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 font-display text-xs font-medium text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
          >
            {theme === 'light' ? (
              <>
                <Moon
                  className="h-4 w-4 text-[var(--pg-text-secondary)]"
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-[#D6B879]" strokeWidth={1.85} aria-hidden="true" />
                <span>Light</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Centered Login Canvas */}
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="w-full max-w-4xl">
          {/* Headline + Subheadline */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 py-1 font-mono text-[11px] font-medium text-[#173D30] dark:text-[#A3C1A5]">
              <Lock className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              <span>Sign In to PrivacyGuard · Ephemeral Session Only</span>
            </div>

            <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-[var(--pg-text-primary)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Login to Your Account
            </h1>

            <p className="mx-auto mt-3.5 max-w-xl text-sm leading-relaxed text-[var(--pg-text-secondary)] sm:text-base">
              Protect sensitive PII before sharing text or CSV files — 100% browser-local execution
              with zero stored credentials.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mx-auto mt-6 flex max-w-xl items-start gap-2.5 rounded-lg border border-[#B64B43]/35 bg-[#B64B43]/10 px-4 py-3 text-xs text-[#7A2721] dark:border-[#DF7B73]/35 dark:text-[#F6C8C4]"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Spacious Split Two-Column Layout separated by Clean "/" Divider */}
          <div className="mt-10 grid items-center gap-8 rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-6 pg-shadow-card sm:p-10 md:grid-cols-[1fr_auto_1fr] md:gap-10">
            {/* Left: Clean Ephemeral Credentials Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block font-display text-xs font-semibold text-[var(--pg-text-secondary)]"
                >
                  Work Email / User ID
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pg-text-muted)]"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="h-11 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] pl-10 pr-4 text-sm text-[var(--pg-text-primary)] placeholder-[var(--pg-text-muted)] transition-colors focus:border-[#173D30] dark:focus:border-[#A3C1A5]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block font-display text-xs font-semibold text-[var(--pg-text-secondary)]"
                >
                  Passcode
                </label>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pg-text-muted)]"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-11 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] pl-10 pr-10 text-sm text-[var(--pg-text-primary)] placeholder-[var(--pg-text-muted)] transition-colors focus:border-[#173D30] dark:focus:border-[#A3C1A5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--pg-text-muted)] hover:text-[var(--pg-text-primary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="pg-action-primary inline-flex h-11 w-full items-center justify-between rounded-lg px-5 font-display text-xs font-semibold uppercase tracking-[0.05em]"
              >
                <span>Login to Your Account</span>
                <ArrowRight className="h-5 w-5" strokeWidth={1.85} aria-hidden="true" />
              </button>
            </form>

            {/* Clean "/" Center Divider */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-4 md:flex-col md:py-2"
            >
              <span className="h-px flex-1 bg-[var(--pg-border)] md:h-16 md:w-px md:flex-none" />
              <span className="font-mono text-sm font-medium text-[var(--pg-text-muted)]">/</span>
              <span className="h-px flex-1 bg-[var(--pg-border)] md:h-16 md:w-px md:flex-none" />
            </div>

            {/* Right: Subtle Quick / Demo Access (In-Memory Session Only) */}
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--pg-text-muted)]">
                Quick Access
              </p>

              <button
                type="button"
                onClick={handleQuickDemo}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-4 text-left font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[#173D30] dark:hover:border-[#A3C1A5]"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Sparkles
                    className="h-4 w-4 shrink-0 text-[#173D30] dark:text-[#A3C1A5]"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                  <span>Demo Access</span>
                </span>
                <span className="font-mono text-[11px] font-normal text-[var(--pg-text-muted)]">
                  Instant session
                </span>
              </button>

              <p className="text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                Launches an ephemeral browser-memory session to inspect the PrivacyGuard Overview,
                Workspace, Batch Documents, and Audit Trail without saving credentials.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center font-mono text-xs text-[var(--pg-text-muted)]">
            Authentication state stays exclusively in memory (`isAuthenticated`) and resets on
            logout or tab close.
          </p>
        </div>
      </main>

      <footer className="border-t border-[var(--pg-border)] py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 font-mono text-xs text-[var(--pg-text-secondary)]">
            <ShieldCheck
              className="h-4 w-4 text-[#367A55] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            PrivacyGuard · Zero external transmission
          </span>
          <span className="font-mono text-[11px] text-[var(--pg-text-muted)]">
            Client-side security gate
          </span>
        </div>
      </footer>
    </div>
  );
}
