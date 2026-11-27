import { Database, Eye, FileUp, Loader2, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { DiffSegment, FileKind, FileMetadata } from '../../types/privacy';
import { CATEGORY_META } from '../../utils/categoryTheme';
import { countWords, formatBytes } from '../../utils/format';

interface SourceEditorPaneProps {
  rawText: string;
  originalSegments: DiffSegment[];
  fileKind: FileKind;
  fileMeta: FileMetadata | null;
  isProcessing: boolean;
  statusMessage: string;
  onTextChange: (text: string) => void;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onClear: () => void;
}

export function SourceEditorPane({
  rawText,
  originalSegments,
  fileKind,
  fileMeta,
  isProcessing,
  statusMessage,
  onTextChange,
  onFileUpload,
  onLoadSample,
  onClear,
}: SourceEditorPaneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'highlight'>('edit');

  const charCount = rawText.length;
  const wordCount = countWords(rawText);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex h-full flex-col bg-[var(--pg-surface)] transition-colors ${
        isDragging ? 'bg-[var(--pg-soft-sage)]/35' : ''
      } text-[var(--pg-text-primary)]`}
    >
      {/* Swiss Column Header */}
      <div className="space-y-3 border-b border-[var(--pg-border)] px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
              01 · Original Document
            </span>
            <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">
              Paste raw text or drop <span className="font-mono">.txt</span> /{' '}
              <span className="font-mono">.csv</span>
            </p>
          </div>

          <div
            role="group"
            aria-label="Source view mode"
            className="inline-flex rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] p-0.5"
          >
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              aria-pressed={viewMode === 'edit'}
              className={`inline-flex h-7 items-center gap-1 rounded-md px-2 font-display text-[11px] font-semibold transition-colors ${
                viewMode === 'edit'
                  ? 'bg-[var(--pg-surface)] text-[var(--pg-text-primary)]'
                  : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
              }`}
            >
              <Pencil className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setViewMode('highlight')}
              aria-pressed={viewMode === 'highlight'}
              className={`inline-flex h-7 items-center gap-1 rounded-md px-2 font-display text-[11px] font-semibold transition-colors ${
                viewMode === 'highlight'
                  ? 'bg-[var(--pg-surface)] text-[var(--pg-text-primary)]'
                  : 'text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
              }`}
            >
              <Eye className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              Highlights
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onLoadSample}
            className="pg-action-primary inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-display text-xs font-semibold"
          >
            <Database className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Load sample data
          </button>

          <input
            ref={fileInputRef}
            id="privacyguard-file-upload"
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            onChange={handleFileSelect}
            className="sr-only"
            aria-label="Upload TXT or CSV file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 font-display text-xs font-medium text-[var(--pg-text-primary)] transition-colors hover:border-[var(--pg-border-strong)]"
          >
            <FileUp
              className="h-4 w-4 text-[var(--pg-text-secondary)]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            Upload TXT / CSV
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!rawText && !fileMeta}
            aria-label="Clear source input"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--pg-border)] bg-transparent px-2.5 font-display text-xs font-medium text-[var(--pg-text-secondary)] transition-colors hover:border-[#B64B43]/45 hover:text-[#B64B43] disabled:opacity-40 dark:hover:text-[#DF7B73]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      {/* Editor or Highlighted Source Surface */}
      <div className="relative flex-1 p-3.5">
        <label htmlFor="source-document-input" className="sr-only">
          Source document text for local PII detection
        </label>
        {viewMode === 'edit' ? (
          <textarea
            id="source-document-input"
            value={rawText}
            onChange={(e) => onTextChange(e.target.value)}
            rows={16}
            spellCheck={false}
            placeholder="Paste raw logs, tickets, clinical notes, or drop a .txt / .csv file here"
            className="h-[380px] w-full resize-y rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 font-mono text-xs leading-relaxed text-[var(--pg-text-primary)] placeholder-[var(--pg-text-muted)] transition-colors focus:border-[#173D30] dark:bg-[#141C17] dark:focus:border-[#A3C1A5]"
          />
        ) : (
          <div
            data-testid="source-highlight-preview"
            className="h-[380px] overflow-auto rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 font-mono text-xs leading-6 whitespace-pre-wrap break-words dark:bg-[#141C17]"
          >
            {originalSegments.length === 0 ? (
              <span className="text-[var(--pg-text-muted)]">
                Switch to Edit or load a sample to inspect inline source highlights
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
                    className={`rounded-xs px-1 py-0.5 font-medium ${
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
        )}

        {isDragging && (
          <div className="pointer-events-none absolute inset-3.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#173D30] bg-[var(--pg-soft-sage)]/95 text-[#102D24] dark:border-[#A3C1A5] dark:bg-[#1B241F]/95 dark:text-[#F1F1E9]">
            <UploadCloud className="h-6 w-6" strokeWidth={1.85} aria-hidden="true" />
            <p className="mt-2 font-display text-sm font-semibold">
              Drop .txt or .csv file to scan locally
            </p>
          </div>
        )}
      </div>

      {/* Metadata Status Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pg-border)] bg-[var(--pg-bg)]/60 px-4 py-2.5 font-mono text-[11px] tabular-nums text-[var(--pg-text-secondary)]">
        <div className="flex flex-wrap items-center gap-2">
          <span>{charCount.toLocaleString()} chars</span>
          <span className="text-[var(--pg-text-muted)]">·</span>
          <span>{wordCount.toLocaleString()} words</span>
          {fileMeta && (
            <>
              <span className="text-[var(--pg-text-muted)]">·</span>
              <span className="font-medium text-[#173D30] dark:text-[#A3C1A5]">
                {fileMeta.name} ({formatBytes(fileMeta.sizeBytes)} · {fileKind.toUpperCase()})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5" aria-live="polite">
          {isProcessing && (
            <Loader2
              className="h-4 w-4 animate-spin text-[#173D30] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
          )}
          <span>{statusMessage}</span>
        </div>
      </div>
    </div>
  );
}
