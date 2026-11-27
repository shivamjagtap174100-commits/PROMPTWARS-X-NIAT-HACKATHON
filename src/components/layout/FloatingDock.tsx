import {
  BookOpen,
  CloudUpload,
  Files,
  FlaskConical,
  History,
  LayoutDashboard,
  Moon,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import type { AppRoute, RedactionMode, ThemeMode } from '../../types/privacy';
import { REDACTION_MODE_META } from '../../utils/categoryTheme';

interface FloatingDockProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onTriggerUpload: () => void;
  onLoadSample: () => void;
  onOpenSettings: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  activeEntityCount: number;
  sessionCount: number;
  redactionMode: RedactionMode;
}

interface DockItemDef {
  id: string;
  label: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  action: () => void;
  route?: AppRoute;
  badge?: number | null;
}

export function FloatingDock({
  route,
  onNavigate,
  onTriggerUpload,
  onLoadSample,
  onOpenSettings,
  theme,
  onToggleTheme,
  activeEntityCount,
  sessionCount,
  redactionMode,
}: FloatingDockProps) {
  const navItems: DockItemDef[] = [
    {
      id: 'overview',
      label: 'Overview',
      tooltip: 'Overview — Privacy Dashboard',
      icon: LayoutDashboard,
      action: () => onNavigate('/'),
      route: '/',
    },
    {
      id: 'workspace',
      label: 'Workspace',
      tooltip: 'Workspace — Sanitization Studio',
      icon: ScanSearch,
      action: () => onNavigate('/workspace'),
      route: '/workspace',
      badge: activeEntityCount > 0 ? activeEntityCount : null,
    },
    {
      id: 'upload',
      label: 'Upload',
      tooltip: 'Upload Document (.txt / .csv)',
      icon: CloudUpload,
      action: onTriggerUpload,
    },
    {
      id: 'sample',
      label: 'Sample',
      tooltip: 'Load Sample — Instant Demo Data',
      icon: FlaskConical,
      action: () => {
        onLoadSample();
        onNavigate('/workspace');
      },
    },
    {
      id: 'documents',
      label: 'Documents',
      tooltip: 'Documents — Session Library',
      icon: Files,
      action: () => onNavigate('/documents'),
      route: '/documents',
      badge: sessionCount > 0 ? sessionCount : null,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      tooltip: 'Audit Trail — Event Timeline',
      icon: History,
      action: () => onNavigate('/audit-trail'),
      route: '/audit-trail',
    },
    {
      id: 'privacy',
      label: 'Privacy Centre',
      tooltip: 'Privacy Centre — Zero-Transmission Proof',
      icon: ShieldCheck,
      action: () => onNavigate('/privacy-centre'),
      route: '/privacy-centre',
    },
    {
      id: 'docs',
      label: 'Documentation',
      tooltip: 'Documentation — Rules & Reference',
      icon: BookOpen,
      action: () => onNavigate('/documentation'),
      route: '/documentation',
    },
  ];

  const bottomItems: DockItemDef[] = [
    {
      id: 'theme',
      label: theme === 'light' ? 'Dark Mode' : 'Light Mode',
      tooltip: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      icon: theme === 'light' ? Moon : Sun,
      action: onToggleTheme,
    },
    {
      id: 'settings',
      label: 'Settings',
      tooltip: 'Workspace Settings',
      icon: Settings2,
      action: onOpenSettings,
    },
  ];

  return (
    <>
      {/* ── Desktop / Tablet: Vertical Floating Dock ── */}
      <div
        className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 md:flex"
        role="navigation"
        aria-label="Primary"
      >
        <div
          className="flex flex-col gap-1 rounded-2xl border border-[var(--pg-border)] bg-[var(--pg-surface)] px-2 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          style={{ width: '64px' }}
        >
          {/* Brand Shield at top */}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            aria-label="PrivacyGuard Overview"
            className="group relative mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#173D30] transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173D30] dark:bg-[#A3C1A5]"
          >
            <ShieldCheck
              className="h-[18px] w-[18px] text-[#FBFAF6] dark:text-[#111713]"
              strokeWidth={1.9}
              aria-hidden={true}
            />
            <DockTooltip label="PrivacyGuard Home" side="right" />
          </button>

          {/* Thin divider */}
          <div className="mx-auto h-px w-8 bg-[var(--pg-border)]" />

          {/* Nav Items */}
          <div className="mt-1 flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.route !== undefined && route === item.route;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173D30] active:scale-95 ${
                    isActive
                      ? 'bg-[#173D30] text-[#FBFAF6] shadow-sm dark:bg-[#A3C1A5] dark:text-[#111713]'
                      : 'text-[var(--pg-text-secondary)] hover:bg-[var(--pg-surface-secondary)] hover:text-[var(--pg-text-primary)]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} aria-hidden={true} />
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#173D30] px-1 font-mono text-[9px] font-semibold text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]"
                      aria-label={`${item.badge} items`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <DockTooltip label={item.tooltip} side="right" />
                </button>
              );
            })}
          </div>

          {/* Bottom Divider + Controls */}
          <div className="mt-auto flex flex-col gap-0.5 border-t border-[var(--pg-border)] pt-2">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  aria-label={item.label}
                  className="group relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-[var(--pg-text-muted)] transition-all duration-150 hover:bg-[var(--pg-surface-secondary)] hover:text-[var(--pg-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173D30] active:scale-95"
                >
                  <Icon className="h-[16px] w-[16px]" strokeWidth={1.85} aria-hidden={true} />
                  <DockTooltip label={item.tooltip} side="right" />
                </button>
              );
            })}
          </div>

          {/* Redaction mode micro-status */}
          <div
            className="mx-auto mt-1 flex flex-col items-center gap-0.5"
            title={`Mode: ${REDACTION_MODE_META[redactionMode].title}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#367A55] dark:bg-[#A3C1A5]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* ── Mobile: Bottom Navigation Bar ── */}
      {/* aria-hidden: desktop dock is the primary accessible nav; mobile bar is a visual duplicate */}
      <nav
        aria-label="Mobile navigation"
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--pg-border)] bg-[var(--pg-surface)] md:hidden"
      >
        {/* Show top 5 nav items on mobile */}
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = item.route !== undefined && route === item.route;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-display font-semibold uppercase tracking-[0.05em] transition-colors ${
                isActive
                  ? 'text-[#173D30] dark:text-[#A3C1A5]'
                  : 'text-[var(--pg-text-muted)] hover:text-[var(--pg-text-secondary)]'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden={true} />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#173D30] dark:bg-[#A3C1A5]" />
              )}
            </button>
          );
        })}
        {/* More button opens overflow */}
        <button
          type="button"
          onClick={() => onNavigate('/documentation')}
          aria-label="More pages"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-display font-semibold uppercase tracking-[0.05em] text-[var(--pg-text-muted)] hover:text-[var(--pg-text-secondary)]"
        >
          <BookOpen className="h-5 w-5" strokeWidth={1.85} aria-hidden={true} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

/* ── Tooltip helper ── */
function DockTooltip({ label, side }: { label: string; side: 'right' | 'left' }) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none invisible absolute z-50 whitespace-nowrap rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-2.5 py-1.5 font-display text-[11px] font-semibold text-[var(--pg-text-primary)] opacity-0 shadow-md transition-opacity duration-100 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 ${
        side === 'right' ? 'left-full ml-3' : 'right-full mr-3'
      }`}
    >
      {label}
    </span>
  );
}
