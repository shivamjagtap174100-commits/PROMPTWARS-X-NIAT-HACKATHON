import { serializeCsv } from '../engine/parsing/csvParser';
import type { FileKind } from '../types/privacy';

export interface DownloadResult {
  ok: boolean;
  fileName: string;
  error?: string;
}

export function buildSanitizedFileName(
  originalName: string | null,
  targetKind: FileKind
): string {
  const ext = targetKind === 'csv' ? 'csv' : 'txt';
  if (!originalName) {
    return `sanitized-document.${ext}`;
  }
  const dotIdx = originalName.lastIndexOf('.');
  const base = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
  return `${safeBase}-sanitized.${ext}`;
}

/**
 * Converts sanitized plain text into a valid RFC 4180 CSV when exporting a text document as CSV.
 */
export function convertSanitizedTextToCsv(sanitizedText: string): string {
  const lines = sanitizedText.split(/\r?\n/);
  const rows: string[][] = [['Line', 'Sanitized_Content']];
  lines.forEach((line, index) => {
    rows.push([String(index + 1), line]);
  });
  return serializeCsv(rows, '\n');
}

export function downloadLocalFile(
  content: string,
  fileName: string,
  fileKind: FileKind
): DownloadResult {
  try {
    const mimeType =
      fileKind === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, fileName };
  } catch {
    return {
      ok: false,
      fileName,
      error: 'Unable to initiate local file download in this browser environment.',
    };
  }
}

export async function copyToClipboardSafe(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy textarea fallback
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
