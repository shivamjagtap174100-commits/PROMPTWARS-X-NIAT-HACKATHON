import { CheckSquare, Eye, EyeOff, Info, Loader2, ShieldAlert, Square } from 'lucide-react';
import { useMemo, useState } from 'react';
import { applyPartialMask } from '../../engine/redaction/masking';
import type {
  CategoryCounts,
  DetectionMatch,
  EnabledCategoriesMap,
  EntityCategory,
} from '../../types/privacy';
import { CATEGORY_META, CATEGORY_ORDER } from '../../utils/categoryTheme';

interface DetectionInsightsPaneProps {
  matches: DetectionMatch[];
  counts: CategoryCounts;
  excludedIds: string[];
  enabledCategories: EnabledCategoriesMap;
  isProcessing: boolean;
  hasText: boolean;
  onToggleCategory: (category: EntityCategory) => void;
  onEnableAllCategories: () => void;
  onToggleExclude: (matchId: string) => void;
}

export function DetectionInsightsPane({
  matches,
  counts,
  excludedIds,
  enabledCategories,
  isProcessing,
  hasText,
  onToggleCategory,
  onEnableAllCategories,
  onToggleExclude,
}: DetectionInsightsPaneProps) {
  const [filter, setFilter] = useState<'ALL' | EntityCategory>('ALL');
  const excludedSet = useMemo(() => new Set(excludedIds), [excludedIds]);

  const filteredMatches = useMemo(() => {
    if (filter === 'ALL') return matches;
    return matches.filter((m) => m.category === filter);
  }, [matches, filter]);

  const identifiedCategoryCount = useMemo(() => {
    return new Set(matches.map((m) => m.category)).size;
  }, [matches]);

  const anyCategoryDisabled = CATEGORY_ORDER.some((c) => !enabledCategories[c]);
  const totalDetected = matches.length;

  return (
    <section
      aria-labelledby="detection-insights-heading"
      className="flex h-full flex-col bg-[var(--pg-surface)] text-[var(--pg-text-primary)]"
    >
      {/* Swiss Column Header */}
      <div className="border-b border-[var(--pg-border)] px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2
              id="detection-insights-heading"
              className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]"
            >
              02 · Detection Review
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-[var(--pg-text-secondary)]">
              {totalDetected} {totalDetected === 1 ? 'entity' : 'entities'} detected ·{' '}
              {identifiedCategoryCount}{' '}
              {identifiedCategoryCount === 1 ? 'category' : 'categories'} identified ·{' '}
              {counts.total} ready for sanitization
            </p>
          </div>

          <div
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 py-1 font-mono text-[11px]"
          >
            {isProcessing ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin text-[#173D30] dark:text-[#A3C1A5]"
                  strokeWidth={1.85}
                />
                <span>Scanning</span>
              </>
            ) : !hasText ? (
              <span className="text-[var(--pg-text-muted)]">Idle</span>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#367A55] dark:bg-[#A3C1A5]" />
                <span className="tabular-nums">{counts.total} active</span>
              </>
            )}
          </div>
        </div>

        {/* Category Detector Switches & Quick Filters */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-[var(--pg-text-muted)]">
              Rule toggles · click count to filter
            </span>
            {anyCategoryDisabled && (
              <button
                type="button"
                onClick={onEnableAllCategories}
                className="font-display font-semibold text-[#173D30] underline-offset-2 hover:underline dark:text-[#A3C1A5]"
              >
                Enable all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">
            {CATEGORY_ORDER.map((category) => {
              const meta = CATEGORY_META[category];
              const enabled = enabledCategories[category];
              const catCount = counts[category];

              return (
                <div
                  key={category}
                  className={`flex items-center justify-between rounded-lg border px-2 py-1 text-xs transition-colors ${
                    enabled
                      ? 'border-[var(--pg-border)] bg-[var(--pg-bg)]'
                      : 'border-[var(--pg-border)] bg-[var(--pg-surface-secondary)]/55 opacity-55'
                  }`}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`Toggle ${meta.label} detector`}
                    onClick={() => onToggleCategory(category)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  >
                    {enabled ? (
                      <CheckSquare
                        className="h-4 w-4 shrink-0 text-[#173D30] dark:text-[#A3C1A5]"
                        strokeWidth={1.85}
                      />
                    ) : (
                      <Square
                        className="h-4 w-4 shrink-0 text-[var(--pg-text-muted)]"
                        strokeWidth={1.85}
                      />
                    )}
                    <span className="truncate font-display text-[11px] font-semibold">
                      {meta.shortLabel}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter((prev) => (prev === category ? 'ALL' : category))}
                    title={`Filter list by ${meta.label}`}
                    className={`ml-1 rounded px-1.5 py-0.2 font-mono text-[11px] tabular-nums transition-colors ${
                      filter === category
                        ? 'bg-[#173D30] text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]'
                        : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
                    }`}
                  >
                    {catCount}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--pg-border)] bg-[var(--pg-bg)]/60 px-4 py-2 text-xs">
        <span className="font-mono text-[11px] text-[var(--pg-text-secondary)]">
          {filter === 'ALL'
            ? `Showing ${filteredMatches.length} matched occurrences (masked preview)`
            : `Filtered: ${CATEGORY_META[filter].label} (${filteredMatches.length})`}
        </span>
        {filter !== 'ALL' && (
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className="font-mono text-[11px] font-medium text-[#173D30] hover:underline dark:text-[#A3C1A5]"
          >
            Show all
          </button>
        )}
      </div>

      {/* Match Stream: Masked Preview + Location + Detection Rule + Include/Exclude */}
      <div className="h-[380px] flex-1 divide-y divide-[var(--pg-border)] overflow-auto">
        {filteredMatches.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Info
              className="h-5 w-5 text-[var(--pg-text-muted)]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <p className="mt-2 font-display text-xs font-semibold text-[var(--pg-text-primary)]">
              {!hasText
                ? 'Awaiting document input'
                : matches.length === 0
                  ? 'No sensitive PII matched active rules'
                  : 'No matches in selected category filter'}
            </p>
            <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
              {!hasText
                ? 'Load a sample or enter text on the left to review matched entities.'
                : 'Original text stays unchanged when no valid PII entity matches.'}
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isExcluded = excludedSet.has(match.id);
            const meta = CATEGORY_META[match.category];
            const maskedPreview = applyPartialMask(match.category, match.value);
            const locationText =
              match.rowIndex !== undefined
                ? `Row ${match.rowIndex + 1} · ${match.columnHeader || `Col ${(match.columnIndex ?? 0) + 1}`}`
                : `Chars ${match.start}–${match.end}`;

            return (
              <div
                key={match.id}
                className={`p-3.5 transition-colors ${
                  isExcluded
                    ? 'bg-[var(--pg-surface-secondary)]/45 opacity-70'
                    : 'hover:bg-[var(--pg-bg)]/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-display text-[11px] font-semibold ${meta.badgeClasses}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 rounded-full ${meta.dotColorClass}`}
                        />
                        {meta.shortLabel}
                      </span>

                      <span className="font-mono text-[10px] text-[var(--pg-text-muted)]">
                        {locationText}
                      </span>

                      <span className="font-mono text-[10px] text-[var(--pg-text-secondary)]">
                        · {isExcluded ? 'Excluded' : 'Included'}
                      </span>
                    </div>

                    <div className="mt-1.5">
                      <code
                        className={`inline-block max-w-full truncate rounded border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)]/70 px-1.5 py-0.5 font-mono text-xs text-[var(--pg-text-primary)] ${
                          isExcluded ? 'line-through' : ''
                        }`}
                      >
                        {maskedPreview}
                      </code>
                    </div>

                    <p className="mt-1 text-[11px] leading-snug text-[var(--pg-text-secondary)]">
                      <span className="font-medium text-[var(--pg-text-primary)]">
                        {match.detectionSource}:
                      </span>{' '}
                      {match.confidenceReason}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-pressed={isExcluded}
                    onClick={() => onToggleExclude(match.id)}
                    className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 font-display text-[11px] font-semibold transition-colors ${
                      isExcluded
                        ? 'border-[#173D30] bg-[#173D30] text-[#FBFAF6] dark:border-[#A3C1A5] dark:bg-[#A3C1A5] dark:text-[#111713]'
                        : 'border-[var(--pg-border)] bg-[var(--pg-bg)] text-[var(--pg-text-primary)] hover:border-[var(--pg-border-strong)]'
                    }`}
                  >
                    {isExcluded ? (
                      <>
                        <Eye className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                        Restore
                      </>
                    ) : (
                      <>
                        <EyeOff
                          className="h-4 w-4 text-[var(--pg-text-secondary)]"
                          strokeWidth={1.85}
                          aria-hidden="true"
                        />
                        Exclude
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Format Validation Footnote */}
      <div className="flex items-center gap-2 border-t border-[var(--pg-border)] bg-[var(--pg-bg)]/60 px-4 py-2.5 text-[11px] text-[var(--pg-text-secondary)]">
        <ShieldAlert
          className="h-4 w-4 shrink-0 text-[#B88735] dark:text-[#D6B879]"
          strokeWidth={1.85}
          aria-hidden="true"
        />
        <span>
          PAN, Aadhaar &amp; Luhn checks validate syntax locally — never external registry lookup.
        </span>
      </div>
    </section>
  );
}
