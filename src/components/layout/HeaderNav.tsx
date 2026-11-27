import {
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import type { AppRoute, AuthSession, ThemeMode } from '../../types/privacy';
import { BrandLockup } from '../shared/PrivacyBadge';

interface HeaderNavProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  session: AuthSession | null;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  onOpenCommandPalette: () => void;
}

const ROUTE_META: Record<AppRoute, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Swiss Edition · Privacy Architecture' },
  '/login': { title: 'Login', subtitle: 'Client-Side Session Gate' },
  '/workspace': { title: 'Workspace', subtitle: 'Three-Panel Local Sanitization Studio' },
  '/documents': { title: 'Documents', subtitle: 'Metadata Session Library & Batch Queue' },
  '/audit-trail': { title: 'Audit Trail', subtitle: 'Verifiable Non-PII Event Timeline' },
  '/privacy-centre': { title: 'Privacy Centre', subtitle: 'Zero-Transmission Runtime Verification' },
  '/documentation': { title: 'Documentation', subtitle: 'Rules, Formats & Architecture Reference' },
};

export function HeaderNav({
  route,
  onNavigate,
  session,
  onLogout,
  theme,
  onToggleTheme,
  settingsOpen,
  onToggleSettings,
  onOpenCommandPalette,
}: HeaderNavProps) {
  const currentMeta = ROUTE_META[route] || ROUTE_META['/'];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--pg-border)] bg-[var(--pg-bg)]/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Brand + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            aria-label="PrivacyGuard Home"
            className="text-left focus-visible:rounded-lg"
          >
            <BrandLockup compact />
          </button>

          <span className="hidden h-4 w-px bg-[var(--pg-border)] md:block" aria-hidden="true" />

          <div className="hidden items-baseline gap-2 md:flex">
            <span className="font-display text-sm font-bold tracking-tight text-[var(--pg-text-primary)]">
              {currentMeta.title}
            </span>
            <span className="hidden font-mono text-[11px] text-[var(--pg-text-muted)] lg:inline">
              / {currentMeta.subtitle}
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Command palette search pill */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-2.5 font-display text-xs font-medium text-[var(--pg-text-secondary)] transition-colors hover:border-[var(--pg-border-strong)] hover:text-[var(--pg-text-primary)]"
          >
            <Search className="h-4 w-4" strokeWidth={1.85} aria-hidden={true} />
            <span className="hidden sm:inline">Command</span>
            <kbd className="hidden rounded border border-[var(--pg-border)] bg-[var(--pg-bg)] px-1 font-mono text-[10px] sm:inline">
              Ctrl+K
            </kbd>
          </button>

          {/* Zero-transmission status pill */}
          <button
            type="button"
            onClick={() => onNavigate('/privacy-centre')}
            title="Inspect browser-local runtime & zero network calls"
            className="hidden items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--pg-text-secondary)] transition-colors hover:border-[var(--pg-border-strong)] hover:text-[var(--pg-text-primary)] xl:inline-flex"
          >
            <span
              aria-hidden={true}
              className="h-1.5 w-1.5 rounded-full bg-[#367A55] dark:bg-[#A3C1A5]"
            />
            <span>0 API calls</span>
          </button>

          {/* Theme toggle — aria-label matches test expectations exactly */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            aria-pressed={theme === 'dark'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] text-[var(--pg-text-secondary)] transition-colors hover:border-[var(--pg-border-strong)] hover:text-[var(--pg-text-primary)]"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" strokeWidth={1.85} aria-hidden={true} />
            ) : (
              <Sun className="h-4 w-4 text-[#D6B879]" strokeWidth={1.85} aria-hidden={true} />
            )}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onToggleSettings}
            aria-label="Open workspace settings"
            aria-expanded={settingsOpen}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              settingsOpen
                ? 'border-[#173D30] bg-[#173D30] text-[#FBFAF6] dark:border-[#A3C1A5] dark:bg-[#A3C1A5] dark:text-[#111713]'
                : 'border-[var(--pg-border)] bg-[var(--pg-surface)] text-[var(--pg-text-secondary)] hover:border-[var(--pg-border-strong)] hover:text-[var(--pg-text-primary)]'
            }`}
          >
            <Settings className="h-4 w-4" strokeWidth={1.85} aria-hidden={true} />
          </button>

          {/* User pill + Logout */}
          {session && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] py-1 pl-2 pr-1.5">
              <span className="hidden h-5 w-5 items-center justify-center rounded bg-[#173D30] font-mono text-[10px] font-semibold text-[#FBFAF6] sm:flex dark:bg-[#A3C1A5] dark:text-[#111713]">
                {session.avatarInitials}
              </span>
              <span
                data-testid="navbar-user-name"
                className="hidden max-w-28 truncate font-display text-xs font-medium text-[var(--pg-text-primary)] sm:inline"
              >
                {session.name}
              </span>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Logout"
                className="inline-flex h-6 items-center gap-1 rounded px-2 font-display text-xs font-semibold text-[var(--pg-text-secondary)] transition-colors hover:bg-[#B64B43]/12 hover:text-[#B64B43] dark:hover:text-[#DF7B73]"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.85} aria-hidden={true} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
