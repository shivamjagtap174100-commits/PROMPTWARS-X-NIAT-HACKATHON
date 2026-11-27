import { Check, Copy, Download, Lock } from 'lucide-react';
import { useState } from 'react';
import type { ExportStatus, FileKind, RedactionMode } from '../../types/privacy';
import { REDACTION_MODE_META } from '../../utils/categoryTheme';
import { countWords } from '../../utils/format';

interface SanitizedOutputPaneProps {
  sanitizedText: string;
  fileKind: FileKind;
  redactionMode: RedactionMode;
  exportStatus: ExportStatus;
  hasError: boolean;
  onCopy: () => Promise<boolean>;
  onDownloadTxt: () => boolean;
  onDownloadCsv: () => boolean;
}

export function SanitizedOutputPane({
  sanitizedText,
  fileKind,
  redactionMode,
  exportStatus,
  hasError,
  onCopy,
  onDownloadTxt,
  onDownloadCsv,
}: SanitizedOutputPaneProps) {
  const [justCopied, setJustCopied] = useState(false);

  const charCount = sanitizedText.length;
  const wordCount = countWords(sanitizedText);
  const modeMeta = REDACTION_MODE_META[redactionMode];

  const handleCopyClick = async () => {
    const ok = await onCopy();
    if (ok) {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1800);
    }
  };

  return (
    <div className="pg-dark-console flex h-full flex-col text-[#F1F1E9]">
      {/* Swiss Column Header */}
      <div className="space-y-3 border-b border-white/12 px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-[#DDE6DA]">
                03 · Sanitized Output
              </span>
              <span className="font-mono text-[11px] text-[#D6B879]">· {modeMeta.title}</span>
            </div>
            <p className="mt-0.5 text-xs text-[#A5AEA5]">Verified local export stream</p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/6 px-2 py-1 font-mono text-[10px] text-[#DDE6DA]">
            <Lock className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Local only
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleCopyClick()}
            disabled={!sanitizedText || hasError}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/18 bg-white/8 px-2.5 font-display text-xs font-medium text-[#F1F1E9] transition-colors hover:bg-white/15 disabled:opacity-40"
          >
            {justCopied ? (
              <>
                <Check className="h-4 w-4 text-[#A3C1A5]" strokeWidth={1.85} aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#A5AEA5]" strokeWidth={1.85} aria-hidden="true" />
                Copy
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDownloadTxt}
            disabled={!sanitizedText || hasError}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-display text-xs font-semibold transition-colors disabled:opacity-40 ${fileKind === 'text'
              ? 'bg-[#FBFAF6] text-[#102D24] hover:bg-[#E5E8DF]'
              : 'border border-white/18 bg-white/8 text-[#F1F1E9] hover:bg-white/15'
              }`}
          >
            <Download className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Download TXT
          </button>

          <button
            type="button"
            onClick={onDownloadCsv}
            disabled={!sanitizedText || hasError}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-display text-xs font-semibold transition-colors disabled:opacity-40 ${fileKind === 'csv'
              ? 'bg-[#FBFAF6] text-[#102D24] hover:bg-[#E5E8DF]'
              : 'border border-white/18 bg-white/8 text-[#F1F1E9] hover:bg-white/15'
              }`}
          >
            <Download className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Output Textarea */}
      <div className="flex-1 p-3.5">
        <label htmlFor="sanitized-output-text" className="sr-only">
          Sanitized output document
        </label>
        <textarea
          id="sanitized-output-text"
          readOnly
          value={sanitizedText}
          rows={16}
          placeholder="Sanitized output updates automatically as soon as source text or a file is provided"
          className="h-[380px] w-full resize-y rounded-lg border border-white/12 bg-[#0C211A] p-3.5 font-mono text-xs leading-relaxed text-[#F1F1E9] placeholder-[#829782] focus:border-[#A3C1A5] dark:bg-[#0E1411]"
        />
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/12 px-4 py-2.5 font-mono text-[11px] tabular-nums text-[#A5AEA5]">
        <div className="flex items-center gap-2">
          <span>{charCount.toLocaleString()} chars</span>
          <span className="text-white/25">·</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-white/25">·</span>
          <span>{fileKind.toUpperCase()}</span>
        </div>

        <span aria-live="polite" className="text-[#DDE6DA]">
          Export: {exportStatus}
        </span>
      </div>
    </div>
  );
}
