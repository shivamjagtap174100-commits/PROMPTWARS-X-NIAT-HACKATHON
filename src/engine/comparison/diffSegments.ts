import type {
  DetectionMatch,
  DiffSegment,
  RedactedReplacement,
} from '../../types/privacy';

export function buildDiffSegments(
  originalText: string,
  sanitizedText: string,
  matches: DetectionMatch[],
  replacements: RedactedReplacement[]
): { originalSegments: DiffSegment[]; sanitizedSegments: DiffSegment[] } {
  const originalSegments: DiffSegment[] = [];
  const sanitizedSegments: DiffSegment[] = [];

  if (!originalText) {
    return { originalSegments, sanitizedSegments };
  }

  const replacementMap = new Map(replacements.map((r) => [r.matchId, r]));
  const orderedMatches = [...matches].sort((a, b) => a.start - b.start);

  let origCursor = 0;
  for (const match of orderedMatches) {
    if (match.start < origCursor) continue;
    if (match.start > origCursor) {
      originalSegments.push({
        text: originalText.slice(origCursor, match.start),
        isEntity: false,
      });
    }
    const rep = replacementMap.get(match.id);
    originalSegments.push({
      text: originalText.slice(match.start, match.end),
      isEntity: true,
      category: match.category,
      matchId: match.id,
      excluded: rep?.excluded ?? false,
    });
    origCursor = match.end;
  }
  if (origCursor < originalText.length) {
    originalSegments.push({
      text: originalText.slice(origCursor),
      isEntity: false,
    });
  }

  let sanCursor = 0;
  const orderedReps = [...replacements].sort((a, b) => a.sanitizedStart - b.sanitizedStart);
  for (const rep of orderedReps) {
    if (rep.sanitizedStart < sanCursor) continue;
    if (rep.sanitizedStart > sanCursor) {
      sanitizedSegments.push({
        text: sanitizedText.slice(sanCursor, rep.sanitizedStart),
        isEntity: false,
      });
    }
    sanitizedSegments.push({
      text: sanitizedText.slice(rep.sanitizedStart, rep.sanitizedEnd),
      isEntity: true,
      category: rep.category,
      matchId: rep.matchId,
      excluded: rep.excluded,
    });
    sanCursor = rep.sanitizedEnd;
  }
  if (sanCursor < sanitizedText.length) {
    sanitizedSegments.push({
      text: sanitizedText.slice(sanCursor),
      isEntity: false,
    });
  }

  return { originalSegments, sanitizedSegments };
}
