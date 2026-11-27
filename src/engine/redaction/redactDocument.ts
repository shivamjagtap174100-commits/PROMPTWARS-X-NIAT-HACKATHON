import type {
  DetectionMatch,
  RedactedReplacement,
  RedactionMode,
} from '../../types/privacy';
import { formatReplacementValue } from './masking';
import type { PseudonymizationManager } from './pseudonymManager';

export interface RedactOutput {
  sanitizedText: string;
  replacements: RedactedReplacement[];
}

export function redactTextWithMatches(
  text: string,
  matches: DetectionMatch[],
  mode: RedactionMode,
  excludedIds: Set<string>,
  pseudonymManager: PseudonymizationManager
): RedactOutput {
  if (!text || matches.length === 0) {
    return { sanitizedText: text, replacements: [] };
  }

  const ordered = [...matches].sort((a, b) => a.start - b.start);
  const replacements: RedactedReplacement[] = [];
  let cursor = 0;
  let sanitizedCursor = 0;
  const chunks: string[] = [];

  for (const match of ordered) {
    if (match.start < cursor) {
      continue;
    }

    const unchangedPrefix = text.slice(cursor, match.start);
    chunks.push(unchangedPrefix);
    sanitizedCursor += unchangedPrefix.length;

    const isExcluded = excludedIds.has(match.id);
    const replacementText = isExcluded
      ? match.value
      : formatReplacementValue(match.category, match.value, mode, pseudonymManager);

    const sanitizedStart = sanitizedCursor;
    chunks.push(replacementText);
    sanitizedCursor += replacementText.length;

    replacements.push({
      matchId: match.id,
      category: match.category,
      originalStart: match.start,
      originalEnd: match.end,
      sanitizedStart,
      sanitizedEnd: sanitizedCursor,
      replacement: replacementText,
      excluded: isExcluded,
    });

    cursor = match.end;
  }

  const trailing = text.slice(cursor);
  if (trailing) {
    chunks.push(trailing);
  }

  return {
    sanitizedText: chunks.join(''),
    replacements,
  };
}
