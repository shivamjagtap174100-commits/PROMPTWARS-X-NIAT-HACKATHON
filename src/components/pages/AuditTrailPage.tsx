import { CheckCircle2, Clock, Download, History, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { useSanitizationSession } from '../../hooks/useSanitizationSession';
import type { AppRoute } from '../../types/privacy';
import { REDACTION_MODE_META } from '../../utils/categoryTheme';
import { ProcessingLogPanel } from '../activity/ProcessingLogPanel';
import { BrandLockup } from '../shared/PrivacyBadge';

interface AuditTrailPageProps {
  sanitization: ReturnType<typeof useSanitizationSession>;
  onNavigate: (route: AppRoute) => void;
}

type EventFilter = 'ALL' | 'SCANS' | 'EXPORTS' | 'RESETS';

export function AuditTrailPage({ sanitization, onNavigate }: AuditTrailPageProps) {
  const [eventFilter, setEventFilter] = useState<EventFilter>('ALL');

  const filteredRuns = useMemo(() => {
    if (eventFilter === 'SCANS') {
      return sanitization.auditEntries.filter((e) => (e.eventType || 'SCAN') === 'SCAN');
    }
    if (eventFilter === 'EXPORTS') {
      return sanitization.auditEntries.filter(
        (e) => (e.eventType || 'SCAN') === 'SCAN' && e.exportStatus !== 'Not Exported'
      );
    }
    if (eventFilter === 'RESETS') {
      return sanitization.auditEntries.filter((e) => e.eventType === 'RESET');
    }
    return sanitization.auditEntries;
  }, [sanitization.auditEntries, eventFilter]);

  return (
    <div className="pg-enter">
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--pg-border)] pb-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#173D30] dark:text-[#A3C1A5]">
              Audit Trail · Verifiable Event Sequence
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-[var(--pg-text-primary)]">
              Technical audit timeline
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--pg-text-secondary)]">
              Chronological event ledger recording Scan started, Scan completed, Detection count,
              Redaction mode, Export event, and Session reset using safe metadata only.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] p-1">
              {(
                [
                  { id: 'ALL', label: 'All events' },
                  { id: 'SCANS', label: 'Scans' },
                  { id: 'EXPORTS', label: 'Exports' },
                  { id: 'RESETS', label: 'Resets' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEventFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 font-display text-xs font-medium transition-colors ${
                    eventFilter === tab.id
                      ? 'bg-[#173D30] text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]'
                      : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={sanitization.exportAuditMetadata}
              disabled={sanitization.auditEntries.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3.5 font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[#173D30] disabled:opacity-40"
            >
              <Download className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              Export metadata
            </button>

            <button
              type="button"
              onClick={sanitization.clearAuditHistory}
              disabled={sanitization.auditEntries.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3.5 font-display text-xs font-medium text-[var(--pg-text-secondary)] transition-colors hover:border-[#B64B43]/45 hover:text-[#B64B43] disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              Clear timeline
            </button>
          </div>
        </div>

        {/* Non-PII Logging Guarantee */}
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-4 py-3 text-xs text-[var(--pg-text-secondary)]">
          <ShieldCheck
            className="h-4 w-4 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
            strokeWidth={1.85}
            aria-hidden="true"
          />
          <span>
            Strict privacy guarantee: Original detected PII strings and pseudonym mappings are
            never stored in audit rows, exported metadata JSON, or system logs.
          </span>
        </div>

        {/* Main 12-Column Split: Timeline (7) + Monospace Stream Log (5) */}
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            {filteredRuns.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-[var(--pg-border)] bg-[var(--pg-surface)] px-6 py-14 text-center">
                <History
                  className="mx-auto h-6 w-6 text-[var(--pg-text-muted)]"
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
                <p className="mt-3 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                  No matching timeline events
                </p>
                <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
                  Scan, export, or reset a document in Workspace to trace safe non-PII milestones.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/workspace')}
                  className="pg-action-primary mt-5 rounded-lg px-4 py-2 font-display text-xs font-semibold"
                >
                  Open Workspace
                </button>
              </div>
            ) : (
              filteredRuns.map((entry) => {
                const isReset = entry.eventType === 'RESET';
                const categoryBadge = isReset
                  ? 'RESET'
                  : entry.exportStatus !== 'Not Exported'
                    ? 'EXPORT'
                    : 'SCAN';

                return (
                  <article
                    key={entry.id}
                    className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
                  >
                    {/* Run Summary Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pg-border)] px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#173D30] dark:text-[#A3C1A5]">
                          {categoryBadge}
                        </span>
                        <span className="font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                          {isReset
                            ? 'Session reset'
                            : entry.fileName || `Inline ${entry.fileKind.toUpperCase()} document`}
                        </span>
                        {!isReset && (
                          <span className="font-mono text-xs text-[var(--pg-text-muted)]">
                            · {REDACTION_MODE_META[entry.redactionMode].title} ·{' '}
                            {entry.totalEntities} PII
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                        <span className="text-[var(--pg-text-muted)]">{entry.dateLabel}</span>
                        {!isReset && (
                          <span className="rounded border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2 py-0.5 text-[11px] text-[var(--pg-text-primary)]">
                            {entry.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Connected Milestones */}
                    <ol className="relative space-y-4 px-5 py-5">
                      {entry.stages.map((stage, index) => {
                        const isDone = stage.status === 'done';
                        const hasConnector = index < entry.stages.length - 1;
                        return (
                          <li key={stage.stage} className="relative flex items-start gap-3.5 pl-1">
                            {hasConnector && (
                              <span
                                aria-hidden="true"
                                className="absolute left-[11px] top-5 h-[calc(100%+4px)] w-px bg-[var(--pg-border)]"
                              />
                            )}
                            <span className="relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--pg-surface)]">
                              {isDone ? (
                                <CheckCircle2
                                  className="h-4 w-4 text-[#367A55] dark:text-[#A3C1A5]"
                                  strokeWidth={1.85}
                                  aria-hidden="true"
                                />
                              ) : (
                                <Clock
                                  className="h-4 w-4 text-[#B88735] dark:text-[#D6B879]"
                                  strokeWidth={1.85}
                                  aria-hidden="true"
                                />
                              )}
                            </span>

                            <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-2 border-b border-[var(--pg-border)]/55 pb-2.5 last:border-b-0">
                              <div>
                                <span className="font-display text-xs font-semibold text-[var(--pg-text-primary)]">
                                  {stage.label}
                                </span>
                                <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">
                                  {stage.detail}
                                </p>
                              </div>
                              <span className="font-mono text-[11px] tabular-nums text-[var(--pg-text-muted)]">
                                {stage.timestamp}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </article>
                );
              })
            )}
          </div>

          <div className="lg:col-span-5">
            <ProcessingLogPanel
              logs={sanitization.logs}
              onClearLogs={sanitization.clearLogs}
            />
          </div>
        </div>
      </div>

      <footer className="border-t border-[var(--pg-border)] py-7">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup compact />
          <p className="font-mono text-xs text-[var(--pg-text-secondary)]">
            Verifiable processing milestones · Non-PII audit metadata only
          </p>
        </div>
      </footer>
    </div>
  );
}
