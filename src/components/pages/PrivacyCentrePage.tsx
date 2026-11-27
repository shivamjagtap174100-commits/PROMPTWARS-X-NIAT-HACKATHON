import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  HardDrive,
  Lock,
  ShieldCheck,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import type { useSanitizationSession } from '../../hooks/useSanitizationSession';
import type { AppRoute } from '../../types/privacy';
import { collectBrowserTelemetry } from '../../utils/telemetry';
import { PrivacyInspectorPanel } from '../analytics/PrivacyInspectorPanel';
import { BrandLockup } from '../shared/PrivacyBadge';

interface PrivacyCentrePageProps {
  sanitization: ReturnType<typeof useSanitizationSession>;
  onNavigate: (route: AppRoute) => void;
}

const ARCHITECTURE_PILLARS = [
  {
    number: '01',
    title: 'How browser-local processing works',
    body: 'All parsing, regular-expression matching, Luhn/IP validation, and redaction passes execute inside your local JavaScript engine. Inputs exceeding the configured threshold (25,000 chars by default) automatically run inside an isolated Web Worker.',
  },
  {
    number: '02',
    title: 'Session lifecycle & persistent local metadata',
    body: 'Active non-password login state, theme, sidebar layout, preferences, and non-PII audit/document metadata persist in localStorage across browser reloads. Raw document text, file bytes, and pseudonym maps remain strictly in volatile RAM until reset.',
  },
  {
    number: '03',
    title: 'File handling & sanitization guarantee',
    body: 'Files are read locally via the browser File API, validated for binary null bytes or unsupported extensions before scanning, processed cell-by-cell when CSV, and exported locally using in-memory Blob URLs.',
  },
  {
    number: '04',
    title: 'External network communication disclosure',
    body: 'Zero API calls, telemetry beacons, Google Cloud, or AI inference endpoints are invoked by PrivacyGuard. When accessed online, your browser may request static font CSS files (Manrope, Inter, IBM Plex Mono) from Google Fonts without carrying any document data.',
  },
  {
    number: '05',
    title: 'What metadata is retained vs. persisted',
    body: 'Session audit logs, document metadata summaries, settings, theme, and non-password login session are stored in browser localStorage cleanly across reloads — explicitly stripped of raw text and PII values.',
  },
  {
    number: '06',
    title: 'What is never transmitted or stored',
    body: 'Raw document text, uploaded file bytes, extracted PII values, user exclusions, plaintext passcodes, and original-to-pseudonym mapping dictionaries never touch localStorage, external networks, or console logs.',
  },
];

const DATA_FLOW_NODES = [
  {
    id: 'user-input',
    title: 'USER INPUT',
    detail: 'Inline textarea or local .txt / .csv File API read (zero server upload)',
    module: 'src/components/editor/SourceEditorPane.tsx · src/engine/parsing/fileValidation.ts',
    guarantee: 'Binary null-byte streams and unsupported extensions rejected strictly before scanning.',
  },
  {
    id: 'browser-processing',
    title: 'BROWSER PROCESSING',
    detail: 'Volatile React memory or isolated Web Worker thread offload',
    module: 'src/workers/workerClient.ts · src/workers/sanitization.worker.ts',
    guarantee: 'Documents >= configurable threshold offload smoothly without network requests.',
  },
  {
    id: 'pii-detection',
    title: 'PII DETECTION',
    detail: 'Email, Phone, IPv4/IPv6, PAN, Aadhaar format & ISO/IEC 7812 Luhn validation',
    module: 'src/engine/detectors/detectAll.ts · src/engine/validators/*',
    guarantee: 'Deterministic boundary checks ignore timestamps, random IDs, and failed checksums.',
  },
  {
    id: 'redaction-engine',
    title: 'REDACTION ENGINE',
    detail: 'Full Mask, Partial Mask, or Consistent Pseudonymization with exclusions',
    module: 'src/engine/redaction/redactDocument.ts · pseudonymManager.ts',
    guarantee: 'Pseudonym dictionaries stay in single-run RAM and never enter audit logs.',
  },
  {
    id: 'sanitized-output',
    title: 'SANITIZED OUTPUT',
    detail: 'Safe React text nodes & escaped RFC 4180 CSV serialization',
    module: 'src/engine/comparison/diffSegments.ts · src/engine/parsing/csvParser.ts',
    guarantee: 'Zero dangerouslySetInnerHTML injection vectors; original commas & headers preserved.',
  },
  {
    id: 'local-export',
    title: 'LOCAL EXPORT',
    detail: 'In-browser Blob download (.txt / .csv) or local Clipboard API copy',
    module: 'src/utils/download.ts · Browser Blob & Clipboard APIs',
    guarantee: 'Export payloads never include redacted source values unless explicitly excluded.',
  },
];

export function PrivacyCentrePage({ sanitization, onNavigate }: PrivacyCentrePageProps) {
  const telemetry = collectBrowserTelemetry();
  const [selectedStageId, setSelectedStageId] = useState<string>(DATA_FLOW_NODES[0].id);

  const selectedNode =
    DATA_FLOW_NODES.find((node) => node.id === selectedStageId) || DATA_FLOW_NODES[0];

  return (
    <div className="pg-enter">
      <div className="mx-auto max-w-[1440px] space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--pg-border)] pb-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#173D30] dark:text-[#A3C1A5]">
              Privacy Centre · Architecture &amp; Session Lifecycle
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-[var(--pg-text-primary)]">
              Local execution &amp; zero-transmission architecture
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--pg-text-secondary)]">
              Inspect verified client-side memory boundaries, honest Performance API network
              telemetry, session lifecycle controls, and the six local pipeline stages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={sanitization.clearAllSessionData}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-4 font-display text-xs font-semibold text-[#B64B43] transition-colors hover:border-[#B64B43]/50 dark:text-[#DF7B73]"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              Clear Session Data
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/workspace')}
              className="pg-action-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 font-display text-xs font-semibold"
            >
              <span>Return to Workspace</span>
              <ArrowRight className="h-5 w-5" strokeWidth={1.85} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Verifiable Runtime Summary Bar */}
        <div className="grid divide-y divide-[var(--pg-border)] rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-start gap-3.5 p-5">
            <WifiOff
              className="mt-0.5 h-6 w-6 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <div>
              <p className="font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                {telemetry.apiRequestCount} external API / fetch calls
              </p>
              <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
                Verified via browser <code className="text-[11px]">PerformanceResourceTiming</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5">
            <HardDrive
              className="mt-0.5 h-6 w-6 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <div>
              <p className="font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                {telemetry.persistedMetadataKeys} metadata &amp; preference keys
              </p>
              <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
                Stores login session, settings &amp; non-PII audit metadata — zero raw text/PII.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5">
            <ShieldCheck
              className="mt-0.5 h-6 w-6 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <div>
              <p className="font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                Zero HTML injection vectors
              </p>
              <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
                All highlighted tokens render exclusively via escaped React text nodes.
              </p>
            </div>
          </div>
        </div>

        {/* 12-Col Architectural Explanation + Interactive Data-Flow Diagram */}
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {ARCHITECTURE_PILLARS.map((item) => (
              <div
                key={item.number}
                className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-5"
              >
                <span className="font-mono text-[11px] font-medium text-[#173D30] dark:text-[#A3C1A5]">
                  {item.number}
                </span>
                <h2 className="mt-1 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Data-Flow Architecture Viewer */}
          <aside
            aria-label="Client-side processing data-flow diagram"
            className="pg-shadow-card flex flex-col justify-between rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-6 lg:col-span-5"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[var(--pg-border)] pb-3.5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                    Interactive Privacy Architecture Viewer
                  </p>
                  <h2 className="mt-0.5 font-display text-base font-semibold text-[var(--pg-text-primary)]">
                    Local data-flow boundary
                  </h2>
                </div>
                <Lock
                  className="h-4 w-4 text-[#367A55] dark:text-[#A3C1A5]"
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-5 flex flex-col items-center">
                {DATA_FLOW_NODES.map((node, index) => {
                  const selected = node.id === selectedStageId;
                  return (
                    <div key={node.id} className="flex w-full flex-col items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedStageId(node.id)}
                        aria-current={selected ? 'step' : undefined}
                        className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                          selected
                            ? 'border-[#173D30] bg-[#DDE6DA]/55 dark:border-[#A3C1A5] dark:bg-[#233128]'
                            : 'border-[var(--pg-border)] bg-[var(--pg-bg)] hover:border-[var(--pg-border-strong)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-xs font-bold tracking-[0.06em] text-[#173D30] dark:text-[#A3C1A5]">
                            {node.title}
                          </span>
                          <CheckCircle2
                            className="h-4 w-4 text-[#367A55] dark:text-[#A3C1A5]"
                            strokeWidth={1.85}
                            aria-hidden="true"
                          />
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-[var(--pg-text-secondary)]">
                          {node.detail}
                        </p>
                      </button>

                      {index < DATA_FLOW_NODES.length - 1 && (
                        <div
                          aria-hidden="true"
                          className="flex h-5 items-center justify-center text-[#829782]"
                        >
                          <ArrowDown className="h-4 w-4" strokeWidth={1.85} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              data-testid="privacy-stage-detail"
              className="mt-5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 text-xs"
            >
              <p className="font-display text-xs font-semibold text-[var(--pg-text-primary)]">
                Inspected Boundary: {selectedNode.title}
              </p>
              <p className="mt-1 font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">
                {selectedNode.module}
              </p>
              <p className="mt-1.5 text-[var(--pg-text-secondary)]">{selectedNode.guarantee}</p>
            </div>
          </aside>
        </div>

        {/* Live Telemetry Inspector */}
        <PrivacyInspectorPanel
          usedWorker={sanitization.result.usedWorker}
          redactionMode={sanitization.redactionMode}
        />
      </div>

      <footer className="border-t border-[var(--pg-border)] py-7">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup compact />
          <p className="font-mono text-xs text-[var(--pg-text-secondary)]">
            Privacy Centre · Transparent browser-local verification
          </p>
        </div>
      </footer>
    </div>
  );
}
