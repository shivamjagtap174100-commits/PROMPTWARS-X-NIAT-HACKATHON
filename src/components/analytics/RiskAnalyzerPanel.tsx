import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { EntityCategory, RiskAssessment, RiskSeverity } from '../../types/privacy';
import {
  CATEGORY_META,
  CLASSIFICATION_ORDER,
  SEVERITY_META,
} from '../../utils/categoryTheme';

interface RiskAnalyzerPanelProps {
  risk: RiskAssessment;
  hasText: boolean;
}

const SEVERITY_ORDER: RiskSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function riskBadgeStyle(level: RiskAssessment['riskLevel']): string {
  switch (level) {
    case 'CRITICAL':
      return 'border-[#B64B43]/40 bg-[#B64B43]/15 text-[#7A2721] dark:border-[#DF7B73]/40 dark:bg-[#B64B43]/25 dark:text-[#F6C8C4]';
    case 'HIGH':
      return 'border-[#B88735]/40 bg-[#D6B879]/25 text-[#5B4115] dark:border-[#D6B879]/40 dark:bg-[#B88735]/25 dark:text-[#F2D9AA]';
    case 'MODERATE':
      return 'border-[#829782]/45 bg-[#DDE6DA]/80 text-[#173D30] dark:border-[#A3C1A5]/40 dark:bg-[#233128] dark:text-[#DDE6DA]';
    default:
      return 'border-[#367A55]/35 bg-[#DDE6DA]/70 text-[#102D24] dark:border-[#A3C1A5]/35 dark:bg-[#233128] dark:text-[#A3C1A5]';
  }
}

export function RiskAnalyzerPanel({ risk, hasText }: RiskAnalyzerPanelProps) {
  const maxSeverityCount = Math.max(1, ...SEVERITY_ORDER.map((s) => risk.severityCounts[s]));
  const topCatLabel = risk.topCategory
    ? CATEGORY_META[risk.topCategory as EntityCategory]?.shortLabel || risk.topCategory
    : 'None';

  return (
    <section
      aria-labelledby="risk-analyzer-heading"
      className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--pg-border)] pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
            Privacy risk analyzer · Genuine runtime scoring
          </p>
          <h3
            id="risk-analyzer-heading"
            className="mt-0.5 font-display text-lg font-semibold tracking-tight text-[var(--pg-text-primary)]"
          >
            Classification &amp; severity assessment
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            data-testid="risk-score-badge"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold tabular-nums ${riskBadgeStyle(
              risk.riskLevel
            )}`}
          >
            {risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'HIGH' ? (
              <AlertTriangle className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            )}
            <span>
              Exposure Risk: {risk.overallRiskScore}/100 ({risk.riskLevel})
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 py-1.5 font-mono text-xs tabular-nums text-[var(--pg-text-primary)]">
            <CheckCircle2
              className="h-4 w-4 text-[#367A55] dark:text-[#A3C1A5]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            Residual Risk: {risk.residualRiskScore}/100
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--pg-text-muted)]">
            Total findings
          </span>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-[var(--pg-text-primary)]">
            {risk.totalFindings}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--pg-text-muted)]">
            Critical findings
          </span>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-[#B64B43] dark:text-[#DF7B73]">
            {risk.severityCounts.CRITICAL}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--pg-text-muted)]">
            Most frequent PII
          </span>
          <p className="mt-1 truncate font-display text-base font-bold text-[var(--pg-text-primary)]">
            {risk.topEntityType || topCatLabel}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--pg-text-muted)]">
            Redaction completion
          </span>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-[#367A55] dark:text-[#A3C1A5]">
            {hasText ? `${risk.completionRatePct}%` : '—'}
          </p>
        </div>
      </div>

      {/* Two-Column Breakdown: Severity Bars (left) + Classification & Explanations (right) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Severity Bar Visualization */}
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.06em] text-[var(--pg-text-secondary)]">
            <ShieldAlert className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Severity distribution (weighted)
          </div>

          <div className="space-y-2.5 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4">
            {SEVERITY_ORDER.map((sev) => {
              const meta = SEVERITY_META[sev];
              const count = risk.severityCounts[sev];
              const pct = count === 0 ? 0 : Math.max(8, Math.round((count / maxSeverityCount) * 100));
              return (
                <div key={sev} className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[var(--pg-text-primary)]">
                      {meta.label}{' '}
                      <span className="text-[10px] text-[var(--pg-text-muted)]">
                        (wt {meta.weight})
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--pg-text-primary)]">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--pg-surface-secondary)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${meta.barClasses}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7 Classification Groups + Explainable Sentences */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.06em] text-[var(--pg-text-secondary)]">
            <Activity className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            Classification distribution
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CLASSIFICATION_ORDER.map((cls) => {
              const count = risk.classificationCounts[cls];
              return (
                <div
                  key={cls}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    count > 0
                      ? 'border-[#367A55]/35 bg-[#DDE6DA]/55 text-[var(--pg-text-primary)] dark:border-[#A3C1A5]/35 dark:bg-[#233128]/70'
                      : 'border-[var(--pg-border)] bg-[var(--pg-bg)] text-[var(--pg-text-muted)]'
                  }`}
                >
                  <span className="truncate pr-2 font-medium">{cls}</span>
                  <span className="font-mono font-semibold tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-[var(--pg-text-muted)]">
              Automated risk assessment summary (zero raw PII)
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--pg-text-secondary)]">
              {risk.explanations.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#173D30] dark:bg-[#A3C1A5]"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
