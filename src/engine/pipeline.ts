import type {
  CategoryCounts,
  CustomLabelsMap,
  CustomRuleDefinition,
  DetectionMatch,
  DiffSegment,
  EnabledCategoriesMap,
  FileKind,
  RedactedReplacement,
  RedactionMode,
  SanitizationResult,
  SensitivityLevel,
} from '../types/privacy';
import { buildDiffSegments } from './comparison/diffSegments';
import { DEFAULT_ENABLED_CATEGORIES, detectAllEntities } from './detectors/detectAll';
import { escapeCsvField, parseCsv, serializeCsv } from './parsing/csvParser';
import { validateTextContent } from './parsing/fileValidation';
import { PseudonymizationManager } from './redaction/pseudonymManager';
import { redactTextWithMatches } from './redaction/redactDocument';
import { computeRiskAssessment } from './riskAnalyzer';

function createEmptyCounts(): CategoryCounts {
  return {
    total: 0,
    EMAIL: 0,
    PHONE: 0,
    IP: 0,
    PAN: 0,
    AADHAAR: 0,
    CREDIT_CARD: 0,
    PERSON_NAME: 0,
    DOB_AGE: 0,
    GOV_ID: 0,
    FINANCIAL_ID: 0,
    DIGITAL_SECRET: 0,
    LOCATION_ADDRESS: 0,
    CUSTOM: 0,
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

export interface PipelineOptions {
  sensitivity?: SensitivityLevel;
  customRules?: CustomRuleDefinition[];
  customLabels?: CustomLabelsMap;
}

export function processTextDocument(
  inputText: string,
  mode: RedactionMode,
  excludedIdsList: string[] = [],
  usedWorker = false,
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES,
  options: PipelineOptions = {}
): SanitizationResult {
  const startedAt = performance.now();
  const validationError = validateTextContent(inputText);
  if (validationError) {
    const emptyCounts = createEmptyCounts();
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: emptyCounts,
      excludedCount: 0,
      risk: computeRiskAssessment([], new Set(), emptyCounts),
      durationMs: Math.max(0.1, Number((performance.now() - startedAt).toFixed(2))),
      usedWorker,
      fileKind: 'text',
      parseError: validationError,
    };
  }

  const excludedSet = new Set(excludedIdsList);
  const pseudonymManager = new PseudonymizationManager();

  const matches = detectAllEntities(inputText, 'txt', enabledCategories, {
    sensitivity: options.sensitivity,
    customRules: options.customRules,
  });
  const { sanitizedText, replacements } = redactTextWithMatches(
    inputText,
    matches,
    mode,
    excludedSet,
    pseudonymManager,
    options.customLabels
  );

  const { originalSegments, sanitizedSegments } = buildDiffSegments(
    inputText,
    sanitizedText,
    matches,
    replacements
  );

  const { counts, excludedCount } = countActiveMatches(matches, excludedSet);
  const risk = computeRiskAssessment(matches, excludedSet, counts);
  const durationMs = Math.max(0.1, Number((performance.now() - startedAt).toFixed(2)));

  return {
    sanitizedText,
    matches,
    replacements,
    originalSegments,
    sanitizedSegments,
    counts,
    excludedCount,
    risk,
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
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES,
  options: PipelineOptions = {}
): SanitizationResult {
  const startedAt = performance.now();
  const validationError = validateTextContent(inputText);
  if (validationError) {
    const emptyCounts = createEmptyCounts();
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: emptyCounts,
      excludedCount: 0,
      risk: computeRiskAssessment([], new Set(), emptyCounts),
      durationMs: Math.max(0.1, Number((performance.now() - startedAt).toFixed(2))),
      usedWorker,
      fileKind: 'csv',
      parseError: validationError,
    };
  }

  const parsed = parseCsv(inputText);
  if (parsed.error) {
    const emptyCounts = createEmptyCounts();
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: emptyCounts,
      excludedCount: 0,
      risk: computeRiskAssessment([], new Set(), emptyCounts),
      durationMs: Math.max(0.1, Number((performance.now() - startedAt).toFixed(2))),
      usedWorker,
      fileKind: 'csv',
      parseError: parsed.error,
    };
  }

  if (parsed.rows.length === 0) {
    const emptyCounts = createEmptyCounts();
    return {
      sanitizedText: '',
      matches: [],
      replacements: [],
      originalSegments: [],
      sanitizedSegments: [],
      counts: emptyCounts,
      excludedCount: 0,
      risk: computeRiskAssessment([], new Set(), emptyCounts),
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
      const colHeader = headers[colIdx] || `Column ${colIdx + 1}`;
      const cellMatches = detectAllEntities(cell, prefix, enabledCategories, {
        sensitivity: options.sensitivity,
        customRules: options.customRules,
        columnHeader: colHeader,
      }).map((m) => ({
        ...m,
        rowIndex: rowIdx,
        columnIndex: colIdx,
        columnHeader: colHeader,
      }));

      const { sanitizedText: sanitizedCell, replacements: cellReps } = redactTextWithMatches(
        cell,
        cellMatches,
        mode,
        excludedSet,
        pseudonymManager,
        options.customLabels
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
  const risk = computeRiskAssessment(allMatches, excludedSet, counts);
  const durationMs = Math.max(0.1, Number((performance.now() - startedAt).toFixed(2)));

  return {
    sanitizedText: sanitizedCsvText,
    matches: allMatches,
    replacements: allReplacements,
    originalSegments,
    sanitizedSegments,
    counts,
    excludedCount,
    risk,
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
  enabledCategories: EnabledCategoriesMap = DEFAULT_ENABLED_CATEGORIES,
  options: PipelineOptions = {}
): SanitizationResult {
  if (fileKind === 'csv') {
    return processCsvDocument(
      inputText,
      mode,
      excludedIds,
      preserveCsvHeader,
      usedWorker,
      enabledCategories,
      options
    );
  }
  return processTextDocument(
    inputText,
    mode,
    excludedIds,
    usedWorker,
    enabledCategories,
    options
  );
}
