import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildMappingInspectorEntries } from '../../engine/redaction/mappingInspector';
import type { DetectionMatch, RedactedReplacement, RedactionMode } from '../../types/privacy';
import { CATEGORY_META, REDACTION_MODE_META } from '../../utils/categoryTheme';

interface PseudonymMappingInspectorProps {
  matches: DetectionMatch[];
  replacements: RedactedReplacement[];
  redactionMode: RedactionMode;
}

export function PseudonymMappingInspector({
  matches,
  replacements,
  redactionMode,
}: PseudonymMappingInspectorProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const entries = useMemo(
    () => buildMappingInspectorEntries(matches, replacements),
    [matches, replacements]
  );

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      aria-label="Pseudonymization mapping inspector"
      className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pg-border)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <KeyRound
            className="h-5 w-5 shrink-0 text-[#173D30] dark:text-[#A3C1A5]"
            strokeWidth={1.85}
            aria-hidden="true"
          />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
              Ephemeral Token Inspector · {REDACTION_MODE_META[redactionMode].title}
            </p>
            <h3 className="font-display text-base font-semibold text-[var(--pg-text-primary)]">
              Pseudonymization mapping inspector
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 py-1 font-mono text-[11px] text-[var(--pg-text-secondary)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#367A55] dark:text-[#A3C1A5]" strokeWidth={1.85} aria-hidden="true" />
          Masked by default · never logged
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-[var(--pg-text-secondary)]">
          Load a sample document or paste text to inspect active token replacements and deterministic
          pseudonym counters.
        </div>
      ) : (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--pg-text-secondary)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Assigned Output Token</th>
                <th className="px-4 py-2.5 font-medium">Source Reference</th>
                <th className="px-4 py-2.5 font-medium">Occurrences</th>
                <th className="px-4 py-2.5 text-right font-medium">RAM Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pg-border)]">
              {entries.map((entry) => {
                const meta = CATEGORY_META[entry.category];
                const isRevealed = Boolean(revealedIds[entry.id]);
                return (
                  <tr key={entry.id} className="hover:bg-[var(--pg-bg)]/50">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-[var(--pg-text-primary)]">
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 rounded-full ${meta.dotColorClass}`}
                        />
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="rounded border border-[#367A55]/30 bg-[#DDE6DA]/70 px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#102D24] dark:border-[#A3C1A5]/35 dark:bg-[#233128] dark:text-[#DDE6DA]">
                        {entry.replacementToken}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--pg-text-primary)]">
                      {isRevealed ? entry.rawValue : entry.maskedHint}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--pg-text-secondary)]">
                      <span className="font-semibold text-[var(--pg-text-primary)]">
                        ×{entry.occurrenceCount}
                      </span>{' '}
                      ({entry.positions.join(', ')})
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        aria-pressed={isRevealed}
                        onClick={() => toggleReveal(entry.id)}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2 font-display text-[11px] font-medium text-[var(--pg-text-secondary)] transition-colors hover:border-[var(--pg-border-strong)] hover:text-[var(--pg-text-primary)]"
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
                            Reveal
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
