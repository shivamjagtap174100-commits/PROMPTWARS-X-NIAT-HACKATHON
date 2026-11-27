import { ShieldCheck, Trash2 } from 'lucide-react';
import type { AuditEntry } from '../../types/privacy';
import { REDACTION_MODE_META } from '../../utils/categoryTheme';

interface PrivacyAuditPanelProps {
  entries: AuditEntry[];
  onClearAudit: () => void;
}

export function PrivacyAuditPanel({ entries, onClearAudit }: PrivacyAuditPanelProps) {
  return (
    <section
      aria-labelledby="privacy-audit-heading"
      className="pg-shadow-card flex flex-col rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pg-border)] px-5 py-3.5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
            Privacy-safe audit
          </p>
          <h3
            id="privacy-audit-heading"
            className="mt-0.5 font-display text-base font-semibold text-[var(--pg-text-primary)]"
          >
            Sanitization audit ledger
          </h3>
        </div>

        <button
          type="button"
          onClick={onClearAudit}
          disabled={entries.length === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] px-2.5 font-display text-xs font-medium text-[var(--pg-text-secondary)] transition-colors hover:border-[#B64B43]/45 hover:text-[#B64B43] disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
          Clear audit
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--pg-border)] bg-[var(--pg-bg)]/70 px-5 py-2.5 text-xs text-[var(--pg-text-secondary)]">
        <ShieldCheck
          className="h-4 w-4 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
          strokeWidth={1.85}
          aria-hidden="true"
        />
        <span>
          Zero raw text, original PII values, or pseudonym mappings are recorded in audit history
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center text-xs text-[var(--pg-text-secondary)]">
          No audit entries recorded yet — sanitize a document to log non-sensitive metadata
        </div>
      ) : (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--pg-text-secondary)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Mode</th>
                <th className="px-4 py-2.5 font-medium">Entities</th>
                <th className="px-4 py-2.5 font-medium">Duration</th>
                <th className="px-4 py-2.5 text-right font-medium">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pg-border)]">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-[var(--pg-text-secondary)]">
                    {entry.timestamp}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-[var(--pg-text-primary)]">
                    {entry.fileName || `Inline ${entry.fileKind.toUpperCase()}`}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--pg-text-secondary)]">
                    {REDACTION_MODE_META[entry.redactionMode].title}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-mono font-medium tabular-nums text-[var(--pg-text-primary)]">
                      {entry.totalEntities} active
                      {entry.excludedEntities > 0 ? ` (${entry.excludedEntities} excl)` : ''}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-[var(--pg-text-muted)]">
                      E:{entry.categoryCounts.EMAIL} · P:{entry.categoryCounts.PHONE} · IP:
                      {entry.categoryCounts.IP} · PAN:{entry.categoryCounts.PAN} · AAD:
                      {entry.categoryCounts.AADHAAR} · CC:{entry.categoryCounts.CREDIT_CARD}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-[var(--pg-text-secondary)]">
                    {entry.durationMs}ms
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-[#173D30] dark:text-[#A3C1A5]">
                    {entry.exportStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
