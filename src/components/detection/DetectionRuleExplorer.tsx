import { AlertCircle, CheckCircle2, ScanSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DETECTION_RULE_DEFINITIONS,
  inspectInputWithRule,
} from '../../engine/detectionExplorer';
import type { EnabledCategoriesMap, EntityCategory } from '../../types/privacy';
import { CATEGORY_META } from '../../utils/categoryTheme';

interface DetectionRuleExplorerProps {
  enabledCategories: EnabledCategoriesMap;
  onToggleCategory: (category: EntityCategory) => void;
}

export function DetectionRuleExplorer({
  enabledCategories,
  onToggleCategory,
}: DetectionRuleExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<EntityCategory>('EMAIL');
  const [sandboxText, setSandboxText] = useState(
    DETECTION_RULE_DEFINITIONS[0].validSamples[0]
  );

  const activeRule = useMemo(
    () =>
      DETECTION_RULE_DEFINITIONS.find((item) => item.category === selectedCategory) ||
      DETECTION_RULE_DEFINITIONS[0],
    [selectedCategory]
  );

  const sandboxMatches = useMemo(
    () => inspectInputWithRule(selectedCategory, sandboxText),
    [selectedCategory, sandboxText]
  );

  const selectRule = (category: EntityCategory) => {
    setSelectedCategory(category);
    const nextRule = DETECTION_RULE_DEFINITIONS.find((item) => item.category === category);
    if (nextRule) {
      setSandboxText(nextRule.validSamples[0]);
    }
  };

  return (
    <section
      aria-labelledby="rule-explorer-heading"
      className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pg-border)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <ScanSearch
            className="h-5 w-5 shrink-0 text-[#173D30] dark:text-[#A3C1A5]"
            strokeWidth={1.85}
            aria-hidden="true"
          />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
              Interactive Rule Workbench
            </p>
            <h3
              id="rule-explorer-heading"
              className="font-display text-base font-semibold text-[var(--pg-text-primary)]"
            >
              Detection rule explorer
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleCategory(selectedCategory)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 font-display text-xs font-semibold transition-colors ${
            enabledCategories[selectedCategory]
              ? 'border-[#367A55]/35 bg-[#DDE6DA]/70 text-[#102D24] dark:border-[#A3C1A5]/35 dark:bg-[#233128] dark:text-[#DDE6DA]'
              : 'border-[#B64B43]/35 bg-[#B64B43]/10 text-[#7A2721] dark:text-[#F1B7B2]'
          }`}
        >
          {enabledCategories[selectedCategory] ? 'Rule active in Workspace' : 'Rule disabled'}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--pg-border)] bg-[var(--pg-bg)]/60 px-5 py-3">
        {DETECTION_RULE_DEFINITIONS.map((rule) => {
          const meta = CATEGORY_META[rule.category];
          const active = rule.category === selectedCategory;
          return (
            <button
              key={rule.category}
              type="button"
              onClick={() => selectRule(rule.category)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-display text-xs font-semibold transition-colors ${
                active
                  ? 'border-[#173D30] bg-[#173D30] text-[#FBFAF6] dark:border-[#A3C1A5] dark:bg-[#A3C1A5] dark:text-[#111713]'
                  : 'border-[var(--pg-border)] bg-[var(--pg-surface)] text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${active ? 'bg-[#D6B879] dark:bg-[#111713]' : meta.dotColorClass}`}
              />
              {meta.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Rule Details + Live Sandbox Tester */}
      <div className="grid gap-6 p-5 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-6">
          <div>
            <p className="font-mono text-[11px] text-[var(--pg-text-muted)]">
              {activeRule.modulePath}
            </p>
            <h4 className="mt-0.5 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
              {activeRule.validatorName}
            </h4>
          </div>

          <div className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-3.5 text-xs">
            <p className="font-display font-semibold text-[var(--pg-text-primary)]">
              Matching pattern
            </p>
            <p className="mt-1 font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">
              {activeRule.patternSummary}
            </p>
            <p className="mt-2.5 font-display font-semibold text-[var(--pg-text-primary)]">
              Validation boundary
            </p>
            <p className="mt-1 text-[var(--pg-text-secondary)]">{activeRule.validationScope}</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-display font-semibold text-[var(--pg-text-secondary)]">
              Click a test candidate:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeRule.validSamples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setSandboxText(sample)}
                  className="rounded border border-[#367A55]/30 bg-[#DDE6DA]/60 px-2 py-1 font-mono text-[11px] text-[#102D24] hover:bg-[#DDE6DA] dark:border-[#A3C1A5]/30 dark:bg-[#233128] dark:text-[#DDE6DA]"
                >
                  Valid: {sample}
                </button>
              ))}
              {activeRule.rejectedSamples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setSandboxText(sample)}
                  className="rounded border border-[#B64B43]/30 bg-[#B64B43]/10 px-2 py-1 font-mono text-[11px] text-[#7A2721] hover:bg-[#B64B43]/18 dark:text-[#F1B7B2]"
                >
                  Reject: {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-6">
          <div>
            <label
              htmlFor="rule-explorer-input"
              className="block font-display text-xs font-semibold text-[var(--pg-text-primary)]"
            >
              Live rule sandbox input
            </label>
            <input
              id="rule-explorer-input"
              type="text"
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              placeholder="Enter any candidate token to test the real detector..."
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-3 font-mono text-xs text-[var(--pg-text-primary)] focus:border-[#173D30] dark:focus:border-[#A3C1A5]"
            />
          </div>

          <div
            data-testid="rule-explorer-output"
            className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4 text-xs"
          >
            {sandboxMatches.length === 0 ? (
              <div className="flex items-start gap-2 text-[var(--pg-text-secondary)]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B88735]" strokeWidth={1.85} aria-hidden="true" />
                <div>
                  <p className="font-display font-semibold text-[var(--pg-text-primary)]">
                    No match — Rejected by {activeRule.validatorName}
                  </p>
                  <p className="mt-0.5">
                    Candidate either lacks required format tokens or failed validator bounds/checksum.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 font-display font-semibold text-[#367A55] dark:text-[#A3C1A5]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.85} aria-hidden="true" />
                  <span>
                    Matched {sandboxMatches.length} {CATEGORY_META[selectedCategory].shortLabel}{' '}
                    entity
                  </span>
                </div>
                {sandboxMatches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded border border-[var(--pg-border)] bg-[var(--pg-surface)] p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="font-semibold text-[var(--pg-text-primary)]">{m.value}</span>
                      <span className="text-[var(--pg-text-muted)]">
                        {m.confidence} · Chars {m.start}–{m.end}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--pg-text-secondary)]">
                      {m.confidenceReason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
