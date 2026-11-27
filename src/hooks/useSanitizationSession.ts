import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ENABLED_CATEGORIES } from '../engine/detectors/detectAll';
import { validateSelectedFile } from '../engine/parsing/fileValidation';
import { runSanitizationPipeline } from '../engine/pipeline';
import {
  buildSanitizationReport,
  formatSanitizationReportMarkdown,
} from '../engine/riskAnalyzer';
import type {
  AuditEntry,
  AuditStageRecord,
  BatchFileResult,
  CustomLabelsMap,
  CustomRuleDefinition,
  EnabledCategoriesMap,
  EntityCategory,
  ExportStatus,
  FileKind,
  FileMetadata,
  ProcessingLogEntry,
  RedactionMode,
  SanitizationReport,
  SanitizationResult,
  SanitizationSettings,
  SessionDocumentRecord,
  ToastNotification,
} from '../types/privacy';
import { REDACTION_MODE_META } from '../utils/categoryTheme';
import {
  buildSanitizedFileName,
  convertSanitizedTextToCsv,
  copyToClipboardSafe,
  downloadLocalFile,
} from '../utils/download';
import {
  countWords,
  createClientUid,
  formatBytes,
  formatDateTimestamp,
  formatTimestamp,
} from '../utils/format';
import {
  readStoredJson,
  removeStoredKey,
  STORAGE_KEYS,
  writeStoredJson,
} from '../utils/localPersistence';
import { NOISY_SAMPLE_TEXT, SAMPLE_PRESETS } from '../utils/sampleData';
import { disposeSanitizationWorker, sanitizeDocumentAsync } from '../workers/workerClient';
import { useDebouncedValue } from './useDebouncedValue';

interface StoredPreferences {
  redactionMode?: RedactionMode;
  enabledCategories?: Partial<EnabledCategoriesMap>;
  settings?: Partial<SanitizationSettings>;
  customRules?: CustomRuleDefinition[];
  customLabels?: CustomLabelsMap;
}

interface WorkspaceHistorySnapshot {
  rawText: string;
  fileKind: FileKind;
  documentTitle: string;
  redactionMode: RedactionMode;
  excludedIds: string[];
}

const DEFAULT_SETTINGS: SanitizationSettings = {
  debounceMs: 140,
  workerThresholdChars: 25_000,
  preserveCsvHeader: true,
  syncDiffScroll: true,
  sensitivity: 'BALANCED',
};

const EMPTY_CATEGORY_COUNTS: Record<EntityCategory, number> = {
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

const EMPTY_RESULT: SanitizationResult = runSanitizationPipeline('', 'text', 'FULL_MASK', []);

function buildInitialLogs(): ProcessingLogEntry[] {
  return [
    {
      id: createClientUid('log'),
      timestamp: formatTimestamp(),
      level: 'info',
      message: 'Application initialized.',
    },
    {
      id: createClientUid('log'),
      timestamp: formatTimestamp(),
      level: 'success',
      message: 'Local multi-category detection engine ready.',
    },
  ];
}

function stripSensitiveTextFromDocs(docs: SessionDocumentRecord[]): SessionDocumentRecord[] {
  return docs.map(({ rawContent: _r, sanitizedText: _s, ...metadataOnly }) => metadataOnly);
}

function extractCategoryCountsRecord(counts: SanitizationResult['counts']): Record<EntityCategory, number> {
  return {
    EMAIL: counts.EMAIL,
    PHONE: counts.PHONE,
    IP: counts.IP,
    PAN: counts.PAN,
    AADHAAR: counts.AADHAAR,
    CREDIT_CARD: counts.CREDIT_CARD,
    PERSON_NAME: counts.PERSON_NAME,
    DOB_AGE: counts.DOB_AGE,
    GOV_ID: counts.GOV_ID,
    FINANCIAL_ID: counts.FINANCIAL_ID,
    DIGITAL_SECRET: counts.DIGITAL_SECRET,
    LOCATION_ADDRESS: counts.LOCATION_ADDRESS,
    CUSTOM: counts.CUSTOM,
  };
}

function buildAuditStages(
  startedAt: string,
  completedAt: string,
  charCount: number,
  fileKind: FileKind,
  result: SanitizationResult,
  redactionMode: RedactionMode
): AuditStageRecord[] {
  const modeTitle = REDACTION_MODE_META[redactionMode].title;
  return [
    {
      stage: 'PROCESSING_STARTED',
      label: 'Processing started',
      timestamp: startedAt,
      detail: `Loaded ${charCount.toLocaleString()} chars (${fileKind.toUpperCase()}) in ${
        result.usedWorker ? 'Web Worker RAM' : 'Browser JS RAM'
      }`,
      status: 'done',
    },
    {
      stage: 'DETECTION_COMPLETED',
      label: 'Detection & classification completed',
      timestamp: completedAt,
      detail: `Scanned rule sets in ${result.durationMs}ms · ${
        result.counts.total + result.excludedCount
      } entities · Risk ${result.risk.overallRiskScore}/100`,
      status: 'done',
    },
    {
      stage: 'REDACTION_COMPLETED',
      label: 'Redaction completed',
      timestamp: completedAt,
      detail: `${modeTitle} · ${result.counts.total} redacted${
        result.excludedCount > 0 ? ` · ${result.excludedCount} excluded` : ''
      }`,
      status: 'done',
    },
    {
      stage: 'EXPORT_COMPLETED',
      label: 'Export completed',
      timestamp: '—',
      detail: 'Pending local copy, sanitized file download, or compliance report',
      status: 'pending',
    },
  ];
}

export function useSanitizationSession(shortcutsEnabled = true) {
  const initialPrefs = useRef<StoredPreferences | null>(null);
  if (initialPrefs.current === null) {
    initialPrefs.current = readStoredJson<StoredPreferences>(STORAGE_KEYS.PREFERENCES, {});
  }

  const [rawText, setRawText] = useState<string>('');
  const [fileKind, setFileKind] = useState<FileKind>('text');
  const [fileMeta, setFileMeta] = useState<FileMetadata | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('Untitled document');
  const [activePresetId, setActivePresetId] = useState<string>('comprehensive');
  const [redactionMode, setRedactionMode] = useState<RedactionMode>(
    () => initialPrefs.current?.redactionMode || 'FULL_MASK'
  );
  const [enabledCategories, setEnabledCategories] = useState<EnabledCategoriesMap>(() => ({
    ...DEFAULT_ENABLED_CATEGORIES,
    ...(initialPrefs.current?.enabledCategories || {}),
  }));
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<SanitizationSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(initialPrefs.current?.settings || {}),
  }));
  const [customRules, setCustomRules] = useState<CustomRuleDefinition[]>(
    () => initialPrefs.current?.customRules || []
  );
  const [customLabels, setCustomLabels] = useState<CustomLabelsMap>(
    () => initialPrefs.current?.customLabels || {}
  );

  // Volatile RAM Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<WorkspaceHistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<WorkspaceHistorySnapshot[]>([]);

  const [result, setResult] = useState<SanitizationResult>(EMPTY_RESULT);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for local analysis');
  const [exportStatus, setExportStatus] = useState<ExportStatus>('Not Exported');
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [batchResults, setBatchResults] = useState<BatchFileResult[]>([]);
  const [sessionDocuments, setSessionDocuments] = useState<SessionDocumentRecord[]>(() =>
    readStoredJson<SessionDocumentRecord[]>(STORAGE_KEYS.DOCUMENTS_META, [])
  );
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [rescanTick, setRescanTick] = useState<number>(0);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(() =>
    readStoredJson<AuditEntry[]>(STORAGE_KEYS.AUDIT_ENTRIES, [])
  );
  const [logs, setLogs] = useState<ProcessingLogEntry[]>(() =>
    readStoredJson<ProcessingLogEntry[]>(STORAGE_KEYS.PROCESSING_LOGS, buildInitialLogs())
  );

  const hasMountedPrefsRef = useRef(false);
  const hasMountedAuditRef = useRef(false);
  const hasMountedDocsRef = useRef(false);
  const hasMountedLogsRef = useRef(false);

  useEffect(() => {
    if (!hasMountedPrefsRef.current) {
      hasMountedPrefsRef.current = true;
      return;
    }
    writeStoredJson(STORAGE_KEYS.PREFERENCES, {
      redactionMode,
      enabledCategories,
      settings,
      customRules,
      customLabels,
    });
  }, [redactionMode, enabledCategories, settings, customRules, customLabels]);

  useEffect(() => {
    if (!hasMountedAuditRef.current) {
      hasMountedAuditRef.current = true;
      return;
    }
    if (auditEntries.length === 0) {
      removeStoredKey(STORAGE_KEYS.AUDIT_ENTRIES);
    } else {
      writeStoredJson(STORAGE_KEYS.AUDIT_ENTRIES, auditEntries);
    }
  }, [auditEntries]);

  useEffect(() => {
    if (!hasMountedDocsRef.current) {
      hasMountedDocsRef.current = true;
      return;
    }
    if (sessionDocuments.length === 0) {
      removeStoredKey(STORAGE_KEYS.DOCUMENTS_META);
    } else {
      writeStoredJson(
        STORAGE_KEYS.DOCUMENTS_META,
        stripSensitiveTextFromDocs(sessionDocuments)
      );
    }
  }, [sessionDocuments]);

  useEffect(() => {
    if (!hasMountedLogsRef.current) {
      hasMountedLogsRef.current = true;
      return;
    }
    writeStoredJson(STORAGE_KEYS.PROCESSING_LOGS, logs);
  }, [logs]);

  const immediateBypassRef = useRef(false);
  const latestRunTokenRef = useRef(0);
  const lastAuditedSignatureRef = useRef('');
  const activeSessionDocIdRef = useRef<string>(createClientUid('doc'));

  const debouncedText = useDebouncedValue(
    rawText,
    immediateBypassRef.current ? 0 : settings.debounceMs,
    ''
  );

  const pushHistorySnapshot = useCallback(
    (snapshot?: WorkspaceHistorySnapshot) => {
      const target = snapshot || {
        rawText,
        fileKind,
        documentTitle,
        redactionMode,
        excludedIds,
      };
      setUndoStack((prev) => [...prev.slice(-24), target]);
      setRedoStack([]);
    },
    [rawText, fileKind, documentTitle, redactionMode, excludedIds]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return false;
    const previous = undoStack[undoStack.length - 1];
    const currentSnapshot: WorkspaceHistorySnapshot = {
      rawText,
      fileKind,
      documentTitle,
      redactionMode,
      excludedIds,
    };
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev.slice(-24), currentSnapshot]);
    immediateBypassRef.current = true;
    setRawText(previous.rawText);
    setFileKind(previous.fileKind);
    setDocumentTitle(previous.documentTitle);
    setRedactionMode(previous.redactionMode);
    setExcludedIds(previous.excludedIds);
    setExportStatus('Not Exported');
    return true;
  }, [undoStack, rawText, fileKind, documentTitle, redactionMode, excludedIds]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return false;
    const nextSnapshot = redoStack[redoStack.length - 1];
    const currentSnapshot: WorkspaceHistorySnapshot = {
      rawText,
      fileKind,
      documentTitle,
      redactionMode,
      excludedIds,
    };
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev.slice(-24), currentSnapshot]);
    immediateBypassRef.current = true;
    setRawText(nextSnapshot.rawText);
    setFileKind(nextSnapshot.fileKind);
    setDocumentTitle(nextSnapshot.documentTitle);
    setRedactionMode(nextSnapshot.redactionMode);
    setExcludedIds(nextSnapshot.excludedIds);
    setExportStatus('Not Exported');
    return true;
  }, [redoStack, rawText, fileKind, documentTitle, redactionMode, excludedIds]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (tone: ToastNotification['tone'], title: string, detail?: string) => {
      const id = createClientUid('toast');
      setToasts((prev) => [...prev.slice(-2), { id, tone, title, detail }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3200);
    },
    []
  );

  const appendLog = useCallback(
    (level: ProcessingLogEntry['level'], message: string) => {
      setLogs((prev) => [
        ...prev.slice(-79),
        {
          id: createClientUid('log'),
          timestamp: formatTimestamp(),
          level,
          message,
        },
      ]);
    },
    []
  );

  const recordExportSuccess = useCallback((nextExportStatus: ExportStatus, detail: string) => {
    const exportedAt = formatTimestamp();
    const exportedDate = formatDateTimestamp();
    setExportStatus(nextExportStatus);
    setAuditEntries((prev) => {
      if (prev.length === 0) return prev;
      const [latest, ...rest] = prev;
      const updatedStages = latest.stages.map((item) =>
        item.stage === 'EXPORT_COMPLETED'
          ? {
              ...item,
              timestamp: exportedAt,
              detail,
              status: 'done' as const,
            }
          : item
      );
      return [{ ...latest, exportStatus: nextExportStatus, stages: updatedStages }, ...rest];
    });
    const currentDocId = activeSessionDocIdRef.current;
    setSessionDocuments((prev) =>
      prev.map((doc) =>
        doc.id === currentDocId
          ? { ...doc, exportStatus: nextExportStatus, lastProcessedAt: exportedDate }
          : doc
      )
    );
  }, []);

  useEffect(() => {
    return () => {
      disposeSanitizationWorker();
    };
  }, []);

  useEffect(() => {
    const activeText = immediateBypassRef.current ? rawText : debouncedText;
    immediateBypassRef.current = false;

    if (!activeText) {
      setResult(EMPTY_RESULT);
      setIsProcessing(false);
      setErrorBanner(null);
      setStatusMessage('Awaiting source input');
      return;
    }

    const token = ++latestRunTokenRef.current;
    const startedAt = formatTimestamp();
    setIsProcessing(true);
    setStatusMessage(
      activeText.length >= settings.workerThresholdChars
        ? 'Processing in local Web Worker...'
        : 'Scanning locally...'
    );

    sanitizeDocumentAsync({
      inputText: activeText,
      fileKind,
      mode: redactionMode,
      excludedIds,
      preserveCsvHeader: settings.preserveCsvHeader,
      workerThresholdChars: settings.workerThresholdChars,
      enabledCategories,
      sensitivity: settings.sensitivity,
      customRules,
      customLabels,
    })
      .then((nextResult) => {
        if (token !== latestRunTokenRef.current) return;

        setResult(nextResult);
        setIsProcessing(false);

        if (nextResult.parseError) {
          setErrorBanner(nextResult.parseError);
          setStatusMessage('Input validation failed');
          appendLog('error', nextResult.parseError);
          return;
        }

        setErrorBanner(null);
        setStatusMessage(
          nextResult.usedWorker
            ? `Completed in Web Worker (${nextResult.durationMs}ms)`
            : `Processed locally (${nextResult.durationMs}ms)`
        );

        const enabledKey = Object.entries(enabledCategories)
          .filter(([, enabled]) => enabled)
          .map(([cat]) => cat)
          .join(',');

        const signature = `${activeText.length}:${fileKind}:${redactionMode}:${settings.sensitivity}:${enabledKey}:${excludedIds.join(',')}:${customRules.length}:${JSON.stringify(customLabels)}:${nextResult.matches.map((m) => m.id).join(',')}`;
        if (signature !== lastAuditedSignatureRef.current) {
          lastAuditedSignatureRef.current = signature;

          appendLog(
            'info',
            `Detection & classification scan completed (${nextResult.risk.totalFindings} entities, risk score ${nextResult.risk.overallRiskScore}/100).`
          );
          appendLog(
            'success',
            `Sanitized document generated (${REDACTION_MODE_META[redactionMode].title}: ${nextResult.counts.total} active entities).`
          );

          const now = new Date();
          const completedAt = formatTimestamp(now);
          const safeDocLabel =
            fileMeta?.name ||
            (documentTitle.trim() && documentTitle !== 'Untitled document'
              ? documentTitle.trim()
              : null);

          const entry: AuditEntry = {
            id: createClientUid('audit'),
            timestamp: completedAt,
            dateLabel: formatDateTimestamp(now),
            eventType: 'SCAN',
            fileName: safeDocLabel,
            fileKind,
            charCount: activeText.length,
            wordCount: countWords(activeText),
            totalEntities: nextResult.counts.total,
            excludedEntities: nextResult.excludedCount,
            riskScore: nextResult.risk.overallRiskScore,
            categoryCounts: extractCategoryCountsRecord(nextResult.counts),
            redactionMode,
            durationMs: nextResult.durationMs,
            exportStatus: 'Not Exported',
            stages: buildAuditStages(
              startedAt,
              completedAt,
              activeText.length,
              fileKind,
              nextResult,
              redactionMode
            ),
          };

          setAuditEntries((prev) => [entry, ...prev.slice(0, 24)]);

          const currentDocId = activeSessionDocIdRef.current;
          const nextDocRecord: SessionDocumentRecord = {
            id: currentDocId,
            documentName: safeDocLabel || `Inline ${fileKind.toUpperCase()} document`,
            fileKind,
            fileSizeBytes: fileMeta?.sizeBytes ?? new Blob([activeText]).size,
            processingStatus: 'Completed',
            lastProcessedAt: entry.dateLabel,
            detectionCount: nextResult.counts.total,
            excludedCount: nextResult.excludedCount,
            riskScore: nextResult.risk.overallRiskScore,
            redactionMode,
            exportStatus: 'Not Exported',
            rawContent: activeText,
            sanitizedText: nextResult.sanitizedText,
          };
          setSessionDocuments((prev) => [
            nextDocRecord,
            ...prev.filter((d) => d.id !== currentDocId).slice(0, 29),
          ]);
        }
      })
      .catch(() => {
        if (token !== latestRunTokenRef.current) return;
        setIsProcessing(false);
        setErrorBanner('Unexpected local processing error. Please verify input format.');
        appendLog('error', 'Local processing encountered an unexpected error.');
      });
  }, [
    rawText,
    debouncedText,
    rescanTick,
    fileKind,
    redactionMode,
    excludedIds,
    enabledCategories,
    settings.preserveCsvHeader,
    settings.workerThresholdChars,
    settings.sensitivity,
    customRules,
    customLabels,
    fileMeta?.name,
    fileMeta?.sizeBytes,
    documentTitle,
    appendLog,
  ]);

  const handleTextChange = useCallback(
    (nextText: string) => {
      if (rawText !== nextText) {
        // Save concise undo checkpoint when editing across non-trivial transitions
        if (undoStack.length === 0 || Math.abs(rawText.length - nextText.length) > 8 || nextText === '') {
          pushHistorySnapshot();
        }
      }
      if (!nextText) {
        immediateBypassRef.current = true;
        setFileKind('text');
        setFileMeta(null);
        setDocumentTitle('Untitled document');
        setExcludedIds([]);
        setIsDemoSession(false);
        lastAuditedSignatureRef.current = '';
      }
      setRawText(nextText);
      setExportStatus('Not Exported');
      setErrorBanner(null);
    },
    [rawText, undoStack.length, pushHistorySnapshot]
  );

  const loadSamplePreset = useCallback(
    (presetId: string, options?: { demoMode?: boolean; mode?: RedactionMode }) => {
      const preset = SAMPLE_PRESETS.find((item) => item.id === presetId) || SAMPLE_PRESETS[0];

      pushHistorySnapshot();
      immediateBypassRef.current = true;
      activeSessionDocIdRef.current = createClientUid('doc');
      setActivePresetId(preset.id);
      setFileKind(preset.fileKind);
      setDocumentTitle(preset.fileName || `${preset.label} (Sample)`);
      setFileMeta(
        preset.fileName
          ? {
              name: preset.fileName,
              sizeBytes: new Blob([preset.content]).size,
              kind: preset.fileKind,
            }
          : null
      );
      setExcludedIds([]);
      setExportStatus('Not Exported');
      setErrorBanner(null);
      setIsDemoSession(Boolean(options?.demoMode));
      if (options?.mode) {
        setRedactionMode(options.mode);
      }
      setRawText(preset.content);

      appendLog('info', `Synthetic sample loaded (${preset.label}).`);
      pushToast(
        'success',
        options?.demoMode ? 'Interactive demo active' : `${preset.label} loaded`,
        options?.demoMode
          ? 'Consistent pseudonymization running locally on synthetic sample'
          : preset.description
      );
    },
    [pushHistorySnapshot, appendLog, pushToast]
  );

  const loadSampleData = useCallback(() => {
    pushHistorySnapshot();
    immediateBypassRef.current = true;
    activeSessionDocIdRef.current = createClientUid('doc');
    setActivePresetId('comprehensive');
    setFileKind('text');
    setFileMeta(null);
    setDocumentTitle('Full Benchmark (Sample)');
    setExcludedIds([]);
    setExportStatus('Not Exported');
    setErrorBanner(null);
    setIsDemoSession(false);
    setRawText(NOISY_SAMPLE_TEXT);
    appendLog('info', 'Synthetic benchmark sample loaded.');
    pushToast('success', 'Sample document loaded', 'Local PII detectors scanning now');
  }, [pushHistorySnapshot, appendLog, pushToast]);

  const runDemoMode = useCallback(() => {
    loadSamplePreset('customer-support', {
      demoMode: true,
      mode: 'PSEUDONYM',
    });
  }, [loadSamplePreset]);

  const clearDocument = useCallback(() => {
    if (rawText) {
      pushHistorySnapshot();
    }
    immediateBypassRef.current = true;
    activeSessionDocIdRef.current = createClientUid('doc');
    setRawText('');
    setFileKind('text');
    setFileMeta(null);
    setDocumentTitle('Untitled document');
    setExcludedIds([]);
    setExportStatus('Not Exported');
    setErrorBanner(null);
    setIsDemoSession(false);
    lastAuditedSignatureRef.current = '';
    setResult(EMPTY_RESULT);

    const now = new Date();
    const resetAt = formatTimestamp(now);
    const resetEntry: AuditEntry = {
      id: createClientUid('reset'),
      timestamp: resetAt,
      dateLabel: formatDateTimestamp(now),
      eventType: 'RESET',
      resetNote: 'Active document & session pseudonym mappings cleared',
      fileName: null,
      fileKind: 'text',
      charCount: 0,
      wordCount: 0,
      totalEntities: 0,
      excludedEntities: 0,
      categoryCounts: { ...EMPTY_CATEGORY_COUNTS },
      redactionMode,
      durationMs: 0,
      exportStatus: 'Not Exported',
      stages: [
        {
          stage: 'PROCESSING_STARTED',
          label: 'Session reset',
          timestamp: resetAt,
          detail: 'Cleared active text buffer and reset deterministic pseudonym counters',
          status: 'done',
        },
      ],
    };
    setAuditEntries((prev) => [resetEntry, ...prev.slice(0, 24)]);
    appendLog('info', 'Workspace cleared and session pseudonym counters reset.');
    pushToast('info', 'Workspace cleared', 'Session buffers & pseudonym maps reset');
  }, [rawText, pushHistorySnapshot, appendLog, pushToast, redactionMode]);

  const rescanNow = useCallback(() => {
    if (!rawText) {
      pushToast('info', 'Awaiting document text', 'Paste text, load a sample, or upload a file first');
      return;
    }
    immediateBypassRef.current = true;
    lastAuditedSignatureRef.current = '';
    setRescanTick((prev) => prev + 1);
    appendLog('info', 'Manual local rescan requested.');
  }, [rawText, appendLog, pushToast]);

  const handleModeChange = useCallback(
    (mode: RedactionMode) => {
      if (mode !== redactionMode) {
        pushHistorySnapshot();
      }
      immediateBypassRef.current = true;
      setRedactionMode(mode);
      setExportStatus('Not Exported');
      appendLog('info', `Redaction mode switched to ${REDACTION_MODE_META[mode].title}.`);
    },
    [redactionMode, pushHistorySnapshot, appendLog]
  );

  const toggleCategory = useCallback(
    (category: EntityCategory) => {
      immediateBypassRef.current = true;
      setEnabledCategories((prev) => {
        const nextVal = !prev[category];
        appendLog('info', `${category} detector ${nextVal ? 'enabled' : 'disabled'}.`);
        return { ...prev, [category]: nextVal };
      });
      setExportStatus('Not Exported');
    },
    [appendLog]
  );

  const enableAllCategories = useCallback(() => {
    immediateBypassRef.current = true;
    setEnabledCategories(DEFAULT_ENABLED_CATEGORIES);
    setExportStatus('Not Exported');
    appendLog('info', 'All local PII detectors enabled.');
  }, [appendLog]);

  const toggleExcludeEntity = useCallback(
    (matchId: string) => {
      pushHistorySnapshot();
      immediateBypassRef.current = true;
      setExcludedIds((prev) => {
        const exists = prev.includes(matchId);
        const next = exists ? prev.filter((id) => id !== matchId) : [...prev, matchId];
        appendLog(
          'info',
          exists
            ? 'Entity restored for redaction.'
            : 'Entity excluded from redaction.'
        );
        return next;
      });
      setExportStatus('Not Exported');
    },
    [pushHistorySnapshot, appendLog]
  );

  const includeAllMatches = useCallback(() => {
    if (excludedIds.length === 0) return;
    pushHistorySnapshot();
    immediateBypassRef.current = true;
    setExcludedIds([]);
    setExportStatus('Not Exported');
    appendLog('info', 'All detected entities marked for redaction.');
  }, [excludedIds.length, pushHistorySnapshot, appendLog]);

  const excludeAllMatches = useCallback(() => {
    if (result.matches.length === 0) return;
    pushHistorySnapshot();
    immediateBypassRef.current = true;
    setExcludedIds(result.matches.map((m) => m.id));
    setExportStatus('Not Exported');
    appendLog('warning', 'All detected entities temporarily excluded.');
  }, [result.matches, pushHistorySnapshot, appendLog]);

  const toggleCategoryMatchesExcluded = useCallback(
    (category: EntityCategory, shouldExclude: boolean) => {
      const targetIds = result.matches.filter((m) => m.category === category).map((m) => m.id);
      if (targetIds.length === 0) return;
      pushHistorySnapshot();
      immediateBypassRef.current = true;
      setExcludedIds((prev) => {
        const next = new Set(prev);
        for (const id of targetIds) {
          if (shouldExclude) next.add(id);
          else next.delete(id);
        }
        return Array.from(next);
      });
      setExportStatus('Not Exported');
      appendLog(
        'info',
        `${category} entities ${shouldExclude ? 'excluded from' : 'restored to'} redaction.`
      );
    },
    [result.matches, pushHistorySnapshot, appendLog]
  );

  const toggleCsvCellExclusion = useCallback(
    (matchIds: string[]) => {
      if (matchIds.length === 0) return;
      pushHistorySnapshot();
      immediateBypassRef.current = true;
      setExcludedIds((prev) => {
        const set = new Set(prev);
        const allCurrentlyExcluded = matchIds.every((id) => set.has(id));
        for (const id of matchIds) {
          if (allCurrentlyExcluded) set.delete(id);
          else set.add(id);
        }
        return Array.from(set);
      });
      setExportStatus('Not Exported');
      appendLog('info', 'Updated CSV cell redaction selection.');
    },
    [pushHistorySnapshot, appendLog]
  );

  const addCustomRule = useCallback(
    (rule: Omit<CustomRuleDefinition, 'id'>) => {
      try {
        new RegExp(rule.pattern);
      } catch {
        pushToast('error', 'Invalid regex syntax', 'Please enter a valid JavaScript regular expression');
        return false;
      }
      const created: CustomRuleDefinition = {
        ...rule,
        id: createClientUid('rule'),
      };
      immediateBypassRef.current = true;
      setCustomRules((prev) => [...prev, created]);
      setEnabledCategories((prev) => ({ ...prev, CUSTOM: true }));
      appendLog('info', `Added custom local rule (${created.name}).`);
      pushToast('success', 'Custom rule added', created.name);
      return true;
    },
    [appendLog, pushToast]
  );

  const toggleCustomRule = useCallback((id: string) => {
    immediateBypassRef.current = true;
    setCustomRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const deleteCustomRule = useCallback(
    (id: string) => {
      immediateBypassRef.current = true;
      setCustomRules((prev) => prev.filter((r) => r.id !== id));
      appendLog('info', 'Removed custom detection rule.');
    },
    [appendLog]
  );

  const updateCustomLabel = useCallback((category: EntityCategory, label: string) => {
    immediateBypassRef.current = true;
    setCustomLabels((prev) => {
      const next = { ...prev };
      if (!label.trim()) {
        delete next[category];
      } else {
        next[category] = label.trim();
      }
      return next;
    });
  }, []);

  const resetCustomLabels = useCallback(() => {
    immediateBypassRef.current = true;
    setCustomLabels({});
    appendLog('info', 'Reset custom replacement labels to defaults.');
  }, [appendLog]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validation = validateSelectedFile(file);
      if (!validation.valid || !validation.kind) {
        const errText = validation.error || 'Invalid file.';
        setErrorBanner(errText);
        appendLog('error', errText);
        pushToast('error', 'File rejected', errText);
        return;
      }

      try {
        const text = await file.text();
        if (!text.trim()) {
          const msg = 'Uploaded file contains no readable text.';
          setErrorBanner(msg);
          appendLog('error', msg);
          pushToast('error', 'Empty file', msg);
          return;
        }

        if (rawText) pushHistorySnapshot();
        immediateBypassRef.current = true;
        activeSessionDocIdRef.current = createClientUid('doc');
        setFileKind(validation.kind);
        setDocumentTitle(file.name);
        setFileMeta({
          name: file.name,
          sizeBytes: file.size,
          kind: validation.kind,
        });
        setExcludedIds([]);
        setExportStatus('Not Exported');
        setErrorBanner(null);
        setIsDemoSession(false);
        setRawText(text);
        appendLog(
          'success',
          `Local ${validation.kind.toUpperCase()} file loaded (${formatBytes(file.size)}).`
        );
        pushToast(
          'success',
          'Local file loaded',
          `${validation.kind.toUpperCase()} (${formatBytes(file.size)})`
        );
      } catch {
        const msg = 'Failed to read the selected local file.';
        setErrorBanner(msg);
        appendLog('error', msg);
        pushToast('error', 'Read failure', msg);
      }
    },
    [rawText, pushHistorySnapshot, appendLog, pushToast]
  );

  const handleCopySanitized = useCallback(async () => {
    if (!result.sanitizedText || result.parseError) {
      setErrorBanner('Nothing valid to copy yet. Provide text or load sample data first.');
      return false;
    }

    const copied = await copyToClipboardSafe(result.sanitizedText);
    if (!copied) {
      setErrorBanner('Clipboard permission unavailable in this browser context.');
      appendLog('warning', 'Clipboard copy failed.');
      return false;
    }

    recordExportSuccess('Copied', 'Sanitized output copied locally to clipboard');
    appendLog('success', 'Sanitized output copied locally to clipboard.');
    pushToast('success', 'Copied to clipboard', 'Sanitized output copied without original PII');
    return true;
  }, [result.sanitizedText, result.parseError, recordExportSuccess, appendLog, pushToast]);

  const handleDownloadTxt = useCallback(() => {
    if (!result.sanitizedText || result.parseError) {
      setErrorBanner('Nothing valid to export. Provide text or upload a valid .txt/.csv file.');
      return false;
    }

    const targetName = buildSanitizedFileName(fileMeta?.name || null, 'text');
    const dl = downloadLocalFile(result.sanitizedText, targetName, 'text');
    if (!dl.ok) {
      setErrorBanner(dl.error || 'Local download failed.');
      appendLog('error', 'Local TXT download failed.');
      return false;
    }

    recordExportSuccess('Downloaded TXT', `Local file saved (${targetName})`);
    appendLog('success', 'Sanitized TXT exported locally.');
    pushToast('success', 'Downloaded sanitized TXT', targetName);
    return true;
  }, [result.sanitizedText, result.parseError, fileMeta?.name, recordExportSuccess, appendLog, pushToast]);

  const handleDownloadCsv = useCallback(() => {
    if (!result.sanitizedText || result.parseError) {
      setErrorBanner('Nothing valid to export. Provide text or upload a valid .txt/.csv file.');
      return false;
    }

    const csvPayload =
      fileKind === 'csv'
        ? result.sanitizedText
        : convertSanitizedTextToCsv(result.sanitizedText);
    const targetName = buildSanitizedFileName(fileMeta?.name || null, 'csv');
    const dl = downloadLocalFile(csvPayload, targetName, 'csv');
    if (!dl.ok) {
      setErrorBanner(dl.error || 'Local download failed.');
      appendLog('error', 'Local CSV download failed.');
      return false;
    }

    recordExportSuccess('Downloaded CSV', `RFC 4180 CSV exported (${targetName})`);
    appendLog('success', 'Sanitized CSV exported locally.');
    pushToast('success', 'Downloaded sanitized CSV', targetName);
    return true;
  }, [
    result.sanitizedText,
    result.parseError,
    fileKind,
    fileMeta?.name,
    recordExportSuccess,
    appendLog,
    pushToast,
  ]);

  const handleDownloadSanitized = useCallback(() => {
    return fileKind === 'csv' ? handleDownloadCsv() : handleDownloadTxt();
  }, [fileKind, handleDownloadCsv, handleDownloadTxt]);

  const latestReport: SanitizationReport | null = useMemo(() => {
    if (!rawText || result.parseError) return null;
    return buildSanitizationReport({
      fileName: fileMeta?.name || documentTitle || 'Untitled document',
      fileKind,
      redactionMode,
      result,
    });
  }, [rawText, fileKind, fileMeta?.name, documentTitle, redactionMode, result]);

  const downloadReport = useCallback(
    (format: 'json' | 'md') => {
      if (!latestReport) {
        pushToast('info', 'No scanned document', 'Scan or load a sample before exporting a report');
        return false;
      }
      const payload =
        format === 'json'
          ? JSON.stringify(latestReport, null, 2)
          : formatSanitizationReportMarkdown(latestReport);
      const ext = format === 'json' ? 'json' : 'md';
      const fileName = `privacyguard-sanitization-report.${ext}`;
      const dl = downloadLocalFile(payload, fileName, 'text');
      if (!dl.ok) {
        pushToast('error', 'Report export failed', dl.error);
        return false;
      }
      recordExportSuccess('Exported Report', `Sanitization compliance report saved (${fileName})`);
      appendLog('success', `Privacy-safe sanitization report exported (${fileName}).`);
      pushToast('success', 'Sanitization report exported', fileName);
      return true;
    },
    [latestReport, recordExportSuccess, appendLog, pushToast]
  );

  const clearAuditHistory = useCallback(() => {
    setAuditEntries([]);
    appendLog('info', 'Privacy-safe audit summary cleared.');
    pushToast('info', 'Audit history cleared');
  }, [appendLog, pushToast]);

  const clearLogs = useCallback(() => {
    setLogs([
      {
        id: createClientUid('log'),
        timestamp: formatTimestamp(),
        level: 'info',
        message: 'Processing log cleared.',
      },
    ]);
  }, []);

  const updateSettings = useCallback((patch: Partial<SanitizationSettings>) => {
    immediateBypassRef.current = true;
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const runBatchUpload = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setIsBatchProcessing(true);
      const nextResults: BatchFileResult[] = [];
      const newAuditItems: AuditEntry[] = [];
      const newSessionDocs: SessionDocumentRecord[] = [];

      for (const file of files) {
        const validation = validateSelectedFile(file);
        if (!validation.valid || !validation.kind) {
          nextResults.push({
            id: createClientUid('batch'),
            fileName: file.name,
            sizeBytes: file.size,
            fileKind: validation.kind || 'text',
            status: 'rejected',
            entityCount: 0,
            excludedCount: 0,
            durationMs: 0,
            redactionMode,
            errorMessage: validation.error || 'Unsupported or invalid local file.',
          });
          appendLog('warning', `Batch skipped invalid file (${validation.kind || 'unknown'}).`);
          continue;
        }

        try {
          const startedAt = formatTimestamp();
          const text = await file.text();
          if (!text.trim()) {
            nextResults.push({
              id: createClientUid('batch'),
              fileName: file.name,
              sizeBytes: file.size,
              fileKind: validation.kind,
              status: 'rejected',
              entityCount: 0,
              excludedCount: 0,
              durationMs: 0,
              redactionMode,
              errorMessage: 'Uploaded file contains no readable text.',
            });
            continue;
          }

          const batchRes = await sanitizeDocumentAsync({
            inputText: text,
            fileKind: validation.kind,
            mode: redactionMode,
            excludedIds: [],
            preserveCsvHeader: settings.preserveCsvHeader,
            workerThresholdChars: settings.workerThresholdChars,
            enabledCategories,
            sensitivity: settings.sensitivity,
            customRules,
            customLabels,
          });

          if (batchRes.parseError) {
            nextResults.push({
              id: createClientUid('batch'),
              fileName: file.name,
              sizeBytes: file.size,
              fileKind: validation.kind,
              status: 'rejected',
              entityCount: 0,
              excludedCount: 0,
              durationMs: batchRes.durationMs,
              redactionMode,
              errorMessage: batchRes.parseError,
            });
            continue;
          }

          const now = new Date();
          const completedAt = formatTimestamp(now);
          const itemId = createClientUid('batch');
          nextResults.push({
            id: itemId,
            fileName: file.name,
            sizeBytes: file.size,
            fileKind: validation.kind,
            status: 'completed',
            entityCount: batchRes.counts.total,
            excludedCount: batchRes.excludedCount,
            durationMs: batchRes.durationMs,
            redactionMode,
            sanitizedText: batchRes.sanitizedText,
          });

          newAuditItems.push({
            id: createClientUid('audit'),
            timestamp: completedAt,
            dateLabel: formatDateTimestamp(now),
            eventType: 'SCAN',
            fileName: file.name,
            fileKind: validation.kind,
            charCount: text.length,
            wordCount: countWords(text),
            totalEntities: batchRes.counts.total,
            excludedEntities: batchRes.excludedCount,
            riskScore: batchRes.risk.overallRiskScore,
            categoryCounts: extractCategoryCountsRecord(batchRes.counts),
            redactionMode,
            durationMs: batchRes.durationMs,
            exportStatus: 'Not Exported',
            stages: buildAuditStages(
              startedAt,
              completedAt,
              text.length,
              validation.kind,
              batchRes,
              redactionMode
            ),
          });

          newSessionDocs.push({
            id: itemId,
            documentName: file.name,
            fileKind: validation.kind,
            fileSizeBytes: file.size,
            processingStatus: 'Completed',
            lastProcessedAt: formatDateTimestamp(now),
            detectionCount: batchRes.counts.total,
            excludedCount: batchRes.excludedCount,
            riskScore: batchRes.risk.overallRiskScore,
            redactionMode,
            exportStatus: 'Not Exported',
            rawContent: text,
            sanitizedText: batchRes.sanitizedText,
          });
        } catch {
          nextResults.push({
            id: createClientUid('batch'),
            fileName: file.name,
            sizeBytes: file.size,
            fileKind: validation.kind,
            status: 'rejected',
            entityCount: 0,
            excludedCount: 0,
            durationMs: 0,
            redactionMode,
            errorMessage: 'Failed to read local file stream.',
          });
        }
      }

      setBatchResults((prev) => [...nextResults, ...prev.slice(0, 29)]);
      if (newSessionDocs.length > 0) {
        setSessionDocuments((prev) => [...newSessionDocs.reverse(), ...prev.slice(0, 29)]);
      }
      if (newAuditItems.length > 0) {
        setAuditEntries((prev) => [...newAuditItems.reverse(), ...prev.slice(0, 24)]);
      }
      setIsBatchProcessing(false);

      const completedCount = nextResults.filter((r) => r.status === 'completed').length;
      appendLog(
        completedCount > 0 ? 'success' : 'warning',
        `Local batch run finished (${completedCount}/${files.length} files sanitized).`
      );
      pushToast(
        completedCount > 0 ? 'success' : 'warning',
        'Batch scan finished',
        `${completedCount} of ${files.length} local files sanitized cleanly`
      );
    },
    [
      redactionMode,
      settings.preserveCsvHeader,
      settings.workerThresholdChars,
      settings.sensitivity,
      enabledCategories,
      customRules,
      customLabels,
      appendLog,
      pushToast,
    ]
  );

  const downloadBatchResult = useCallback(
    (item: BatchFileResult) => {
      if (item.status !== 'completed' || !item.sanitizedText) return false;
      const targetName = buildSanitizedFileName(item.fileName, item.fileKind);
      const dl = downloadLocalFile(item.sanitizedText, targetName, item.fileKind);
      if (!dl.ok) {
        pushToast('error', 'Batch export failed', dl.error);
        return false;
      }
      pushToast('success', 'Downloaded sanitized batch file', targetName);
      appendLog('success', `Batch file exported (${targetName}).`);
      return true;
    },
    [appendLog, pushToast]
  );

  const clearBatchResults = useCallback(() => {
    setBatchResults([]);
    appendLog('info', 'Batch queue cleared from memory.');
  }, [appendLog]);

  const openSessionDocument = useCallback(
    (docId: string) => {
      const target = sessionDocuments.find((d) => d.id === docId);
      if (!target || !target.rawContent) {
        return false;
      }
      if (rawText) pushHistorySnapshot();
      immediateBypassRef.current = true;
      activeSessionDocIdRef.current = target.id;
      setFileKind(target.fileKind);
      setDocumentTitle(target.documentName);
      setFileMeta({
        name: target.documentName,
        sizeBytes: new Blob([target.rawContent]).size,
        kind: target.fileKind,
      });
      setRedactionMode(target.redactionMode);
      setExcludedIds([]);
      setExportStatus(target.exportStatus);
      setErrorBanner(null);
      setRawText(target.rawContent);
      appendLog('info', 'Loaded document from active browser session memory.');
      return true;
    },
    [sessionDocuments, rawText, pushHistorySnapshot, appendLog]
  );

  const downloadSessionDocument = useCallback(
    (docId: string) => {
      const target = sessionDocuments.find((d) => d.id === docId);
      if (!target || !target.sanitizedText) return false;
      const fileName = buildSanitizedFileName(target.documentName, target.fileKind);
      const dl = downloadLocalFile(target.sanitizedText, fileName, target.fileKind);
      if (!dl.ok) {
        pushToast('error', 'Download failed', dl.error);
        return false;
      }
      const nextStatus: ExportStatus =
        target.fileKind === 'csv' ? 'Downloaded CSV' : 'Downloaded TXT';
      setSessionDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, exportStatus: nextStatus } : d))
      );
      pushToast('success', 'Downloaded sanitized document', fileName);
      appendLog('success', `Exported sanitized session document (${fileName}).`);
      return true;
    },
    [sessionDocuments, pushToast, appendLog]
  );

  const deleteSessionDocument = useCallback(
    (docId: string) => {
      setSessionDocuments((prev) => prev.filter((d) => d.id !== docId));
      appendLog('info', 'Removed document entry from active session memory.');
      pushToast('info', 'Session document removed');
    },
    [appendLog, pushToast]
  );

  const clearAllSessionData = useCallback(() => {
    immediateBypassRef.current = true;
    activeSessionDocIdRef.current = createClientUid('doc');
    setRawText('');
    setFileKind('text');
    setFileMeta(null);
    setDocumentTitle('Untitled document');
    setExcludedIds([]);
    setUndoStack([]);
    setRedoStack([]);
    setExportStatus('Not Exported');
    setErrorBanner(null);
    setIsDemoSession(false);
    lastAuditedSignatureRef.current = '';
    setResult(EMPTY_RESULT);
    setSessionDocuments([]);
    setBatchResults([]);
    setAuditEntries([]);
    removeStoredKey(STORAGE_KEYS.AUDIT_ENTRIES);
    removeStoredKey(STORAGE_KEYS.DOCUMENTS_META);
    removeStoredKey(STORAGE_KEYS.PROCESSING_LOGS);
    setLogs([
      {
        id: createClientUid('log'),
        timestamp: formatTimestamp(),
        level: 'info',
        message: 'All active session data and metadata cleared from browser RAM.',
      },
    ]);
    pushToast('info', 'Session data cleared', 'All browser RAM buffers and persisted metadata reset');
  }, [pushToast]);

  const exportAuditMetadata = useCallback(() => {
    if (auditEntries.length === 0) return false;
    const safeMetadata = auditEntries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      dateLabel: entry.dateLabel,
      eventType: entry.eventType || 'SCAN',
      fileName: entry.fileName,
      fileKind: entry.fileKind,
      totalEntities: entry.totalEntities,
      excludedEntities: entry.excludedEntities,
      riskScore: entry.riskScore,
      categoryCounts: entry.categoryCounts,
      redactionMode: entry.redactionMode,
      durationMs: entry.durationMs,
      exportStatus: entry.exportStatus,
    }));
    const payload = JSON.stringify(safeMetadata, null, 2);
    const dl = downloadLocalFile(payload, 'privacyguard-audit-metadata.json', 'text');
    if (!dl.ok) {
      pushToast('error', 'Audit export failed', dl.error);
      return false;
    }
    pushToast('success', 'Exported non-PII audit metadata', 'privacyguard-audit-metadata.json');
    appendLog('success', 'Non-PII audit metadata exported locally.');
    return true;
  }, [auditEntries, pushToast, appendLog]);

  // Global keyboard shortcuts (Alt+1/2/3/4/5 modes, Alt+Shift+C copy, Ctrl+Shift+L demo)
  useEffect(() => {
    if (!shortcutsEnabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void handleCopySanitized();
      } else if (event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === '1') {
          event.preventDefault();
          handleModeChange('FULL_MASK');
        } else if (event.key === '2') {
          event.preventDefault();
          handleModeChange('PARTIAL_MASK');
        } else if (event.key === '3') {
          event.preventDefault();
          handleModeChange('PSEUDONYM');
        } else if (event.key === '4') {
          event.preventDefault();
          handleModeChange('REPLACE');
        } else if (event.key === '5') {
          event.preventDefault();
          handleModeChange('REMOVE');
        }
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'l'
      ) {
        event.preventDefault();
        runDemoMode();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcutsEnabled, handleModeChange, runDemoMode, handleCopySanitized]);

  return {
    rawText,
    fileKind,
    fileMeta,
    documentTitle,
    setDocumentTitle,
    activePresetId,
    redactionMode,
    enabledCategories,
    excludedIds,
    settings,
    customRules,
    customLabels,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    result,
    latestReport,
    isProcessing,
    errorBanner,
    statusMessage,
    exportStatus,
    isDemoSession,
    toasts,
    batchResults,
    sessionDocuments,
    isBatchProcessing,
    auditEntries,
    logs,
    setErrorBanner,
    dismissToast,
    handleTextChange,
    loadSampleData,
    loadSamplePreset,
    runDemoMode,
    rescanNow,
    clearDocument,
    undo,
    redo,
    handleModeChange,
    toggleCategory,
    enableAllCategories,
    toggleExcludeEntity,
    includeAllMatches,
    excludeAllMatches,
    toggleCategoryMatchesExcluded,
    toggleCsvCellExclusion,
    addCustomRule,
    toggleCustomRule,
    deleteCustomRule,
    updateCustomLabel,
    resetCustomLabels,
    handleFileUpload,
    runBatchUpload,
    downloadBatchResult,
    clearBatchResults,
    openSessionDocument,
    downloadSessionDocument,
    deleteSessionDocument,
    clearAllSessionData,
    exportAuditMetadata,
    downloadReport,
    handleCopySanitized,
    handleDownloadTxt,
    handleDownloadCsv,
    handleDownloadSanitized,
    clearAuditHistory,
    clearLogs,
    updateSettings,
  };
}
