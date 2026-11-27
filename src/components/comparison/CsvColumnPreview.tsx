import { CheckCircle2, Eye, EyeOff, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DetectionMatch } from '../../types/privacy';

interface CsvColumnPreviewProps {
  csvHeaders?: string[];
  csvRows?: string[][];
  sanitizedCsvRows?: string[][];
  hasCsvHeader?: boolean;
  matches: DetectionMatch[];
  excludedIds?: string[];
  onToggleCellMatches?: (matchIds: string[]) => void;
}

export function CsvColumnPreview({
  csvHeaders = [],
  csvRows = [],
  sanitizedCsvRows = [],
  hasCsvHeader = true,
  matches,
  excludedIds = [],
  onToggleCellMatches,
}: CsvColumnPreviewProps) {
  const [changedOnly, setChangedOnly] = useState(false);
  const excludedSet = useMemo(() => new Set(excludedIds), [excludedIds]);

  const dataRowStartIndex = hasCsvHeader ? 1 : 0;
  const bodyRows = csvRows.slice(dataRowStartIndex);
  const sanitizedBodyRows = sanitizedCsvRows.slice(dataRowStartIndex);

  const colCount = useMemo(() => {
    let maxCols = csvHeaders.length;
    for (const row of csvRows) {
      if (row.length > maxCols) maxCols = row.length;
    }
    return maxCols;
  }, [csvHeaders.length, csvRows]);

  const effectiveHeaders = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < colCount; i += 1) {
      out.push(csvHeaders[i] || `Column ${i + 1}`);
    }
    return out;
  }, [colCount, csvHeaders]);

  const perColumnMatchCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const match of matches) {
      if (match.columnIndex !== undefined) {
        counts.set(match.columnIndex, (counts.get(match.columnIndex) || 0) + 1);
      }
    }
    return counts;
  }, [matches]);

  const cellMatchIndex = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of matches) {
      if (m.rowIndex === undefined || m.columnIndex === undefined) continue;
      const key = `${m.rowIndex}:${m.columnIndex}`;
      const existing = map.get(key);
      if (existing) existing.push(m.id);
      else map.set(key, [m.id]);
    }
    return map;
  }, [matches]);

  const visibleRowIndices = useMemo(() => {
    const indices: number[] = [];
    for (let r = 0; r < bodyRows.length; r += 1) {
      if (!changedOnly) {
        indices.push(r);
        continue;
      }
      const orig = bodyRows[r] || [];
      const san = sanitizedBodyRows[r] || [];
      const absoluteRowIdx = r + dataRowStartIndex;
      const hasAnyMatch = effectiveHeaders.some((_, c) =>
        cellMatchIndex.has(`${absoluteRowIdx}:${c}`)
      );
      const rowChanged = orig.some((cell, c) => cell !== (san[c] ?? cell));
      if (rowChanged || hasAnyMatch) indices.push(r);
    }
    return indices;
  }, [bodyRows, sanitizedBodyRows, changedOnly, dataRowStartIndex, effectiveHeaders, cellMatchIndex]);

  if (csvRows.length === 0) return null;

  return (
    <section
      aria-labelledby="csv-column-preview-heading"
      className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pg-border)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Table2
            className="h-5 w-5 shrink-0 text-[#173D30] dark:text-[#A3C1A5]"
            strokeWidth={1.85}
            aria-hidden="true"
          />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
              Structured table inspection · click cell action to toggle redaction
            </p>
            <h3
              id="csv-column-preview-heading"
              className="font-display text-base font-semibold text-[var(--pg-text-primary)]"
            >
              CSV Column Preview ({effectiveHeaders.length} columns · {bodyRows.length} data rows)
            </h3>
          </div>
        </div>

        <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-display text-xs font-medium text-[var(--pg-text-primary)]">
          <input
            type="checkbox"
            checked={changedOnly}
            onChange={(e) => setChangedOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#173D30]"
          />
          PII rows only
        </label>
      </div>

      {/* Column Classification Summary Pills */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--pg-border)] bg-[var(--pg-bg)]/60 px-5 py-2.5">
        {effectiveHeaders.map((header, idx) => {
          const hitCount = perColumnMatchCounts.get(idx) || 0;
          return (
            <span
              key={`${header}-${idx}`}
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] ${
                hitCount > 0
                  ? 'border-[#367A55]/30 bg-[#DDE6DA]/70 text-[#102D24] dark:border-[#A3C1A5]/35 dark:bg-[#233128] dark:text-[#DDE6DA]'
                  : 'border-[var(--pg-border)] bg-[var(--pg-surface)] text-[var(--pg-text-secondary)]'
              }`}
            >
              <span>{header}</span>
              <span className="tabular-nums opacity-80">· {hitCount} PII</span>
            </span>
          );
        })}
      </div>

      {/* Cell Comparison Table */}
      <div className="max-h-80 overflow-auto">
        {visibleRowIndices.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-[var(--pg-text-secondary)]">
            No CSV cells with detected PII under current rule configuration.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--pg-text-secondary)]">
              <tr>
                <th className="w-14 px-4 py-2.5 font-medium">Row</th>
                {effectiveHeaders.map((header, colIdx) => (
                  <th key={`${header}-col-${colIdx}`} className="px-4 py-2.5 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pg-border)]">
              {visibleRowIndices.slice(0, 50).map((rowPos) => {
                const origRow = bodyRows[rowPos] || [];
                const sanRow = sanitizedBodyRows[rowPos] || [];
                const absoluteRowIdx = rowPos + dataRowStartIndex;
                const rowNumber = absoluteRowIdx + 1;
                return (
                  <tr key={`csv-row-${rowNumber}`} className="hover:bg-[var(--pg-bg)]/45">
                    <td className="px-4 py-2.5 align-top font-mono text-[11px] tabular-nums text-[var(--pg-text-muted)]">
                      #{rowNumber}
                    </td>
                    {effectiveHeaders.map((header, colIdx) => {
                      const origVal = origRow[colIdx] ?? '';
                      const sanVal = sanRow[colIdx] ?? origVal;
                      const changed = origVal !== sanVal;
                      const cellMatches = cellMatchIndex.get(`${absoluteRowIdx}:${colIdx}`) || [];
                      const allCellExcluded =
                        cellMatches.length > 0 && cellMatches.every((id) => excludedSet.has(id));

                      return (
                        <td key={`cell-${rowNumber}-${colIdx}`} className="px-4 py-2.5 align-top">
                          {changed ? (
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1 rounded border border-[#367A55]/30 bg-[#DDE6DA]/70 px-1.5 py-0.5 font-mono text-[11px] text-[#102D24] dark:border-[#A3C1A5]/35 dark:bg-[#233128] dark:text-[#DDE6DA]">
                                <CheckCircle2 className="h-3 w-3 shrink-0" strokeWidth={1.85} aria-hidden="true" />
                                <span>{sanVal || '[removed]'}</span>
                              </div>
                              <div className="font-mono text-[10px] text-[var(--pg-text-muted)] line-through">
                                {origVal}
                              </div>
                              {onToggleCellMatches && cellMatches.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onToggleCellMatches(cellMatches)}
                                  aria-label={`Exclude row ${rowNumber} ${header} cell`}
                                  className="inline-flex items-center gap-1 rounded border border-[var(--pg-border)] bg-[var(--pg-bg)] px-1.5 py-0.5 font-display text-[10px] font-medium text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]"
                                >
                                  <EyeOff className="h-3 w-3" strokeWidth={1.85} aria-hidden="true" />
                                  Exclude cell
                                </button>
                              )}
                            </div>
                          ) : allCellExcluded && onToggleCellMatches ? (
                            <div className="space-y-1">
                              <span className="font-mono text-[11px] text-[#B88735] dark:text-[#D6B879]">
                                {sanVal || '—'}
                              </span>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => onToggleCellMatches(cellMatches)}
                                  aria-label={`Redact row ${rowNumber} ${header} cell`}
                                  className="inline-flex items-center gap-1 rounded border border-[#173D30]/40 bg-[#DDE6DA]/50 px-1.5 py-0.5 font-display text-[10px] font-semibold text-[#102D24] dark:border-[#A3C1A5]/40 dark:bg-[#233128] dark:text-[#DDE6DA]"
                                >
                                  <Eye className="h-3 w-3" strokeWidth={1.85} aria-hidden="true" />
                                  Redact cell
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-[var(--pg-text-secondary)]">
                              {sanVal || '—'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
