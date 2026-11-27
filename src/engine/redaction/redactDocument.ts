import type {
  CustomLabelsMap,
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
  pseudonymManager: PseudonymizationManager,
  customLabels?: CustomLabelsMap
): RedactOutput {
  if (!text || matches.length === 0) {
    return { sanitizedText: text, replacements: [] };
  }

  const ordered = [...matches].sort((a, b) => a.start - b.start);
  const replacements: RedactedReplacement[] = [];
  let cursor = 0;
  let sanitizedCursor = 0;
  const chunks: string[] = [];
  let lastWasRemoved = false;

  for (const match of ordered) {
    if (match.start < cursor) {
      continue;
    }

    let unchangedPrefix = text.slice(cursor, match.start);
    if (mode === 'REMOVE' && lastWasRemoved && unchangedPrefix.startsWith(' ')) {
      const prevChunk = chunks[chunks.length - 1] ?? '';
      if (prevChunk.endsWith(' ') || prevChunk === '' || prevChunk.endsWith('\n')) {
        unchangedPrefix = unchangedPrefix.slice(1);
      }
    }

    if (
      mode === 'REMOVE' &&
      !excludedIds.has(match.id) &&
      unchangedPrefix.endsWith(' ') &&
      (text[match.end] === ' ' ||
        text[match.end] === '.' ||
        text[match.end] === ',' ||
        text[match.end] === undefined)
    ) {
      unchangedPrefix = unchangedPrefix.slice(0, -1);
    }

    chunks.push(unchangedPrefix);
    sanitizedCursor += unchangedPrefix.length;

    const isExcluded = excludedIds.has(match.id);
    const replacementText = isExcluded
      ? match.value
      : formatReplacementValue(
        match.category,
        match.value,
        mode,
        pseudonymManager,
        customLabels,
        match.customReplacementLabel
      );

    const sanitizedStart = sanitizedCursor;
    chunks.push(replacementText);
    sanitizedCursor += replacementText.length;
    lastWasRemoved = mode === 'REMOVE' && !isExcluded;

    replacements.push({
      matchId: match.id,
      category: match.category,
      entityType: match.entityType,
      originalStart: match.start,
      originalEnd: match.end,
      sanitizedStart,
      sanitizedEnd: sanitizedCursor,
      replacement: replacementText,
      excluded: isExcluded,
    });

    cursor = match.end;
  }

  let trailing = text.slice(cursor);
  if (mode === 'REMOVE' && lastWasRemoved && trailing.startsWith(' ')) {
    const joinedSoFar = chunks.join('');
    if (!joinedSoFar || joinedSoFar.endsWith(' ') || joinedSoFar.endsWith('\n')) {
      trailing = trailing.slice(1);
    }
  }
  if (trailing) {
    chunks.push(trailing);
  }

  return {
    sanitizedText: chunks.join(''),
    replacements,
  };
}
