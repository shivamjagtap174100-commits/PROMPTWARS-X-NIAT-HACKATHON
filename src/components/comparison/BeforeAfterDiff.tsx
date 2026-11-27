import { useMemo, useRef } from 'react';
import type { DiffSegment, RedactionMode } from '../../types/privacy';
import { CATEGORY_META, REDACTION_MODE_META } from '../../utils/categoryTheme';

interface BeforeAfterDiffProps {
  originalSegments: DiffSegment[];
  sanitizedSegments: DiffSegment[];
  redactionMode: RedactionMode;
  syncScroll: boolean;
  onToggleSyncScroll: (enabled: boolean) => void;
}

export function BeforeAfterDiff({
  originalSegments,
  sanitizedSegments,
  redactionMode,
  syncScroll,
  onToggleSyncScroll,
}: BeforeAfterDiffProps) {
  const origRef = useRef<HTMLDivElement>(null);
  const sanRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef<'orig' | 'san' | null>(null);

  const diffSummary = useMemo(() => {
    let changedCount = 0;
    let excludedCount = 0;
    for (const seg of originalSegments) {
      if (!seg.isEntity) continue;
      if (seg.excluded) {
        excludedCount += 1;
      } else {
        changedCount += 1;
      }
    }
    return {
      totalDetected: changedCount + excludedCount,
      changedCount,
      excludedCount,
    };
  }, [originalSegments]);

  const handleScroll = (source: 'orig' | 'san') => {
    if (!syncScroll) return;
    if (syncingRef.current && syncingRef.current !== source) return;

    const fromEl = source === 'orig' ? origRef.current : sanRef.current;
    const toEl = source === 'orig' ? sanRef.current : origRef.current;
    if (!fromEl || !toEl) return;

    syncingRef.current = source;
    const maxFromScroll = Math.max(1, fromEl.scrollHeight - fromEl.clientHeight);
    const ratio = fromEl.scrollTop / maxFromScroll;
    const maxToScroll = Math.max(0, toEl.scrollHeight - toEl.clientHeight);
    toEl.scrollTop = ratio * maxToScroll;

    requestAnimationFrame(() => {
      syncingRef.current = null;
    });
  };

  return (
    <section aria-labelledby="before-after-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
            Side-by-side comparison
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-3">
            <h3
              id="before-after-heading"
              className="font-display text-xl font-semibold tracking-tight text-[var(--pg-text-primary)]"
            >
              Document comparison (Before / After)
            </h3>
            <span
              data-testid="diff-summary-badge"
              className="font-mono text-xs tabular-nums text-[var(--pg-text-secondary)]"
            >
              Detected: {diffSummary.totalDetected} · Sanitized: {diffSummary.changedCount} redacted ·
              Excluded: {diffSummary.excludedCount} · Mode: {REDACTION_MODE_META[redactionMode].title}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden flex-wrap items-center gap-3 text-xs text-[var(--pg-text-secondary)] xl:flex">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${meta.dotColorClass}`}
                />
                <span>{meta.shortLabel}</span>
              </span>
            ))}
          </div>

          <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 font-display text-xs font-medium text-[var(--pg-text-primary)]">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => onToggleSyncScroll(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#173D30]"
            />
            Synchronize scroll
          </label>
        </div>
      </div>

      {/* Unified Framed 2-Column Editorial Diff */}
      <div className="pg-shadow-card grid divide-y divide-[var(--pg-border)] overflow-hidden rounded-[10px] border border-[var(--pg-border)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Left: Original Document */}
        <div className="flex flex-col bg-[var(--pg-surface)] text-[var(--pg-text-primary)]">
          <div className="flex items-center justify-between border-b border-[var(--pg-border)] px-5 py-3">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.06em] text-[var(--pg-text-primary)]">
              Original document
            </span>
            <span className="font-mono text-xs text-[var(--pg-text-muted)]">
              Detected entities annotated
            </span>
          </div>

          <div
            ref={origRef}
            onScroll={() => handleScroll('orig')}
            data-testid="diff-original-pane"
            className="h-72 overflow-auto p-5 font-mono text-xs leading-6 whitespace-pre-wrap break-words"
          >
            {originalSegments.length === 0 ? (
              <span className="text-[var(--pg-text-muted)]">
                Original highlighted lines render here once text or a file is loaded
              </span>
            ) : (
              originalSegments.map((seg, idx) => {
                if (!seg.isEntity || !seg.category) {
                  return <span key={idx}>{seg.text}</span>;
                }
                const meta = CATEGORY_META[seg.category];
                return (
                  <mark
                    key={`${seg.matchId || idx}`}
                    title={`${meta.label}${seg.excluded ? ' (Excluded)' : ''}`}
                    className={`rounded-xs px-1 py-0.5 font-medium transition-colors ${
                      seg.excluded
                        ? 'bg-transparent text-inherit line-through opacity-65'
                        : meta.originalHighlightClasses
                    }`}
                  >
                    {seg.text}
                    <span className="ml-1 select-none text-[10px] font-normal opacity-80">
                      [{meta.shortLabel}]
                    </span>
                  </mark>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Sanitized Document */}
        <div className="pg-dark-console flex flex-col text-[#F1F1E9]">
          <div className="flex items-center justify-between border-b border-white/12 px-5 py-3">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.06em] text-[#DDE6DA]">
              Sanitized document
            </span>
            <span className="font-mono text-xs text-[#A5AEA5]">
              Synchronized replacements
            </span>
          </div>

          <div
            ref={sanRef}
            onScroll={() => handleScroll('san')}
            data-testid="diff-sanitized-pane"
            className="h-72 overflow-auto p-5 font-mono text-xs leading-6 whitespace-pre-wrap break-words"
          >
            {sanitizedSegments.length === 0 ? (
              <span className="text-[#829782]">
                Sanitized comparison output renders here
              </span>
            ) : (
              sanitizedSegments.map((seg, idx) => {
                if (!seg.isEntity || !seg.category) {
                  return <span key={idx}>{seg.text}</span>;
                }
                const meta = CATEGORY_META[seg.category];
                return (
                  <mark
                    key={`${seg.matchId || idx}`}
                    title={
                      seg.excluded
                        ? `${meta.label} excluded by user`
                        : `${meta.label} sanitized`
                    }
                    className={`rounded-xs px-1 py-0.5 font-medium transition-colors ${
                      seg.excluded
                        ? 'border border-[#D6B879]/45 bg-transparent text-[#D6B879]'
                        : meta.replacementHighlightClasses
                    }`}
                  >
                    {seg.text}
                  </mark>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
