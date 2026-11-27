import type {
  CategoryCounts,
  DetectionMatch,
  DiffSegment,
  EnabledCategoriesMap,
  FileKind,
  RedactedReplacement,
  RedactionMode,
  SanitizationResult,
} from '../types/privacy';
import { buildDiffSegments } from './comparison/diffSegments';
import { DEFAULT_ENABLED_CATEGORIES, detectAllEntities } from './detectors/detectAll';
import { escapeCsvField, parseCsv, serializeCsv } from './parsing/csvParser';
import { validateTextContent } from './parsing/fileValidation';
import { PseudonymizationManager } from './redaction/pseudonymManager';
import { redactTextWithMatches } from './redaction/redactDocument';

function createEmptyCounts(): CategoryCounts {
  return {
    total: 0,
    EMAIL: 0,
    PHONE: 0,
    IP: 0,
    PAN: 0,
    AADHAAR: 0,
    CREDIT_CARD: 0,
  };
}

function countActiveMatches(
  matches: DetectionMatch[],
  excludedIds: Set<string>
): { counts: CategoryCounts; excludedCount: number } {
  const counts = createEmptyCounts();
  let excludedCount = 0;

  for (const match of matches) {
    if (excludedIds.has(match.id)) {
      excludedCount += 1;
      continue;
    }
    counts[match.category] += 1;
    counts.total += 1;
  }

  return { counts, excludedCount };
}

export function processTextDocument(
  inputText: string,
  mode: RedactionMode,
  excludedIdsList: string[] = [],
  usedWorker = false,
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES
): SanitizationResult {
  const startedAt = performance.now();
  const validationError = validateTextContent(inputText);
  if (validationError) {
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: createEmptyCounts(),
      excludedCount: 0,
      durationMs: Math.max(0.1, Number((performance.now() - startedAt).toFixed(2))),
      usedWorker,
      fileKind: 'text',
      parseError: validationError,
    };
  }

  const excludedSet = new Set(excludedIdsList);
  const pseudonymManager = new PseudonymizationManager();

  const matches = detectAllEntities(inputText, 'txt', enabledCategories);
  const { sanitizedText, replacements } = redactTextWithMatches(
    inputText,
    matches,
    mode,
    excludedSet,
    pseudonymManager
  );

  const { originalSegments, sanitizedSegments } = buildDiffSegments(
    inputText,
    sanitizedText,
    matches,
    replacements
  );

  const { counts, excludedCount } = countActiveMatches(matches, excludedSet);
  const durationMs = Math.max(0.1, Number((performance.now() - startedAt).toFixed(2)));

  return {
    sanitizedText,
    matches,
    replacements,
    originalSegments,
    sanitizedSegments,
    counts,
    excludedCount,
    durationMs,
    usedWorker,
    fileKind: 'text',
  };
}

export function processCsvDocument(
  inputText: string,
  mode: RedactionMode,
  excludedIdsList: string[] = [],
  preserveCsvHeader = true,
  usedWorker = false,
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES
): SanitizationResult {
  const startedAt = performance.now();
  const validationError = validateTextContent(inputText);
  if (validationError) {
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: createEmptyCounts(),
      excludedCount: 0,
      durationMs: Math.max(0.1, Number((performance.now() - startedAt).toFixed(2))),
      usedWorker,
      fileKind: 'csv',
      parseError: validationError,
    };
  }

  const parsed = parseCsv(inputText);
  if (parsed.error) {
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: createEmptyCounts(),
      excludedCount: 0,
      durationMs: Math.max(0.1, Number((performance.now() - startedAt).toFixed(2))),
      usedWorker,
      fileKind: 'csv',
      parseError: parsed.error,
    };
  }

  if (parsed.rows.length === 0) {
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: createEmptyCounts(),
      excludedCount: 0,
      durationMs: Math.max(0.1, Number((performance.now() - startedAt).toFixed(2))),
      usedWorker,
      fileKind: 'csv',
      csvHeaders: [],
      csvRows: [],
      sanitizedCsvRows: [],
      hasCsvHeader: preserveCsvHeader,
    };
  }

  const excludedSet = new Set(excludedIdsList);
  const pseudonymManager = new PseudonymizationManager();

  const headers = preserveCsvHeader ? parsed.rows[0] : [];
  const sanitizedRows: string[][] = [];
  const allMatches: DetectionMatch[] = [];
  const allReplacements: RedactedReplacement[] = [];
  const originalSegments: DiffSegment[] = [];
  const sanitizedSegments: DiffSegment[] = [];

  for (let rowIdx = 0; rowIdx < parsed.rows.length; rowIdx += 1) {
    const row = parsed.rows[rowIdx];
    const isHeaderRow = preserveCsvHeader && rowIdx === 0;
    const nextRow: string[] = [];

    if (rowIdx > 0) {
      originalSegments.push({ text: parsed.newline, isEntity: false });
      sanitizedSegments.push({ text: parsed.newline, isEntity: false });
    }

    for (let colIdx = 0; colIdx < row.length; colIdx += 1) {
      if (colIdx > 0) {
        originalSegments.push({ text: ',', isEntity: false });
        sanitizedSegments.push({ text: ',', isEntity: false });
      }

      const cell = row[colIdx];
      if (isHeaderRow) {
        nextRow.push(cell);
        const serializedHeader = escapeCsvField(cell);
        originalSegments.push({ text: serializedHeader, isEntity: false });
        sanitizedSegments.push({ text: serializedHeader, isEntity: false });
        continue;
      }

      const prefix = `r${rowIdx}c${colIdx}`;
      const cellMatches = detectAllEntities(cell, prefix, enabledCategories).map((m) => ({
        ...m,
        rowIndex: rowIdx,
        columnIndex: colIdx,
        columnHeader: headers[colIdx] || `Column ${colIdx + 1}`,
      }));

      const { sanitizedText: sanitizedCell, replacements: cellReps } = redactTextWithMatches(
        cell,
        cellMatches,
        mode,
        excludedSet,
        pseudonymManager
      );

      nextRow.push(sanitizedCell);
      allMatches.push(...cellMatches);
      allReplacements.push(...cellReps);

      const { originalSegments: cellOrigSegs, sanitizedSegments: cellSanSegs } =
        buildDiffSegments(cell, sanitizedCell, cellMatches, cellReps);

      const needsOrigQuotes = /[",\r\n]/.test(cell);
      const needsSanQuotes = /[",\r\n]/.test(sanitizedCell);

      if (needsOrigQuotes) originalSegments.push({ text: '"', isEntity: false });
      for (const seg of cellOrigSegs) {
        originalSegments.push({
          ...seg,
          text: needsOrigQuotes ? seg.text.replace(/"/g, '""') : seg.text,
        });
      }
      if (needsOrigQuotes) originalSegments.push({ text: '"', isEntity: false });

      if (needsSanQuotes) sanitizedSegments.push({ text: '"', isEntity: false });
      for (const seg of cellSanSegs) {
        sanitizedSegments.push({
          ...seg,
          text: needsSanQuotes ? seg.text.replace(/"/g, '""') : seg.text,
        });
      }
      if (needsSanQuotes) sanitizedSegments.push({ text: '"', isEntity: false });
    }

    sanitizedRows.push(nextRow);
  }

  const sanitizedCsvText = serializeCsv(sanitizedRows, parsed.newline);
  const { counts, excludedCount } = countActiveMatches(allMatches, excludedSet);
  const durationMs = Math.max(0.1, Number((performance.now() - startedAt).toFixed(2)));

  return {
    sanitizedText: sanitizedCsvText,
    matches: allMatches,
    replacements: allReplacements,
    originalSegments,
    sanitizedSegments,
    counts,
    excludedCount,
    durationMs,
    usedWorker,
    fileKind: 'csv',
    csvHeaders: headers,
    csvRows: parsed.rows,
    sanitizedCsvRows: sanitizedRows,
    hasCsvHeader: preserveCsvHeader,
  };
}

export function runSanitizationPipeline(
  inputText: string,
  fileKind: FileKind,
  mode: RedactionMode,
  excludedIds: string[] = [],
  preserveCsvHeader = true,
  usedWorker = false,
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES
): SanitizationResult {
  if (fileKind === 'csv') {
    return processCsvDocument(
      inputText,
      mode,
      excludedIds,
      preserveCsvHeader,
      usedWorker,
      enabledCategories
    );
  }
  return processTextDocument(
    inputText,
    mode,
    excludedIds,
    usedWorker,
    enabledCategories
  );
}
