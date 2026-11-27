import type { FileKind } from '../../types/privacy';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB local limit
export const MAX_TEXT_LENGTH_CHARS = 1_500_000;

export interface FileValidationResult {
  valid: boolean;
  kind?: FileKind;
  error?: string;
}

export function validateSelectedFile(file: File): FileValidationResult {
  const lowerName = file.name.toLowerCase().trim();
  const isTxt = lowerName.endsWith('.txt');
  const isCsv = lowerName.endsWith('.csv');

  if (!isTxt && !isCsv) {
    return {
      valid: false,
      error: 'Unsupported file extension. Only .txt and .csv files are accepted.',
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty. Provide a document with text content.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File exceeds the 5 MB browser processing limit.',
    };
  }

  return {
    valid: true,
    kind: isCsv ? 'csv' : 'text',
  };
}

export function validateTextContent(text: string): string | null {
  if (text.length > MAX_TEXT_LENGTH_CHARS) {
    return 'Document exceeds the 1,500,000 character browser safety limit.';
  }
  if (text.includes('\u0000')) {
    return 'Binary or null-byte content detected. Upload plain UTF-8 text or CSV.';
  }
  return null;
}
