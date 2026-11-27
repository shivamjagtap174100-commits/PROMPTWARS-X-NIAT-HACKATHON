import { Plus, RotateCcw, Sliders, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type {
  CustomLabelsMap,
  CustomRuleDefinition,
  EntityCategory,
  RiskSeverity,
} from '../../types/privacy';
import { CATEGORY_META, CATEGORY_ORDER } from '../../utils/categoryTheme';

interface CustomRulesPanelProps {
  customRules: CustomRuleDefinition[];
  customLabels: CustomLabelsMap;
  onAddRule: (rule: Omit<CustomRuleDefinition, 'id'>) => boolean;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onUpdateCustomLabel: (category: EntityCategory, label: string) => void;
  onResetCustomLabels: () => void;
}

export function CustomRulesPanel({
  customRules,
  customLabels,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onUpdateCustomLabel,
  onResetCustomLabels,
}: CustomRulesPanelProps) {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [replacementLabel, setReplacementLabel] = useState('[CUSTOM_ID]');
  const [severity, setSeverity] = useState<RiskSeverity>('HIGH');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !pattern.trim()) return;
    const ok = onAddRule({
      name: name.trim(),
      pattern: pattern.trim(),
      replacementLabel: replacementLabel.trim() || '[CUSTOM_PII]',
      severity,
      enabled: true,
    });
    if (ok) {
      setName('');
      setPattern('');
      setReplacementLabel('[CUSTOM_ID]');
    }
  };

  return (
    <section
      aria-labelledby="custom-rules-heading"
      className="pg-shadow-card rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-5 sm:p-6"
    >
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Custom Local Regex Rules */}
        <div className="space-y-4 lg:col-span-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
              Extensible regex engine
            </p>
            <h3
              id="custom-rules-heading"
              className="mt-0.5 font-display text-base font-semibold text-[var(--pg-text-primary)]"
            >
              Custom local PII detection rules
            </h3>
            <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
              Add organization-specific identifier patterns (e.g. employee badge{' '}
              <code>EMP-\d&#123;5&#125;</code>). Rules execute strictly inside browser memory.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="custom-rule-name"
                  className="mb-1 block font-display text-xs font-semibold text-[var(--pg-text-secondary)]"
                >
                  Rule name
                </label>
                <input
                  id="custom-rule-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Employee Badge ID"
                  className="h-9 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 text-xs text-[var(--pg-text-primary)]"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-rule-severity"
                  className="mb-1 block font-display text-xs font-semibold text-[var(--pg-text-secondary)]"
                >
                  Risk severity
                </label>
                <select
                  id="custom-rule-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as RiskSeverity)}
                  className="h-9 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-2.5 font-mono text-xs text-[var(--pg-text-primary)]"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="custom-rule-regex"
                  className="mb-1 block font-display text-xs font-semibold text-[var(--pg-text-secondary)]"
                >
                  Regular expression
                </label>
                <input
                  id="custom-rule-regex"
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="EMP-\d{5}"
                  className="h-9 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 font-mono text-xs text-[var(--pg-text-primary)]"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-rule-label"
                  className="mb-1 block font-display text-xs font-semibold text-[var(--pg-text-secondary)]"
                >
                  Replacement label
                </label>
                <input
                  id="custom-rule-label"
                  type="text"
                  value={replacementLabel}
                  onChange={(e) => setReplacementLabel(e.target.value)}
                  placeholder="[EMPLOYEE_ID]"
                  className="h-9 w-full rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 font-mono text-xs text-[var(--pg-text-primary)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !pattern.trim()}
              className="pg-action-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 font-display text-xs font-semibold disabled:opacity-40"
            >
              <Plus className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
              Add custom rule
            </button>
          </form>

          {customRules.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--pg-border)] p-4 text-center text-xs text-[var(--pg-text-muted)]">
              No custom regex rules configured yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--pg-border)] rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)]">
              {customRules.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => onToggleRule(rule.id)}
                      className="h-3.5 w-3.5 accent-[#173D30]"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold text-[var(--pg-text-primary)]">
                        {rule.name}{' '}
                        <span className="font-mono text-[10px] text-[var(--pg-text-muted)]">
                          ({rule.severity})
                        </span>
                      </p>
                      <p className="truncate font-mono text-[11px] text-[var(--pg-text-secondary)]">
                        /{rule.pattern}/ → {rule.replacementLabel}
                      </p>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => onDeleteRule(rule.id)}
                    aria-label={`Delete custom rule ${rule.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--pg-border)] text-[var(--pg-text-muted)] hover:border-[#B64B43]/50 hover:text-[#B64B43]"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Custom Replacement Labels (Mode 03 Replace Label) */}
        <div className="space-y-4 border-t border-[var(--pg-border)] pt-6 lg:col-span-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#173D30] dark:text-[#A3C1A5]">
                Mode 03 templates
              </p>
              <h3 className="mt-0.5 flex items-center gap-2 font-display text-base font-semibold text-[var(--pg-text-primary)]">
                <Sliders className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                Custom replacement labels
              </h3>
              <p className="mt-1 text-xs text-[var(--pg-text-secondary)]">
                Customize token labels applied in <strong>Replace Label</strong> mode.
              </p>
            </div>

            <button
              type="button"
              onClick={onResetCustomLabels}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 font-display text-xs font-medium text-[var(--pg-text-secondary)] hover:text-[var(--pg-text-primary)]"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden="true" />
              Reset defaults
            </button>
          </div>

          <div className="grid max-h-72 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {CATEGORY_ORDER.filter((cat) => cat !== 'CUSTOM').map((cat) => {
              const meta = CATEGORY_META[cat];
              const value = customLabels[cat] ?? '';
              return (
                <div
                  key={cat}
                  className="rounded-lg border border-[var(--pg-border)] bg-[var(--pg-bg)] p-2.5"
                >
                  <label
                    htmlFor={`label-override-${cat}`}
                    className="block font-display text-[11px] font-semibold text-[var(--pg-text-secondary)]"
                  >
                    {meta.label}
                  </label>
                  <input
                    id={`label-override-${cat}`}
                    type="text"
                    value={value}
                    onChange={(e) => onUpdateCustomLabel(cat, e.target.value)}
                    placeholder={meta.defaultReplaceLabel}
                    className="mt-1 h-8 w-full rounded border border-[var(--pg-border)] bg-[var(--pg-surface)] px-2.5 font-mono text-xs text-[var(--pg-text-primary)] placeholder-[var(--pg-text-muted)]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
