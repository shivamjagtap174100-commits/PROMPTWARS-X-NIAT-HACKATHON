import type {
  CategoryCounts,
  ClassificationGroup,
  DetectionMatch,
  EntityCategory,
  FileKind,
  RedactionMode,
  RiskAssessment,
  RiskSeverity,
  SanitizationReport,
  SanitizationResult,
} from '../types/privacy';
import { CATEGORY_META, CLASSIFICATION_ORDER, SEVERITY_META } from '../utils/categoryTheme';

export function createEmptyClassificationCounts(): Record<ClassificationGroup, number> {
  return {
    'Personal Identity': 0,
    'Contact Information': 0,
    'Financial Information': 0,
    'Government Identification': 0,
    'Location Information': 0,
    'Digital Credentials': 0,
    'Other Sensitive Data': 0,
  };
}

export function createEmptySeverityCounts(): Record<RiskSeverity, number> {
  return {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
}

function scoreToRiskLevel(score: number): RiskAssessment['riskLevel'] {
  if (score >= 80) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 28) return 'MODERATE';
  if (score > 0) return 'LOW';
  return 'MINIMAL';
}

function normalizeScore(rawWeightSum: number, activeCategoryTypes: number): number {
  if (rawWeightSum <= 0) return 0;
  // Logarithmic/saturating scale plus category-breadth bonus capped at 100
  const base = Math.round(100 * (1 - Math.exp(-rawWeightSum / 65)));
  const diversityBonus = Math.min(12, Math.max(0, activeCategoryTypes - 1) * 3);
  return Math.min(100, Math.max(5, base + diversityBonus));
}

export function computeRiskAssessment(
  matches: DetectionMatch[],
  excludedIds: Set<string>,
  counts: CategoryCounts
): RiskAssessment {
  const totalFindings = matches.length;
  const activeSanitizedCount = counts.total;
  const excludedCount = Math.max(0, totalFindings - activeSanitizedCount);

  const severityCounts = createEmptySeverityCounts();
  const classificationCounts = createEmptyClassificationCounts();
  const entityTypeFreq = new Map<string, number>();
  const detectedClasses = new Set<ClassificationGroup>();

  let totalRawWeight = 0;
  let residualRawWeight = 0;
  const residualClasses = new Set<ClassificationGroup>();

  for (const match of matches) {
    severityCounts[match.severity] += 1;
    classificationCounts[match.classification] += 1;
    detectedClasses.add(match.classification);
    entityTypeFreq.set(match.entityType, (entityTypeFreq.get(match.entityType) || 0) + 1);

    const w = SEVERITY_META[match.severity].weight;
    totalRawWeight += w;

    if (excludedIds.has(match.id)) {
      residualRawWeight += w;
      residualClasses.add(match.classification);
    }
  }

  let topCategory: EntityCategory | null = null;
  let topCatCount = 0;
  for (const [key, val] of Object.entries(counts)) {
    if (key === 'total') continue;
    if (val > topCatCount) {
      topCatCount = val;
      topCategory = key as EntityCategory;
    }
  }
  if (!topCategory && matches.length > 0) {
    topCategory = matches[0].category;
  }

  let topEntityType: string | null = null;
  let topTypeCount = 0;
  for (const [label, freq] of entityTypeFreq.entries()) {
    if (freq > topTypeCount) {
      topTypeCount = freq;
      topEntityType = label;
    }
  }

  const overallRiskScore = normalizeScore(totalRawWeight, detectedClasses.size);
  const residualRiskScore = normalizeScore(residualRawWeight, residualClasses.size);
  const completionRatePct =
    totalFindings === 0 ? 100 : Math.round((activeSanitizedCount / totalFindings) * 100);

  const explanations: string[] = [];
  if (totalFindings === 0) {
    explanations.push('No sensitive identifiers matched active local detection rules.');
  } else {
    for (const cls of CLASSIFICATION_ORDER) {
      const n = classificationCounts[cls];
      if (n > 0) {
        explanations.push(
          `${n} ${cls} ${n === 1 ? 'identifier was' : 'identifiers were'} detected in this document.`
        );
      }
    }
    if (severityCounts.CRITICAL > 0) {
      explanations.push(
        `${severityCounts.CRITICAL} critical high-impact ${
          severityCounts.CRITICAL === 1 ? 'finding raises' : 'findings raise'
        } document exposure weight.`
      );
    }
    if (excludedCount === 0) {
      explanations.push('All detected entities are scheduled for redaction (0% residual risk).');
    } else {
      explanations.push(
        `${excludedCount} user-excluded ${
          excludedCount === 1 ? 'entity retains' : 'entities retain'
        } ${residualRiskScore}/100 residual risk in output.`
      );
    }
  }

  return {
    totalFindings,
    activeSanitizedCount,
    excludedCount,
    completionRatePct,
    overallRiskScore,
    residualRiskScore,
    riskLevel: scoreToRiskLevel(overallRiskScore),
    severityCounts,
    classificationCounts,
    topCategory,
    topEntityType,
    explanations,
  };
}

export function buildSanitizationReport(params: {
  fileName: string;
  fileKind: FileKind;
  redactionMode: RedactionMode;
  result: SanitizationResult;
}): SanitizationReport {
  const { fileName, fileKind, redactionMode, result } = params;
  const categoryCounts: Record<EntityCategory, number> = {
    EMAIL: result.counts.EMAIL,
    PHONE: result.counts.PHONE,
    IP: result.counts.IP,
    PAN: result.counts.PAN,
    AADHAAR: result.counts.AADHAAR,
    CREDIT_CARD: result.counts.CREDIT_CARD,
    PERSON_NAME: result.counts.PERSON_NAME,
    DOB_AGE: result.counts.DOB_AGE,
    GOV_ID: result.counts.GOV_ID,
    FINANCIAL_ID: result.counts.FINANCIAL_ID,
    DIGITAL_SECRET: result.counts.DIGITAL_SECRET,
    LOCATION_ADDRESS: result.counts.LOCATION_ADDRESS,
    CUSTOM: result.counts.CUSTOM,
  };

  return {
    reportVersion: '2.0',
    generatedAt: new Date().toISOString(),
    fileName,
    fileKind,
    processingMode: result.usedWorker ? 'Web Worker RAM' : 'Browser JS RAM',
    redactionMethod: redactionMode,
    totalDetectedEntities: result.risk.totalFindings,
    sanitizedEntityCount: result.risk.activeSanitizedCount,
    remainingSensitiveCount: result.excludedCount,
    riskScoreBefore: result.risk.overallRiskScore,
    riskScoreAfter: result.risk.residualRiskScore,
    riskLevelBefore: result.risk.riskLevel,
    categoryCounts,
    classificationCounts: result.risk.classificationCounts,
    severityCounts: result.risk.severityCounts,
    privacyExplanation:
      'All PII detection, classification, risk scoring, redaction, and export generation executed 100% locally in browser memory. Zero raw document content or original entity values appear in this report.',
  };
}

export function formatSanitizationReportMarkdown(report: SanitizationReport): string {
  const activeCatLines = Object.entries(report.categoryCounts)
    .filter(([, count]) => count > 0)
    .map(
      ([cat, count]) =>
        `- ${CATEGORY_META[cat as EntityCategory]?.label || cat}: ${count}`
    );

  const classLines = Object.entries(report.classificationCounts)
    .filter(([, count]) => count > 0)
    .map(([cls, count]) => `- ${cls}: ${count}`);

  return [
    '# PRIVACYGUARD — SANITIZATION COMPLIANCE REPORT',
    '',
    `- **Report Version:** ${report.reportVersion}`,
    `- **Generated At:** ${report.generatedAt}`,
    `- **File / Document:** ${report.fileName}`,
    `- **File Type:** ${report.fileKind.toUpperCase()}`,
    `- **Processing Execution:** ${report.processingMode}`,
    `- **Redaction Method:** ${report.redactionMethod}`,
    '',
    '## Summary Metrics',
    `- **Total Detected Entities:** ${report.totalDetectedEntities}`,
    `- **Successfully Sanitized:** ${report.sanitizedEntityCount}`,
    `- **Remaining (Excluded):** ${report.remainingSensitiveCount}`,
    `- **Risk Score Before Sanitization:** ${report.riskScoreBefore}/100 (${report.riskLevelBefore})`,
    `- **Residual Risk Score After Sanitization:** ${report.riskScoreAfter}/100`,
    '',
    '## Severity Distribution',
    `- Critical: ${report.severityCounts.CRITICAL}`,
    `- High: ${report.severityCounts.HIGH}`,
    `- Medium: ${report.severityCounts.MEDIUM}`,
    `- Low: ${report.severityCounts.LOW}`,
    '',
    '## Category Breakdown',
    ...(activeCatLines.length > 0 ? activeCatLines : ['- No entities detected']),
    '',
    '## Classification Breakdown',
    ...(classLines.length > 0 ? classLines : ['- No classifications triggered']),
    '',
    '## Client-Side Privacy Architecture Statement',
    report.privacyExplanation,
    '',
  ].join('\n');
}
