import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  Files,
  FileUp,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { useSanitizationSession } from '../../hooks/useSanitizationSession';
import type { AppRoute, FileKind, RedactionMode } from '../../types/privacy';
import { REDACTION_MODE_META } from '../../utils/categoryTheme';
import { formatBytes } from '../../utils/format';
import { BrandLockup } from '../shared/PrivacyBadge';

interface DocumentsPageProps {
  sanitization: ReturnType<typeof useSanitizationSession>;
  onNavigate: (route: AppRoute) => void;
}

export function DocumentsPage({ sanitization, onNavigate }: DocumentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | RedactionMode>('ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | FileKind>('ALL');
  const batchInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sanitization.sessionDocuments.filter((doc) => {
      if (modeFilter !== 'ALL' && doc.redactionMode !== modeFilter) return false;
      if (formatFilter !== 'ALL' && doc.fileKind !== formatFilter) return false;
      if (!q) return true;
      const docName = doc.documentName.toLowerCase();
      const modeName = REDACTION_MODE_META[doc.redactionMode].title.toLowerCase();
      const exportName = doc.exportStatus.toLowerCase();
      return docName.includes(q) || modeName.includes(q) || exportName.includes(q);
    });
  }, [sanitization.sessionDocuments, searchQuery, modeFilter, formatFilter]);

  const handleBatchFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      void sanitization.runBatchUpload(event.target.files);
    }
    event.target.value = '';
  };

  const handleOpenDocument = (docId: string) => {
    if (sanitization.openSessionDocument(docId)) {
      onNavigate('/workspace');
    }
  };

  const report = sanitization.latestReport;

  return (
    <div className="pg-enter">
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Editorial Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--pg-border)] pb-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#173D30] dark:text-[#A3C1A5]">
              Documents &amp; Reports · Session Library &amp; Batch Queue
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-[var(--pg-text-primary)]">
              Document library &amp; compliance reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--pg-text-secondary)]">
              Manage active session documents held in browser RAM only and export privacy-safe
              sanitization compliance reports containing zero original PII values.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/workspace')}
              className="pg-action-primary inline-flex h-10 items-center rounded-lg px-4 font-display text-xs font-semibold"
            >
              Open Workspace
            </button>
            <button
              type="button"
              onClick={sanitization.clearAllSessionData}
              disabled={
                sanitization.sessionDocuments.length === 0 &&
                sanitization.auditEntries.length === 0 &&
                !sanitization.rawText
              }
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3.5 font-display text-xs font-medium text-[var(--pg-text-secondary)] transition-colors hover:border-[#B64B43]/45 hover:text-[#B64B43] disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              Clear all session data
            </button>
          </div>
        </div>

        {/* Sanitization Report Generator (Part 10) */}
        <section
          aria-labelledby="sanitization-report-heading"
          className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--pg-border)] pb-4">
            <div className="flex items-center gap-2.5">
              <FileCheck2
                className="h-5 w-5 shrink-0 text-[#173D30] dark:text-[#A3C1A5]"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                  Local Report Generator · Zero Sensitive Values Included
                </p>
                <h2
                  id="sanitization-report-heading"
                  className="font-display text-base font-semibold text-[var(--pg-text-primary)]"
                >
                  Sanitization compliance report
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => sanitization.downloadReport('md')}
                disabled={!report}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[#173D30] disabled:opacity-40"
              >
                <Download className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Download Report (.md)
              </button>
              <button
                type="button"
                onClick={() => sanitization.downloadReport('json')}
                disabled={!report}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[#173D30] disabled:opacity-40"
              >
                <Download className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Download Report (.json)
              </button>
            </div>
          </div>

          {!report ? (
            <p className="mt-4 text-xs text-[var(--pg-text-secondary)]">
              Load or scan a document in Workspace to preview and download a verifiable compliance
              summary report.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 text-xs">
                <span className="font-mono text-[10px] uppercase text-[var(--pg-text-muted)]">
                  Document / File
                </span>
                <p className="mt-1 truncate font-display font-semibold text-[var(--pg-text-primary)]">
                  {report.fileName} ({report.fileKind.toUpperCase()})
                </p>
              </div>
              <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 text-xs">
                <span className="font-mono text-[10px] uppercase text-[var(--pg-text-muted)]">
                  Sanitized / Remaining
                </span>
                <p className="mt-1 font-mono font-semibold tabular-nums text-[var(--pg-text-primary)]">
                  {report.sanitizedEntityCount} sanitized · {report.remainingSensitiveCount} remaining
                </p>
              </div>
              <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 text-xs">
                <span className="font-mono text-[10px] uppercase text-[var(--pg-text-muted)]">
                  Risk reduction
                </span>
                <p className="mt-1 font-mono font-semibold tabular-nums text-[#367A55] dark:text-[#A3C1A5]">
                  {report.riskScoreBefore}/100 → {report.riskScoreAfter}/100
                </p>
              </div>
              <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 text-xs">
                <span className="font-mono text-[10px] uppercase text-[var(--pg-text-muted)]">
                  Execution mode
                </span>
                <p className="mt-1 font-mono font-semibold text-[var(--pg-text-primary)]">
                  {report.processingMode}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Sequential Local Batch Sanitizer */}
        <section
          aria-labelledby="batch-sanitizer-heading"
          className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pg-border)] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <FileUp
                className="h-5 w-5 shrink-0 text-[#173D30] dark:text-[#A3C1A5]"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                  Sequential Client-Side Queue · Mode:{' '}
                  {REDACTION_MODE_META[sanitization.redactionMode].title}
                </p>
                <h2
                  id="batch-sanitizer-heading"
                  className="font-display text-base font-semibold text-[var(--pg-text-primary)]"
                >
                  Local Batch Sanitizer (.txt / .csv)
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={batchInputRef}
                id="batch-file-upload"
                type="file"
                multiple
                accept=".txt,.csv,text/plain,text/csv"
                onChange={handleBatchFiles}
                aria-label="Upload multiple TXT or CSV files for batch sanitization"
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => batchInputRef.current?.click()}
                disabled={sanitization.isBatchProcessing}
                className="pg-action-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 font-display text-xs font-semibold disabled:opacity-50"
              >
                {sanitization.isBatchProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.85} aria-hidden="true" />
                    Processing queue...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                    Select Multiple Files
                  </>
                )}
              </button>

              {sanitization.batchResults.length > 0 && (
                <button
                  type="button"
                  onClick={sanitization.clearBatchResults}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-medium text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]"
                >
                  Clear queue
                </button>
              )}
            </div>
          </div>

          {sanitization.batchResults.length > 0 && (
            <div className="divide-y divide-[var(--pg-border)]">
              {sanitization.batchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {item.status === 'completed' ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
                        strokeWidth={1.85}
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertCircle
                        className="h-4 w-4 shrink-0 text-[#B64B43]"
                        strokeWidth={1.85}
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <div className="font-medium text-[var(--pg-text-primary)]">
                        {item.fileName}{' '}
                        <span className="font-mono text-[11px] text-[var(--pg-text-muted)]">
                          ({formatBytes(item.sizeBytes)} · {item.fileKind.toUpperCase()})
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-[var(--pg-text-secondary)]">
                        {item.status === 'completed'
                          ? `${item.entityCount} entities sanitized cleanly in ${item.durationMs}ms`
                          : item.errorMessage}
                      </div>
                    </div>
                  </div>

                  {item.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => sanitization.downloadBatchResult(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 font-display text-xs font-semibold text-[var(--pg-text-primary)] transition-colors hover:border-[#173D30]"
                    >
                      <Download className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                      Download sanitized {item.fileKind.toUpperCase()}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Session Memory Disclosure Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-4 py-3 text-xs text-[var(--pg-text-secondary)]">
          <div className="flex items-center gap-2">
            <Lock
              className="h-4 w-4 shrink-0 text-[#367A55] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <span>
              Session-only RAM library — raw file contents never persist across browser reloads.
            </span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-[var(--pg-text-primary)]">
            {sanitization.sessionDocuments.length} session documents
          </span>
        </div>

        {/* Search & File-Type Filtering Controls */}
        <div className="flex flex-col gap-3 rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pg-text-muted)]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <label htmlFor="documents-search" className="sr-only">
              Search document sessions
            </label>
            <input
              id="documents-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document name, mode, or export..."
              className="h-9 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] pl-9 pr-3 text-xs text-[var(--pg-text-primary)] placeholder-[var(--pg-text-muted)] focus:border-[#173D30] dark:focus:border-[#A3C1A5]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="documents-mode-filter" className="sr-only">
              Filter by redaction mode
            </label>
            <select
              id="documents-mode-filter"
              aria-label="Filter by redaction mode"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as 'ALL' | RedactionMode)}
              className="h-9 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-medium text-[var(--pg-text-primary)]"
            >
              <option value="ALL">All modes</option>
              <option value="FULL_MASK">Full Mask</option>
              <option value="PARTIAL_MASK">Partial Mask</option>
              <option value="REPLACE">Replace Label</option>
              <option value="REMOVE">Remove</option>
              <option value="PSEUDONYM">Consistent Pseudonymization</option>
            </select>

            <label htmlFor="documents-format-filter" className="sr-only">
              Filter by file type
            </label>
            <select
              id="documents-format-filter"
              aria-label="Filter by file type"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as 'ALL' | FileKind)}
              className="h-9 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-medium text-[var(--pg-text-primary)]"
            >
              <option value="ALL">All file types</option>
              <option value="text">TXT / Plain text</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>

        {/* Document Session Library Table or Empty State */}
        {filteredDocs.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[var(--pg-border)] bg-[var(--pg-surface)] px-6 py-16 text-center">
            <Files
              className="mx-auto h-6 w-6 text-[var(--pg-text-muted)]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <h2 className="mt-3 font-display text-base font-semibold text-[var(--pg-text-primary)]">
              {sanitization.sessionDocuments.length === 0
                ? 'No session documents in memory'
                : 'No matching document sessions'}
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[var(--pg-text-secondary)]">
              {sanitization.sessionDocuments.length === 0
                ? 'Scan text or upload a .txt / .csv file in Workspace or via the Batch Sanitizer above to manage active session documents.'
                : 'Adjust your search query or clear file-type filters.'}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {sanitization.sessionDocuments.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onNavigate('/workspace')}
                  className="pg-action-primary rounded-lg px-4 py-2 font-display text-xs font-semibold"
                >
                  Open Workspace
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setModeFilter('ALL');
                    setFormatFilter('ALL');
                  }}
                  className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-4 py-2 font-display text-xs font-semibold text-[var(--pg-text-primary)]"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="pg-shadow-card overflow-x-auto rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--pg-text-secondary)]">
                <tr>
                  <th className="px-5 py-3 font-medium">Document name</th>
                  <th className="px-5 py-3 font-medium">File type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last processed</th>
                  <th className="px-5 py-3 font-medium">Detections</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pg-border)]">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--pg-bg)]/50">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[var(--pg-text-primary)]">
                        {doc.documentName}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[var(--pg-text-muted)]">
                        {REDACTION_MODE_META[doc.redactionMode].title} · {doc.exportStatus}
                        {doc.fileSizeBytes !== undefined ? ` · ${formatBytes(doc.fileSizeBytes)}` : ''}
                        {doc.riskScore !== undefined ? ` · Risk ${doc.riskScore}/100` : ''}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2 py-0.5 font-mono text-[11px] uppercase text-[var(--pg-text-primary)]">
                        {doc.fileKind}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded border border-[#367A55]/30 bg-[#DDE6DA]/70 px-2 py-0.5 font-mono text-[11px] text-[#102D24] dark:border-[#A3C1A5]/35 dark:bg-[#233128] dark:text-[#DDE6DA]">
                        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
                        {doc.processingStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-[var(--pg-text-secondary)]">
                      {doc.lastProcessedAt}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold tabular-nums text-[var(--pg-text-primary)]">
                      {doc.detectionCount} PII
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDocument(doc.id)}
                          disabled={!doc.rawContent}
                          title={
                            doc.rawContent
                              ? `Load ${doc.documentName} into Workspace`
                              : 'Metadata restored across reload — raw document contents are never persisted to storage'
                          }
                          aria-label={`Open ${doc.documentName}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 font-display text-[11px] font-semibold text-[var(--pg-text-primary)] hover:border-[#173D30] disabled:opacity-40"
                        >
                          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => sanitization.downloadSessionDocument(doc.id)}
                          disabled={!doc.sanitizedText}
                          aria-label={`Download sanitized ${doc.documentName}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 font-display text-[11px] font-semibold text-[var(--pg-text-primary)] hover:border-[#173D30] disabled:opacity-40"
                        >
                          <Download className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => sanitization.deleteSessionDocument(doc.id)}
                          aria-label={`Delete ${doc.documentName}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--pg-border)] text-[var(--pg-text-secondary)] hover:border-[#B64B43]/50 hover:text-[#B64B43]"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="mt-12 border-t border-[var(--pg-border)] py-7">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup compact />
          <p className="font-mono text-xs text-[var(--pg-text-secondary)]">
            Active browser RAM library · Metadata preserved cleanly without raw text
          </p>
        </div>
      </footer>
    </div>
  );
}
