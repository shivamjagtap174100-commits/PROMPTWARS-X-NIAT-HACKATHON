export type EntityCategory =
  | 'EMAIL'
  | 'PHONE'
  | 'IP'
  | 'PAN'
  | 'AADHAAR'
  | 'CREDIT_CARD'
  | 'PERSON_NAME'
  | 'DOB_AGE'
  | 'GOV_ID'
  | 'FINANCIAL_ID'
  | 'DIGITAL_SECRET'
  | 'LOCATION_ADDRESS'
  | 'CUSTOM';

export type ClassificationGroup =
  | 'Personal Identity'
  | 'Contact Information'
  | 'Financial Information'
  | 'Government Identification'
  | 'Location Information'
  | 'Digital Credentials'
  | 'Other Sensitive Data';

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DetectionMethod =
  | 'Structural Validator'
  | 'Checksum (Luhn Mod-10)'
  | 'Format Pattern Only'
  | 'Context + Pattern'
  | 'Local Heuristic NER'
  | 'Custom Regex Rule';

export type SensitivityLevel = 'BALANCED' | 'STRICT';

export type EnabledCategoriesMap = Record<EntityCategory, boolean>;

export type RedactionMode =
  | 'FULL_MASK'
  | 'PARTIAL_MASK'
  | 'REPLACE'
  | 'REMOVE'
  | 'PSEUDONYM';

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

export type ConfidenceLevel = 'High' | 'Format only' | 'Contextual';

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  signedInAt: string;
}

export interface CustomRuleDefinition {
  id: string;
  name: string;
  pattern: string;
  replacementLabel: string;
  severity: RiskSeverity;
  enabled: boolean;
}

export type CustomLabelsMap = Partial<Record<EntityCategory, string>>;

export interface DetectionMatch {
  id: string;
  category: EntityCategory;
  entityType: string;
  classification: ClassificationGroup;
  severity: RiskSeverity;
  value: string;
  start: number;
  end: number;
  validationStatus: 'VALIDATED' | 'FORMAT_VALIDATED' | 'CONTEXT_MATCHED';
  detectionSource: string;
  detectionMethod: DetectionMethod;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  confidenceReason: string;
  suggestedAction: RedactionMode;
  customReplacementLabel?: string;
  rowIndex?: number;
  columnIndex?: number;
  columnHeader?: string;
}

export interface RedactedReplacement {
  matchId: string;
  category: EntityCategory;
  entityType: string;
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
  PERSON_NAME: number;
  DOB_AGE: number;
  GOV_ID: number;
  FINANCIAL_ID: number;
  DIGITAL_SECRET: number;
  LOCATION_ADDRESS: number;
  CUSTOM: number;
}

export interface RiskAssessment {
  totalFindings: number;
  activeSanitizedCount: number;
  excludedCount: number;
  completionRatePct: number;
  overallRiskScore: number;
  residualRiskScore: number;
  riskLevel: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  severityCounts: Record<RiskSeverity, number>;
  classificationCounts: Record<ClassificationGroup, number>;
  topCategory: EntityCategory | null;
  topEntityType: string | null;
  explanations: string[];
}

export interface SanitizationReport {
  reportVersion: string;
  generatedAt: string;
  fileName: string;
  fileKind: FileKind;
  processingMode: 'Web Worker RAM' | 'Browser JS RAM';
  redactionMethod: RedactionMode;
  totalDetectedEntities: number;
  sanitizedEntityCount: number;
  remainingSensitiveCount: number;
  riskScoreBefore: number;
  riskScoreAfter: number;
  riskLevelBefore: RiskAssessment['riskLevel'];
  categoryCounts: Record<EntityCategory, number>;
  classificationCounts: Record<ClassificationGroup, number>;
  severityCounts: Record<RiskSeverity, number>;
  privacyExplanation: string;
}

export interface SanitizationResult {
  sanitizedText: string;
  matches: DetectionMatch[];
  replacements: RedactedReplacement[];
  originalSegments: DiffSegment[];
  sanitizedSegments: DiffSegment[];
  counts: CategoryCounts;
  excludedCount: number;
  risk: RiskAssessment;
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
  | 'Downloaded CSV'
  | 'Exported Report';

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
  riskScore?: number;
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
  fileSizeBytes?: number;
  processingStatus: 'Completed' | 'Rejected';
  lastProcessedAt: string;
  detectionCount: number;
  excludedCount?: number;
  riskScore?: number;
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
  sensitivity: SensitivityLevel;
}

export interface SamplePreset {
  id: string;
  label: string;
  description: string;
  fileKind: FileKind;
  fileName?: string;
  isSynthetic?: boolean;
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
  sensitivity?: SensitivityLevel;
  customRules?: CustomRuleDefinition[];
  customLabels?: CustomLabelsMap;
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
