import { Terminal, Trash2 } from 'lucide-react';
import type { ProcessingLogEntry } from '../../types/privacy';

interface ProcessingLogPanelProps {
  logs: ProcessingLogEntry[];
  onClearLogs: () => void;
}

export function ProcessingLogPanel({ logs, onClearLogs }: ProcessingLogPanelProps) {
  return (
    <section
      aria-labelledby="processing-log-heading"
      className="pg-dark-console pg-shadow-card flex flex-col rounded-[10px] border border-[#24543E] text-[#F1F1E9] dark:border-[#344239]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/12 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#A5AEA5]" strokeWidth={1.85} aria-hidden="true" />
          <div>
            <span className="font-display text-sm font-semibold text-[#F1F1E9]">
              System activity / Processing log
            </span>
            <h3 id="processing-log-heading" className="sr-only">
              System Activity and Processing Log
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearLogs}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/18 px-2.5 font-display text-xs font-medium text-[#A5AEA5] transition-colors hover:border-white/35 hover:text-white"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
          Clear log
        </button>
      </div>

      <div
        aria-live="polite"
        data-testid="processing-log-list"
        className="max-h-72 overflow-auto p-5 font-mono text-xs leading-6"
      >
        {logs.map((entry) => {
          const levelColor =
            entry.level === 'success'
              ? 'text-[#DDE6DA]'
              : entry.level === 'error'
                ? 'text-[#F1B7B2]'
                : entry.level === 'warning'
                  ? 'text-[#D6B879]'
                  : 'text-[#A5AEA5]';

          return (
            <div key={entry.id} className="flex items-start gap-2.5">
              <span className="shrink-0 tabular-nums text-[#829782]">[{entry.timestamp}]</span>
              <span className={levelColor}>{entry.message}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
