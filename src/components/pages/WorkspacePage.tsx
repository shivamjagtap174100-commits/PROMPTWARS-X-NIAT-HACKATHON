import { ArrowRight, Database, FileUp, Lock, Play, ScanSearch } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import type { useSanitizationSession } from '../../hooks/useSanitizationSession';
import type { AppRoute, MobileWorkspaceTab } from '../../types/privacy';
import { SAMPLE_PRESETS } from '../../utils/sampleData';
import { ProcessingLogPanel } from '../activity/ProcessingLogPanel';
import { PrivacyAuditPanel } from '../analytics/PrivacyAuditPanel';
import { PrivacyInspectorPanel } from '../analytics/PrivacyInspectorPanel';
import { PseudonymMappingInspector } from '../analytics/PseudonymMappingInspector';
import { BeforeAfterDiff } from '../comparison/BeforeAfterDiff';
import { CsvColumnPreview } from '../comparison/CsvColumnPreview';
import { DetectionInsightsPane } from '../detection/DetectionInsightsPane';
import { DetectionOverview } from '../detection/DetectionOverview';
import { DetectionRuleExplorer } from '../detection/DetectionRuleExplorer';
import { SanitizedOutputPane } from '../editor/SanitizedOutputPane';
import { SourceEditorPane } from '../editor/SourceEditorPane';
import { RedactionModeSelector } from '../redaction/RedactionModeSelector';
import { BrandLockup } from '../shared/PrivacyBadge';
import { StatusBanner } from '../shared/StatusBanner';

interface WorkspacePageProps {
  sanitization: ReturnType<typeof useSanitizationSession>;
  onNavigate: (route: AppRoute) => void;
}

export function WorkspacePage({ sanitization, onNavigate }: WorkspacePageProps) {
  const [mobileTab, setMobileTab] = useState<MobileWorkspaceTab>('original');
  const [workbenchTab, setWorkbenchTab] = useState<'mappings' | 'rules'>('mappings');
  const toolbarFileInputRef = useRef<HTMLInputElement>(null);

  const handleToolbarFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void sanitization.handleFileUpload(file);
    }
    event.target.value = '';
  };

  const docStateLabel = sanitization.errorBanner
    ? 'Validation error'
    : sanitization.rawText
      ? 'Loaded'
      : 'Empty';

  return (
    <div className="pg-enter">
      {/* Studio Compact Toolbar */}
      <section className="border-b border-[var(--pg-border)] bg-[var(--pg-surface)] py-4">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3.5 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* LEFT: Document Name, File Type, Document Status */}
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="workspace-document-title" className="sr-only">
                Document name
              </label>
              <input
                id="workspace-document-title"
                type="text"
                value={sanitization.documentTitle}
                onChange={(e) => sanitization.setDocumentTitle(e.target.value)}
                aria-label="Document name"
                className="h-9 w-52 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-sm font-semibold text-[var(--pg-text-primary)] focus:border-[#173D30] sm:w-60 dark:focus:border-[#A3C1A5]"
              />
              <span className="rounded border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] px-2 py-1 font-mono text-[11px] font-medium uppercase text-[var(--pg-text-secondary)]">
                {sanitization.fileKind}
              </span>
              <span className="rounded border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2 py-1 font-mono text-[11px] text-[var(--pg-text-muted)]">
                {docStateLabel}
              </span>
            </div>

            {/* RIGHT: Upload, Load Sample, Scan, Processing Status, Privacy Indicator */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={toolbarFileInputRef}
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                onChange={handleToolbarFileSelect}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => toolbarFileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-medium text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
              >
                <FileUp
                  className="h-4 w-4 text-[var(--pg-text-secondary)]"
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
                Upload
              </button>

              <button
                type="button"
                onClick={sanitization.loadSampleData}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-medium text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
              >
                <Database
                  className="h-4 w-4 text-[#173D30] dark:text-[#A3C1A5]"
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
                Load Sample
              </button>

              <button
                type="button"
                onClick={sanitization.rescanNow}
                className="pg-action-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 font-display text-xs font-semibold"
              >
                <ScanSearch className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Scan
              </button>

              <span
                aria-live="polite"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-mono text-[11px] text-[var(--pg-text-secondary)]"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    sanitization.isProcessing
                      ? 'bg-[#B88735]'
                      : sanitization.errorBanner
                        ? 'bg-[#B64B43]'
                        : 'bg-[#367A55] dark:bg-[#A3C1A5]'
                  }`}
                />
                {sanitization.statusMessage}
              </span>

              <button
                type="button"
                onClick={() => onNavigate('/privacy-centre')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#367A55]/30 bg-[#DDE6DA]/60 px-3 font-mono text-[11px] font-medium text-[#102D24] transition-colors hover:bg-[#DDE6DA] dark:border-[#A3C1A5]/30 dark:bg-[#233128] dark:text-[#DDE6DA]"
              >
                <Lock className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Browser-local
              </button>
            </div>
          </div>

          {/* Sample Library Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pg-border)] pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--pg-text-muted)]">
                Samples:
              </span>
              {SAMPLE_PRESETS.map((preset) => {
                const active =
                  sanitization.activePresetId === preset.id && Boolean(sanitization.rawText);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.description}
                    onClick={() => sanitization.loadSamplePreset(preset.id)}
                    className={`h-8 rounded-lg border px-2.5 font-display text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#173D30] bg-[#DDE6DA] text-[#102D24] dark:border-[#A3C1A5] dark:bg-[#233128] dark:text-[#F1F1E9]'
                        : 'border-[var(--pg-border)] bg-[var(--pg-bg)] text-[var(--pg-text-secondary)] hover:border-[var(--pg-border-strong)] hover:text-[var(--pg-text-primary)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={sanitization.runDemoMode}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-semibold text-[#173D30] transition-colors hover:border-[#173D30] dark:text-[#A3C1A5] dark:hover:border-[#A3C1A5]"
            >
              <Play className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              <span>{sanitization.isDemoSession ? 'Demo active' : 'Run instant demo'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Three-Panel Document Studio (Desktop 3-col, Tablet 2-col adaptive, Mobile tabbed) */}
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <StatusBanner
          message={sanitization.errorBanner}
          onDismiss={() => sanitization.setErrorBanner(null)}
        />

        {/* Redaction Mode Segmented Selector */}
        <RedactionModeSelector
          mode={sanitization.redactionMode}
          onChange={sanitization.handleModeChange}
        />

        {/* Mobile Tab Switcher (Original / Review / Output) */}
        <div
          role="tablist"
          aria-label="Mobile workspace panes"
          className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] p-1 md:hidden"
        >
          {(
            [
              { id: 'original', label: 'Original' },
              { id: 'review', label: `Review (${sanitization.result.counts.total})` },
              { id: 'sanitized', label: 'Output' },
            ] as const
          ).map((tab) => {
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileTab(tab.id)}
                className={`h-9 rounded-md font-display text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#173D30] text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]'
                    : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Adaptive Studio Frame: md 2-col (Orig + Review, Output wide), xl 3-col */}
        <section
          id="workspace-sanitize"
          aria-label="Three-column sanitization studio"
          className="pg-shadow-card grid divide-y divide-[var(--pg-border)] overflow-hidden rounded-[10px] border border-[var(--pg-border)] md:grid-cols-2 md:divide-x xl:grid-cols-12 xl:divide-y-0"
        >
          <div
            className={`xl:col-span-4 md:block ${mobileTab === 'original' ? 'block' : 'hidden'}`}
          >
            <SourceEditorPane
              rawText={sanitization.rawText}
              originalSegments={sanitization.result.originalSegments}
              fileKind={sanitization.fileKind}
              fileMeta={sanitization.fileMeta}
              isProcessing={sanitization.isProcessing}
              statusMessage={sanitization.statusMessage}
              onTextChange={sanitization.handleTextChange}
              onFileUpload={(file) => void sanitization.handleFileUpload(file)}
              onLoadSample={sanitization.loadSampleData}
              onClear={sanitization.clearDocument}
            />
          </div>

          <div
            className={`xl:col-span-4 md:block ${mobileTab === 'review' ? 'block' : 'hidden'}`}
          >
            <DetectionInsightsPane
              matches={sanitization.result.matches}
              counts={sanitization.result.counts}
              excludedIds={sanitization.excludedIds}
              enabledCategories={sanitization.enabledCategories}
              isProcessing={sanitization.isProcessing}
              hasText={Boolean(sanitization.rawText)}
              onToggleCategory={sanitization.toggleCategory}
              onEnableAllCategories={sanitization.enableAllCategories}
              onToggleExclude={sanitization.toggleExcludeEntity}
            />
          </div>

          <div
            className={`md:col-span-2 md:block xl:col-span-4 ${
              mobileTab === 'sanitized' ? 'block' : 'hidden'
            }`}
          >
            <SanitizedOutputPane
              sanitizedText={sanitization.result.sanitizedText}
              fileKind={sanitization.fileKind}
              redactionMode={sanitization.redactionMode}
              exportStatus={sanitization.exportStatus}
              hasError={Boolean(sanitization.result.parseError)}
              onCopy={sanitization.handleCopySanitized}
              onDownloadTxt={sanitization.handleDownloadTxt}
              onDownloadCsv={sanitization.handleDownloadCsv}
            />
          </div>
        </section>

        {/* Entity Counts Ledger */}
        <DetectionOverview
          counts={sanitization.result.counts}
          excludedCount={sanitization.result.excludedCount}
          durationMs={sanitization.result.durationMs}
          usedWorker={sanitization.result.usedWorker}
        />

        {/* Automatic CSV Column Preview */}
        {sanitization.fileKind === 'csv' &&
          sanitization.result.csvRows &&
          sanitization.result.csvRows.length > 0 && (
            <CsvColumnPreview
              csvHeaders={sanitization.result.csvHeaders}
              csvRows={sanitization.result.csvRows}
              sanitizedCsvRows={sanitization.result.sanitizedCsvRows}
              hasCsvHeader={sanitization.result.hasCsvHeader}
              matches={sanitization.result.matches}
            />
          )}

        {/* Differentiating Tools Workbench */}
        <div className="space-y-4 border-t border-[var(--pg-border)] pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                Engineering Workbench
              </p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--pg-text-primary)]">
                Mapping inspector &amp; detection rule sandbox
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="Engineering workbench tools"
              className="inline-flex rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={workbenchTab === 'mappings'}
                onClick={() => setWorkbenchTab('mappings')}
                className={`rounded-md px-3 py-1.5 font-display text-xs font-semibold transition-colors ${
                  workbenchTab === 'mappings'
                    ? 'bg-[#173D30] text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]'
                    : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
                }`}
              >
                Mapping Inspector
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={workbenchTab === 'rules'}
                onClick={() => setWorkbenchTab('rules')}
                className={`rounded-md px-3 py-1.5 font-display text-xs font-semibold transition-colors ${
                  workbenchTab === 'rules'
                    ? 'bg-[#173D30] text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]'
                    : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
                }`}
              >
                Detection Rule Explorer
              </button>
            </div>
          </div>

          {workbenchTab === 'mappings' ? (
            <PseudonymMappingInspector
              matches={sanitization.result.matches}
              replacements={sanitization.result.replacements}
              redactionMode={sanitization.redactionMode}
            />
          ) : (
            <DetectionRuleExplorer
              enabledCategories={sanitization.enabledCategories}
              onToggleCategory={sanitization.toggleCategory}
            />
          )}
        </div>

        {/* Before / After Comparison */}
        <div id="comparison" className="border-t border-[var(--pg-border)] pt-8">
          <BeforeAfterDiff
            originalSegments={sanitization.result.originalSegments}
            sanitizedSegments={sanitization.result.sanitizedSegments}
            redactionMode={sanitization.redactionMode}
            syncScroll={sanitization.settings.syncDiffScroll}
            onToggleSyncScroll={(enabled) =>
              sanitization.updateSettings({ syncDiffScroll: enabled })
            }
          />
        </div>

        {/* Runtime Privacy Verification & Session Ledger */}
        <section
          id="activity"
          aria-labelledby="activity-section-heading"
          className="space-y-6 border-t border-[var(--pg-border)] pt-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                Verification &amp; logs
              </p>
              <h2
                id="activity-section-heading"
                className="mt-0.5 font-display text-xl font-semibold tracking-tight text-[var(--pg-text-primary)]"
              >
                Privacy inspector, audit ledger, and processing log
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-display text-xs font-semibold">
              <button
                type="button"
                onClick={() => onNavigate('/audit-trail')}
                className="inline-flex items-center gap-1 text-[#173D30] hover:underline dark:text-[#A3C1A5]"
              >
                Full audit timeline
                <ArrowRight className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/documents')}
                className="inline-flex items-center gap-1 text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)] hover:underline"
              >
                Document library
              </button>
            </div>
          </div>

          <PrivacyInspectorPanel
            usedWorker={sanitization.result.usedWorker}
            redactionMode={sanitization.redactionMode}
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <PrivacyAuditPanel
                entries={sanitization.auditEntries}
                onClearAudit={sanitization.clearAuditHistory}
              />
            </div>
            <div className="lg:col-span-5">
              <ProcessingLogPanel
                logs={sanitization.logs}
                onClearLogs={sanitization.clearLogs}
              />
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[var(--pg-border)] bg-[var(--pg-bg)] py-7">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup compact />
          <p className="font-mono text-xs text-[var(--pg-text-secondary)]">
            100% browser-local PII sanitization · Zero external data transmission
          </p>
        </div>
      </footer>
    </div>
  );
}
