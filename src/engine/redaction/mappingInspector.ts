import type { DetectionMatch, EntityCategory, RedactedReplacement } from '../../types/privacy';
import { applyPartialMask } from './masking';

export interface MappingInspectorEntry {
  id: string;
  category: EntityCategory;
  replacementToken: string;
  maskedHint: string;
  rawValue: string;
  occurrenceCount: number;
  excludedCount: number;
  positions: string[];
}

/**
 * Aggregates ephemeral match-to-replacement summaries for UI inspection without persisting
 * or logging any sensitive values. By default callers display maskedHint rather than rawValue.
 */
export function buildMappingInspectorEntries(
  matches: DetectionMatch[],
  replacements: RedactedReplacement[]
): MappingInspectorEntry[] {
  if (matches.length === 0 || replacements.length === 0) return [];

  const matchById = new Map<string, DetectionMatch>();
  for (const m of matches) {
    matchById.set(m.id, m);
  }

  const grouped = new Map<string, MappingInspectorEntry>();

  for (const rep of replacements) {
    const match = matchById.get(rep.matchId);
    if (!match) continue;

    const location =
      match.rowIndex !== undefined
        ? `R${match.rowIndex + 1}:${match.columnHeader || `C${(match.columnIndex ?? 0) + 1}`}`
        : `${match.start}–${match.end}`;

    const groupKey = `${rep.category}::${rep.replacement}::${match.value}`;
    const existing = grouped.get(groupKey);
    if (existing) {
      existing.occurrenceCount += 1;
      if (rep.excluded) existing.excludedCount += 1;
      if (existing.positions.length < 6) {
        existing.positions.push(location);
      }
      continue;
    }

    grouped.set(groupKey, {
      id: groupKey,
      category: rep.category,
      replacementToken: rep.replacement,
      maskedHint: applyPartialMask(rep.category, match.value),
      rawValue: match.value,
      occurrenceCount: 1,
      excludedCount: rep.excluded ? 1 : 0,
      positions: [location],
    });
  }

  return Array.from(grouped.values());
}
