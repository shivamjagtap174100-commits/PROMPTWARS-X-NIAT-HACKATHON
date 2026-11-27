import type { RedactionMode } from '../../types/privacy';
import { REDACTION_MODE_META } from '../../utils/categoryTheme';

interface RedactionModeSelectorProps {
  mode: RedactionMode;
  onChange: (mode: RedactionMode) => void;
}

const MODES: RedactionMode[] = [
  'FULL_MASK',
  'PARTIAL_MASK',
  'REPLACE',
  'REMOVE',
  'PSEUDONYM',
];

export function RedactionModeSelector({ mode, onChange }: RedactionModeSelectorProps) {
  const activeMeta = REDACTION_MODE_META[mode];

  return (
    <div className="pg-shadow-card flex flex-col gap-3 rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] px-4 py-3.5 xl:flex-row xl:items-center xl:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.07em] text-[var(--pg-text-primary)]">
            Redaction Strategy
          </span>
          <span className="font-mono text-[11px] text-[var(--pg-text-muted)]">
            · {activeMeta.code}
          </span>
        </div>
        <p className="text-xs text-[var(--pg-text-secondary)]">
          {activeMeta.subtitle} —{' '}
          <code className="rounded bg-[var(--pg-surface-secondary)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--pg-text-primary)]">
            {activeMeta.example}
          </code>
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Redaction Mode"
        className="inline-grid grid-cols-2 gap-1 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] p-1 sm:grid-cols-3 lg:grid-cols-5"
      >
        {MODES.map((item) => {
          const meta = REDACTION_MODE_META[item];
          const selected = mode === item;

          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(item)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 font-display text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition-[color,background-color] ${
                selected
                  ? 'bg-[#173D30] text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]'
                  : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  selected
                    ? 'bg-[#D6B879] dark:bg-[#111713]'
                    : 'bg-[var(--pg-text-muted)]/50'
                }`}
              />
              <span>{meta.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
