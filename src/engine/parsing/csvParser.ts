export interface ParsedCsv {
  rows: string[][];
  newline: '\r\n' | '\n';
  error?: string;
}

/**
 * RFC 4180 compliant state-machine CSV parser.
 * Supports quoted fields, embedded commas, escaped double quotes (""), and multiline quoted cells.
 * Never splits blindly on commas.
 */
export function parseCsv(rawInput: string): ParsedCsv {
  const input = rawInput.startsWith('\uFEFF') ? rawInput.slice(1) : rawInput;
  const newline: '\r\n' | '\n' = input.includes('\r\n') ? '\r\n' : '\n';
  if (!input) {
    return { rows: [], newline };
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let fieldStartedQuoted = false;
  let justClosedQuote = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = input[i + 1];
        if (next === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else {
        currentField += ch;
      }
      continue;
    }

    if (justClosedQuote) {
      if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
        fieldStartedQuoted = false;
        justClosedQuote = false;
        continue;
      }
      if (ch === '\r') {
        if (input[i + 1] === '\n') {
          i += 1;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        fieldStartedQuoted = false;
        justClosedQuote = false;
        continue;
      }
      if (ch === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        fieldStartedQuoted = false;
        justClosedQuote = false;
        continue;
      }
      return {
        rows: [],
        newline,
        error: `Malformed CSV syntax near row ${rows.length + 1}: unexpected character after closing quote.`,
      };
    }

    if (ch === '"') {
      if (currentField.length === 0 && !fieldStartedQuoted) {
        inQuotes = true;
        fieldStartedQuoted = true;
      } else {
        return {
          rows: [],
          newline,
          error: `Malformed CSV syntax near row ${rows.length + 1}: unescaped quote inside unquoted field.`,
        };
      }
      continue;
    }

    if (ch === ',') {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if (ch === '\r') {
      if (input[i + 1] === '\n') {
        i += 1;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      continue;
    }

    if (ch === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      continue;
    }

    currentField += ch;
  }

  if (inQuotes) {
    return {
      rows: [],
      newline,
      error: 'Malformed CSV syntax: unclosed quoted field at end of file.',
    };
  }

  // Push final field/row unless trailing newline left an empty trailing row
  if (currentField.length > 0 || currentRow.length > 0 || fieldStartedQuoted) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return { rows, newline };
}

/**
 * Escapes a single CSV cell per RFC 4180 when exporting sanitized CSV output.
 */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Serializes rows back into valid RFC 4180 CSV format.
 */
export function serializeCsv(rows: string[][], newline: '\r\n' | '\n' = '\n'): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join(newline);
}
