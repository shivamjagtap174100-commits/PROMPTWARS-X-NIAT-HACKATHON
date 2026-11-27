import type { CustomRuleDefinition, DetectionMatch } from '../../types/privacy';

export function detectCustomRules(
  text: string,
  rules: CustomRuleDefinition[],
  prefix = 'text'
): DetectionMatch[] {
  if (!text || rules.length === 0) return [];
  const matches: DetectionMatch[] = [];

  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern.trim()) continue;
    try {
      const regex = new RegExp(rule.pattern, 'g');
      let execResult: RegExpExecArray | null;
      let guardCount = 0;

      while ((execResult = regex.exec(text)) !== null && guardCount < 1000) {
        guardCount += 1;
        const value = execResult[0];
        if (value.length === 0) {
          regex.lastIndex += 1;
          continue;
        }
        const start = execResult.index;
        const end = start + value.length;

        matches.push({
          id: `${prefix}-CUSTOM-${rule.id}-${start}-${end}`,
          category: 'CUSTOM',
          entityType: rule.name || 'Custom PII Rule',
          classification: 'Other Sensitive Data',
          severity: rule.severity,
          value,
          start,
          end,
          validationStatus: 'FORMAT_VALIDATED',
          detectionSource: `Custom Rule (${rule.name})`,
          detectionMethod: 'Custom Regex Rule',
          confidence: 'Contextual',
          confidenceScore: 76,
          confidenceReason: `Matched user-defined local pattern /${rule.pattern}/`,
          suggestedAction: 'REPLACE',
          customReplacementLabel: rule.replacementLabel || '[CUSTOM_PII]',
        });
      }
    } catch {
      // Ignore malformed user regex gracefully without crashing detection pipeline
    }
  }

  return matches;
}
