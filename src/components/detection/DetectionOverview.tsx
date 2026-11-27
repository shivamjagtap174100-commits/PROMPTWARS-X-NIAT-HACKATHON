import type { CategoryCounts } from '../../types/privacy';
import {
  CATEGORY_META,
  CORE_CATEGORY_ORDER,
  EXTENDED_CATEGORY_ORDER,
} from '../../utils/categoryTheme';

interface DetectionOverviewProps {
  counts: CategoryCounts;
  excludedCount: number;
  durationMs: number;
  usedWorker: boolean;
}

export function DetectionOverview({
  counts,
  excludedCount,
  durationMs,
  usedWorker,
}: DetectionOverviewProps) {
  const totalDetected = counts.total + excludedCount;
  const activeExtendedCategories = EXTENDED_CATEGORY_ORDER.filter((cat) => counts[cat] > 0);

  return (
    <section aria-labelledby="detection-overview-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
            Classification ledger
          </p>
          <h3
            id="detection-overview-heading"
            className="mt-0.5 font-display text-lg font-semibold tracking-tight text-[var(--pg-text-primary)]"
          >
            Real-time entity counts
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums text-[var(--pg-text-secondary)]">
          <span>Detected: {totalDetected}</span>
          <span className="text-[var(--pg-text-muted)]">·</span>
          <span
            data-testid="sanitized-entities-count"
            className="font-medium text-[#173D30] dark:text-[#A3C1A5]"
          >
            Sanitized: {counts.total}
          </span>
          <span className="text-[var(--pg-text-muted)]">·</span>
          <span>Excluded: {excludedCount}</span>
          <span className="text-[var(--pg-text-muted)]">·</span>
          <span>Duration: {durationMs}ms</span>
          <span className="text-[var(--pg-text-muted)]">·</span>
          <span>{usedWorker ? 'Web Worker thread' : 'Main thread'}</span>
        </div>
      </div>

      {/* Primary Core 6-Category Ruled Strip */}
      <div className="pg-shadow-card grid grid-cols-2 divide-y divide-[var(--pg-border)] rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] sm:grid-cols-4 lg:grid-cols-7 lg:divide-x lg:divide-y-0">
        <div className="col-span-2 flex flex-col justify-between bg-[var(--pg-surface-secondary)]/50 p-4 sm:col-span-4 lg:col-span-1">
          <span className="font-display text-xs font-semibold text-[var(--pg-text-secondary)]">
            Sanitized active
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span
              data-testid="total-entities-count"
              className="font-display text-3xl font-bold tabular-nums tracking-tight text-[#173D30] dark:text-[#A3C1A5]"
            >
              {counts.total}
            </span>
            <span className="font-mono text-xs text-[var(--pg-text-muted)]">
              of {totalDetected}
            </span>
          </div>
        </div>

        {CORE_CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_META[category];
          const count = counts[category];

          return (
            <div key={category} className="flex flex-col justify-between p-4">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${meta.dotColorClass}`}
                />
                <span className="text-xs text-[var(--pg-text-secondary)]">{meta.label}</span>
              </div>
              <span
                data-testid={`count-${category}`}
                className="mt-2.5 font-display text-2xl font-semibold tabular-nums tracking-tight text-[var(--pg-text-primary)]"
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Extended Identity, Financial, Secret & Location Matches (shown cleanly whenever matched) */}
      {activeExtendedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeExtendedCategories.map((category) => {
            const meta = CATEGORY_META[category];
            return (
              <div
                key={category}
                data-testid={`count-${category}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 py-1.5 text-xs"
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${meta.dotColorClass}`}
                />
                <span className="text-[var(--pg-text-secondary)]">{meta.label}:</span>
                <span className="font-mono font-semibold tabular-nums text-[var(--pg-text-primary)]">
                  {counts[category]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
