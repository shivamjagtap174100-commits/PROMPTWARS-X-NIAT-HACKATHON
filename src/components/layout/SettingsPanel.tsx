import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { SanitizationSettings, SensitivityLevel } from '../../types/privacy';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: SanitizationSettings;
  onUpdateSettings: (patch: Partial<SanitizationSettings>) => void;
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
    >
      <div className="pg-shadow-modal pg-enter w-full max-w-lg rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-6">
        <div className="flex items-start justify-between border-b border-[var(--pg-border)] pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
              Engine configuration
            </p>
            <h2
              id="settings-dialog-title"
              className="mt-1 font-display text-lg font-semibold text-[var(--pg-text-primary)]"
            >
              Local workspace settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings dialog"
            className="rounded-lg border border-[var(--pg-border)] p-1.5 text-[var(--pg-text-secondary)] transition-colors hover:text-[var(--pg-text-primary)]"
          >
            <X className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="sensitivity-select"
              className="block font-display text-sm font-medium text-[var(--pg-text-primary)]"
            >
              Detection sensitivity
            </label>
            <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">
              Strict mode adds column-header person NER and flags non-credential HTTP/HTTPS URLs
            </p>
            <select
              id="sensitivity-select"
              value={settings.sensitivity}
              onChange={(e) => onUpdateSettings({ sensitivity: e.target.value as SensitivityLevel })}
              className="mt-2 h-10 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-mono text-xs text-[var(--pg-text-primary)]"
            >
              <option value="BALANCED">Balanced (Recommended — low false positives)</option>
              <option value="STRICT">Strict (Column-aware Person NER + all URLs)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="debounce-select"
              className="block font-display text-sm font-medium text-[var(--pg-text-primary)]"
            >
              Typing debounce interval
            </label>
            <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">
              Balances instant feedback against CPU usage when editing large logs
            </p>
            <select
              id="debounce-select"
              value={settings.debounceMs}
              onChange={(e) => onUpdateSettings({ debounceMs: Number(e.target.value) })}
              className="mt-2 h-10 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-mono text-xs text-[var(--pg-text-primary)]"
            >
              <option value={0}>0 ms (Immediate)</option>
              <option value={140}>140 ms (Balanced default)</option>
              <option value={300}>300 ms (Large documents)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="worker-threshold-select"
              className="block font-display text-sm font-medium text-[var(--pg-text-primary)]"
            >
              Web Worker offload threshold
            </label>
            <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">
              Moves sanitization to a background thread above this character count
            </p>
            <select
              id="worker-threshold-select"
              value={settings.workerThresholdChars}
              onChange={(e) =>
                onUpdateSettings({ workerThresholdChars: Number(e.target.value) })
              }
              className="mt-2 h-10 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-mono text-xs text-[var(--pg-text-primary)]"
            >
              <option value={10000}>10,000 characters</option>
              <option value={25000}>25,000 characters (Default)</option>
              <option value={50000}>50,000 characters</option>
            </select>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-[var(--pg-border)] pt-4">
            <div>
              <label
                htmlFor="preserve-csv-header"
                className="block font-display text-sm font-medium text-[var(--pg-text-primary)]"
              >
                Preserve CSV header row
              </label>
              <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">
                Keeps row 1 column headers intact when sanitizing uploaded CSV tables
              </p>
            </div>
            <input
              id="preserve-csv-header"
              type="checkbox"
              checked={settings.preserveCsvHeader}
              onChange={(e) => onUpdateSettings({ preserveCsvHeader: e.target.checked })}
              className="mt-1 h-4 w-4 accent-[#173D30]"
            />
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-[var(--pg-border)] pt-4">
            <div>
              <label
                htmlFor="sync-diff-scroll"
                className="block font-display text-sm font-medium text-[var(--pg-text-primary)]"
              >
                Synchronize Before / After scroll
              </label>
              <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">
                Locks scroll offset between original and sanitized comparison panes
              </p>
            </div>
            <input
              id="sync-diff-scroll"
              type="checkbox"
              checked={settings.syncDiffScroll}
              onChange={(e) => onUpdateSettings({ syncDiffScroll: e.target.checked })}
              className="mt-1 h-4 w-4 accent-[#173D30]"
            />
          </div>

          <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 text-xs">
            <p className="font-display font-medium text-[var(--pg-text-primary)]">
              Keyboard shortcuts
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[var(--pg-text-secondary)]">
              <span>Ctrl/Cmd + K → Palette</span>
              <span>Alt + Shift + C → Copy</span>
              <span>Alt + 1 → Full Mask</span>
              <span>Alt + 2 → Partial Mask</span>
              <span>Alt + 3 → Pseudonyms</span>
              <span>Alt + 4 → Replace Label</span>
              <span>Alt + 5 → Remove</span>
              <span>Ctrl/Cmd + Shift + L → Demo</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-[var(--pg-border)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="pg-action-primary rounded-lg px-4 py-2 font-display text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
