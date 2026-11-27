export type EntityCategory =
  | 'EMAIL'
  | 'PHONE'
  | 'IP'
  | 'PAN'
  | 'AADHAAR'
  | 'CREDIT_CARD';

export type EnabledCategoriesMap = Record<EntityCategory, boolean>;

export type RedactionMode = 'FULL_MASK' | 'PARTIAL_MASK' | 'PSEUDONYM';

export type ThemeMode = 'light' | 'dark';

export type FileKind = 'text' | 'csv';

export type AppRoute =
  | '/'
  | '/login'
  | '/workspace'
  | '/documents'
  | '/audit-trail'
  | '/privacy-centre'
  | '/documentation';

export type MobileWorkspaceTab = 'original' | 'review' | 'sanitized';

export type ConfidenceLevel = 'High' | 'Format only';

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  signedInAt: string;
}

export interface DetectionMatch {
  id: string;
  category: EntityCategory;
  value: string;
  start: number;
  end: number;
  validationStatus: 'VALIDATED' | 'FORMAT_VALIDATED';
  detectionSource: string;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  rowIndex?: number;
  columnIndex?: number;
  columnHeader?: string;
}

export interface RedactedReplacement {
  matchId: string;
  category: EntityCategory;
  originalStart: number;
  originalEnd: number;
  sanitizedStart: number;
  sanitizedEnd: number;
  replacement: string;
  excluded: boolean;
}

export interface DiffSegment {
  text: string;
  isEntity: boolean;
  category?: EntityCategory;
  matchId?: string;
  excluded?: boolean;
}

export interface CategoryCounts {
  total: number;
  EMAIL: number;
  PHONE: number;
  IP: number;
  PAN: number;
  AADHAAR: number;
  CREDIT_CARD: number;
}

export interface SanitizationResult {
  sanitizedText: string;
  matches: DetectionMatch[];
  replacements: RedactedReplacement[];
  originalSegments: DiffSegment[];
  sanitizedSegments: DiffSegment[];
  counts: CategoryCounts;
  excludedCount: number;
  durationMs: number;
  usedWorker: boolean;
  fileKind: FileKind;
  csvHeaders?: string[];
  csvRows?: string[][];
  sanitizedCsvRows?: string[][];
  hasCsvHeader?: boolean;
  parseError?: string;
}

export type ExportStatus =
  | 'Not Exported'
  | 'Copied'
  | 'Downloaded TXT'
  | 'Downloaded CSV';

export type AuditStageKey =
  | 'PROCESSING_STARTED'
  | 'DETECTION_COMPLETED'
  | 'REDACTION_COMPLETED'
  | 'EXPORT_COMPLETED';

export type AuditEventCategory = 'SCAN' | 'EXPORT' | 'RESET';

export interface AuditStageRecord {
  stage: AuditStageKey;
  label: string;
  timestamp: string;
  detail: string;
  status: 'done' | 'pending';
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  dateLabel: string;
  eventType?: AuditEventCategory;
  resetNote?: string;
  fileName: string | null;
  fileKind: FileKind;
  charCount: number;
  wordCount: number;
  totalEntities: number;
  excludedEntities: number;
  categoryCounts: Record<EntityCategory, number>;
  redactionMode: RedactionMode;
  durationMs: number;
  exportStatus: ExportStatus;
  stages: AuditStageRecord[];
}

export interface SessionDocumentRecord {
  id: string;
  documentName: string;
  fileKind: FileKind;
  processingStatus: 'Completed' | 'Rejected';
  lastProcessedAt: string;
  detectionCount: number;
  redactionMode: RedactionMode;
  exportStatus: ExportStatus;
  errorMessage?: string;
  rawContent?: string;
  sanitizedText?: string;
}

export interface ProcessingLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  detail?: string;
  tone: 'info' | 'success' | 'warning' | 'error';
}

export interface FileMetadata {
  name: string;
  sizeBytes: number;
  kind: FileKind;
  rowCount?: number;
  columnCount?: number;
}

export interface SanitizationSettings {
  debounceMs: number;
  workerThresholdChars: number;
  preserveCsvHeader: boolean;
  syncDiffScroll: boolean;
}

export interface SamplePreset {
  id: string;
  label: string;
  description: string;
  fileKind: FileKind;
  fileName?: string;
  content: string;
}

export interface WorkerRequestPayload {
  requestId: string;
  inputText: string;
  fileKind: FileKind;
  mode: RedactionMode;
  excludedIds: string[];
  preserveCsvHeader: boolean;
  enabledCategories: EnabledCategoriesMap;
}

export interface WorkerResponsePayload {
  requestId: string;
  result?: SanitizationResult;
  error?: string;
}

export interface BatchFileResult {
  id: string;
  fileName: string;
  sizeBytes: number;
  fileKind: FileKind;
  status: 'completed' | 'rejected';
  entityCount: number;
  excludedCount: number;
  durationMs: number;
  redactionMode: RedactionMode;
  sanitizedText?: string;
  errorMessage?: string;
}
