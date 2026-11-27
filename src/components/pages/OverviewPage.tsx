import {
  ArrowRight,
  CheckCircle2,
  Database,
  FilePlus2,
  FileText,
  FileUp,
  Lock,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import type { useSanitizationSession } from '../../hooks/useSanitizationSession';
import type { AppRoute } from '../../types/privacy';
import { CATEGORY_META, CATEGORY_ORDER, REDACTION_MODE_META } from '../../utils/categoryTheme';
import { BrandLockup } from '../shared/PrivacyBadge';

interface OverviewPageProps {
  onNavigate: (route: AppRoute) => void;
  sanitization: ReturnType<typeof useSanitizationSession>;
  onTriggerUpload: () => void;
}

export function OverviewPage({ onNavigate, sanitization, onTriggerUpload }: OverviewPageProps) {
  const {
    result,
    auditEntries,
    sessionDocuments,
    enabledCategories,
    redactionMode,
    statusMessage,
  } = sanitization;

  const recentSessions = auditEntries.slice(0, 4);
  const totalDetected = result.counts.total + result.excludedCount;

  const handleLoadSampleAndOpen = () => {
    sanitization.loadSampleData();
    onNavigate('/workspace');
  };

  const handleStartNewScan = () => {
    sanitization.clearDocument();
    onNavigate('/workspace');
  };

  return (
    <div className="pg-enter">
      {/* Top Editorial Band */}
      <section className="mx-auto max-w-[1440px] space-y-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#173D30] dark:text-[#A3C1A5]">
              Privacy starts with control.
            </p>
            <h1 className="mt-2.5 font-display text-4xl font-bold tracking-[-0.03em] text-[var(--pg-text-primary)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
              Your data. Your control.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--pg-text-secondary)]">
              Detect sensitive PII across raw logs, support records, and RFC 4180 CSV tables,
              verify matched rules with masked previews, and apply local redaction or consistent
              pseudonymization inside your browser.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/workspace')}
                className="pg-action-primary inline-flex h-11 items-center gap-2 rounded-lg px-5 font-display text-xs font-semibold uppercase tracking-[0.06em]"
              >
                <span>Open Workspace</span>
                <ArrowRight className="h-5 w-5" strokeWidth={1.85} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleLoadSampleAndOpen}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-5 font-display text-xs font-semibold uppercase tracking-[0.05em] text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
              >
                <Database
                  className="h-4 w-4 text-[#173D30] dark:text-[#A3C1A5]"
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
                <span>Load Sample</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/privacy-centre')}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 font-display text-xs font-semibold text-[#173D30] underline-offset-4 hover:underline dark:text-[#A3C1A5]"
              >
                <Lock className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                <span>Explore Privacy Architecture</span>
              </button>
            </div>
          </div>

          {/* Privacy Status Compact Panel */}
          <div className="lg:col-span-5">
            <div className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]">
              <div className="flex items-center justify-between border-b border-[var(--pg-border)] px-5 py-3">
                <span className="font-display text-xs font-semibold uppercase tracking-[0.07em] text-[var(--pg-text-primary)]">
                  Privacy Status
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#367A55] dark:text-[#A3C1A5]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#367A55] dark:bg-[#A3C1A5]" />
                  Verified Local
                </span>
              </div>

              <dl className="divide-y divide-[var(--pg-border)] text-xs">
                <div className="flex items-center justify-between px-5 py-2.5">
                  <dt className="text-[var(--pg-text-secondary)]">Processing mode</dt>
                  <dd className="font-mono font-medium text-[var(--pg-text-primary)]">
                    {REDACTION_MODE_META[redactionMode].title}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <dt className="text-[var(--pg-text-secondary)]">Local processing status</dt>
                  <dd className="font-mono font-medium text-[#367A55] dark:text-[#A3C1A5]">
                    {result.usedWorker ? 'Web Worker RAM active' : 'Browser JS RAM active'}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <dt className="text-[var(--pg-text-secondary)]">Current session status</dt>
                  <dd className="font-mono font-medium text-[var(--pg-text-primary)]">
                    Saved locally (zero passcodes)
                  </dd>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <dt className="text-[var(--pg-text-secondary)]">File handling status</dt>
                  <dd className="font-mono font-medium text-[var(--pg-text-primary)]">
                    TXT &amp; RFC 4180 CSV · 0 uploads
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Workspace Quick Access Strip */}
        <section
          aria-labelledby="workspace-quick-access-heading"
          className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                Workspace Quick Access
              </p>
              <h2
                id="workspace-quick-access-heading"
                className="mt-0.5 font-display text-base font-semibold text-[var(--pg-text-primary)]"
              >
                Start processing documents locally in seconds
              </h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
              <button
                type="button"
                onClick={() => onNavigate('/workspace')}
                className="pg-action-primary inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 font-display text-xs font-semibold"
              >
                <ScanSearch className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Open Workspace
              </button>

              <button
                type="button"
                onClick={onTriggerUpload}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-4 font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
              >
                <FileUp className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Upload Document
              </button>

              <button
                type="button"
                onClick={handleLoadSampleAndOpen}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-4 font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
              >
                <Database className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Load Sample
              </button>

              <button
                type="button"
                onClick={handleStartNewScan}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-4 font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
              >
                <FilePlus2 className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Start New Scan
              </button>
            </div>
          </div>
        </section>

        {/* Real Session Summary + Detectors + Recent Activity Grid */}
        <div className="grid divide-y divide-[var(--pg-border)] rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Column 1: Real Session Summary */}
          <div className="flex flex-col justify-between p-6 lg:col-span-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                01 · Real Session Summary
              </p>
              <h2 className="mt-1 font-display text-base font-semibold text-[var(--pg-text-primary)]">
                Live current-session counts
              </h2>
              <dl className="mt-5 space-y-3 text-xs">
                <div className="flex items-baseline justify-between border-b border-[var(--pg-border)] pb-2">
                  <dt className="text-[var(--pg-text-secondary)]">Documents processed</dt>
                  <dd className="font-mono text-sm font-semibold tabular-nums text-[var(--pg-text-primary)]">
                    {sessionDocuments.length}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--pg-border)] pb-2">
                  <dt className="text-[var(--pg-text-secondary)]">Sensitive entities detected</dt>
                  <dd className="font-mono text-sm font-semibold tabular-nums text-[var(--pg-text-primary)]">
                    {totalDetected}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--pg-border)] pb-2">
                  <dt className="text-[var(--pg-text-secondary)]">Entities sanitized</dt>
                  <dd className="font-mono text-sm font-semibold tabular-nums text-[#367A55] dark:text-[#A3C1A5]">
                    {result.counts.total}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--pg-border)] pb-2">
                  <dt className="text-[var(--pg-text-secondary)]">Last scan status</dt>
                  <dd className="font-mono text-xs text-[var(--pg-text-primary)]">{statusMessage}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-[var(--pg-text-secondary)]">
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <span>Genuine runtime counters only — zero fabricated statistics.</span>
            </div>
          </div>

          {/* Column 2: Detection Category Overview */}
          <div className="p-6 lg:col-span-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
              02 · Detection Engine
            </p>
            <h2 className="mt-1 font-display text-base font-semibold text-[var(--pg-text-primary)]">
              Supported category rules
            </h2>
            <ul className="mt-4 divide-y divide-[var(--pg-border)]">
              {CATEGORY_ORDER.map((category) => {
                const meta = CATEGORY_META[category];
                const enabled = enabledCategories[category];
                return (
                  <li
                    key={category}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-[var(--pg-text-primary)]">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 rounded-full ${meta.dotColorClass}`}
                      />
                      {meta.label}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-[var(--pg-text-muted)]">
                      {enabled ? `${result.counts[category]} active` : 'Disabled'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Recent Activity */}
          <div className="flex flex-col justify-between p-6 lg:col-span-4">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                    03 · Recent Activity
                  </p>
                  <h2 className="mt-1 font-display text-base font-semibold text-[var(--pg-text-primary)]">
                    Session activity feed
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/audit-trail')}
                  className="font-display text-xs font-semibold text-[#173D30] hover:underline dark:text-[#A3C1A5]"
                >
                  Audit trail →
                </button>
              </div>

              {recentSessions.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-[var(--pg-border)] bg-[var(--pg-bg)]/70 p-5 text-center">
                  <FileText
                    className="mx-auto h-6 w-6 text-[var(--pg-text-muted)]"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                  <p className="mt-2 font-display text-xs font-semibold text-[var(--pg-text-primary)]">
                    No activity in this session yet
                  </p>
                  <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
                    Load the benchmark sample or scan a local file to view real processing events.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSampleAndOpen}
                    className="pg-action-primary mt-3 inline-flex h-8 items-center rounded-lg px-3 font-display text-xs font-semibold"
                  >
                    Try Sample Document
                  </button>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--pg-border)]">
                  {recentSessions.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--pg-text-primary)]">
                          {item.eventType === 'RESET'
                            ? 'Session reset'
                            : item.fileName || `Inline ${item.fileKind.toUpperCase()}`}
                        </p>
                        <p className="font-mono text-[11px] text-[var(--pg-text-muted)]">
                          {item.timestamp} ·{' '}
                          {item.eventType === 'RESET'
                            ? 'Buffers cleared'
                            : REDACTION_MODE_META[item.redactionMode].title}
                        </p>
                      </div>
                      <span className="shrink-0 rounded border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[var(--pg-text-primary)]">
                        {item.eventType === 'RESET' ? 'Reset' : `${item.totalEntities} PII`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--pg-border)] pt-4 text-xs text-[var(--pg-text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck
                  className="h-4 w-4 text-[#367A55] dark:text-[#A3C1A5]"
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
                Zero raw PII stored
              </span>
              <button
                type="button"
                onClick={() => onNavigate('/documentation')}
                className="font-display font-semibold text-[var(--pg-text-primary)] hover:underline"
              >
                Read docs
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--pg-border)] py-7">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup compact />
          <p className="font-mono text-xs text-[var(--pg-text-secondary)]">
            Precision · Trust · Clarity · Privacy — 100% browser-local execution
          </p>
        </div>
      </footer>
    </div>
  );
}
