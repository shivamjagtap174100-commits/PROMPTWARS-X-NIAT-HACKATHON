import { HardDrive, Lock, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { RedactionMode } from '../../types/privacy';
import { collectBrowserTelemetry, type BrowserTelemetrySnapshot } from '../../utils/telemetry';

interface PrivacyInspectorPanelProps {
  usedWorker: boolean;
  redactionMode: RedactionMode;
}

export function PrivacyInspectorPanel({
  usedWorker,
  redactionMode,
}: PrivacyInspectorPanelProps) {
  const [snapshot, setSnapshot] = useState<BrowserTelemetrySnapshot>(() =>
    collectBrowserTelemetry()
  );

  const refreshTelemetry = useCallback(() => {
    setSnapshot(collectBrowserTelemetry());
  }, []);

  useEffect(() => {
    refreshTelemetry();
  }, [usedWorker, redactionMode, refreshTelemetry]);

  return (
    <section
      aria-labelledby="privacy-inspector-heading"
      className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pg-border)] pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
            Privacy inspector
          </p>
          <h3
            id="privacy-inspector-heading"
            className="mt-0.5 font-display text-base font-semibold text-[var(--pg-text-primary)]"
          >
            Live browser runtime &amp; network verification
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="privacy-api-request-count"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#367A55]/30 bg-[#DDE6DA]/70 px-2.5 py-1 font-mono text-xs tabular-nums text-[#102D24] dark:border-[#A3C1A5]/30 dark:bg-[#233128] dark:text-[#DDE6DA]"
          >
            <Lock className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            {snapshot.apiRequestCount} external API / fetch calls
          </span>

          <button
            type="button"
            onClick={refreshTelemetry}
            aria-label="Refresh live privacy telemetry"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-mono text-xs text-[var(--pg-text-secondary)] transition-colors hover:border-[var(--pg-border-strong)] hover:text-[var(--pg-text-primary)]"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Inspect ({snapshot.checkedAt})
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4">
          <div className="flex items-center gap-2 font-display text-xs font-semibold text-[var(--pg-text-primary)]">
            <WifiOff
              className="h-4 w-4 text-[#173D30] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            Performance API audit
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
            Observed{' '}
            <span className="font-mono text-[var(--pg-text-primary)]">
              {snapshot.apiRequestCount}
            </span>{' '}
            XHR/fetch/beacon transfers.{' '}
            {snapshot.externalAssetOrigins.length > 0
              ? `Static stylesheet/font origins only: ${snapshot.externalAssetOrigins.join(', ')}.`
              : 'Zero external asset origins observed in this runtime.'}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4">
          <div className="flex items-center gap-2 font-display text-xs font-semibold text-[var(--pg-text-primary)]">
            <HardDrive
              className="h-4 w-4 text-[#173D30] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            Ephemeral document RAM
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
            Active engine:{' '}
            <span className="font-mono text-[var(--pg-text-primary)]">
              {usedWorker ? 'Web Worker RAM' : 'Browser JS RAM'}
            </span>
            . Local storage:{' '}
            <span className="font-mono text-[var(--pg-text-primary)]">
              {snapshot.persistedMetadataKeys} metadata/pref keys ({snapshot.sessionStorageKeys}{' '}
              sessionStorage)
            </span>
            .
          </p>
        </div>

        <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4">
          <div className="flex items-center gap-2 font-display text-xs font-semibold text-[var(--pg-text-primary)]">
            <Lock
              className="h-4 w-4 text-[#173D30] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            Persisted vs. volatile data
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
            {redactionMode === 'PSEUDONYM'
              ? 'Pseudonym counters (USER_01, PHONE_01...) stay in RAM only; preferences & non-PII metadata persist locally.'
              : 'Login session, theme, settings, and non-PII audit metadata persist in localStorage; raw text & PII never leave RAM.'}
          </p>
        </div>
      </div>
    </section>
  );
}
