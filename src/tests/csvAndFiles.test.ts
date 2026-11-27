import { describe, expect, it } from 'vitest';
import { parseCsv, serializeCsv } from '../engine/parsing/csvParser';
import { MAX_FILE_SIZE_BYTES, validateSelectedFile } from '../engine/parsing/fileValidation';
import { processCsvDocument, processTextDocument } from '../engine/pipeline';
import { buildSanitizedFileName } from '../utils/download';

describe('TXT & RFC 4180 CSV Parsing, Validation, and Export', () => {
  it('parses quoted CSV fields, commas inside quotes, escaped double quotes, multiline cells, and UTF-8 BOM', () => {
    const csv =
      '\uFEFFName,Email,Notes\n"Kulkarni, Aarav",shivam@example.com,"Escaped ""quote"",\nline2 call 9876543210"\n';
    const parsed = parseCsv(csv);

    expect(parsed.error).toBeUndefined();
    expect(parsed.rows).toEqual([
      ['Name', 'Email', 'Notes'],
      ['Kulkarni, Aarav', 'shivam@example.com', 'Escaped "quote",\nline2 call 9876543210'],
    ]);

    const processed = processCsvDocument(csv, 'FULL_MASK', [], true);
    expect(processed.parseError).toBeUndefined();
    expect(processed.csvHeaders).toEqual(['Name', 'Email', 'Notes']);
    expect(processed.sanitizedCsvRows?.[1][2]).toBe('Escaped "quote",\nline2 call [REDACTED]');
  });

  it('sanitizes CSV cells while preserving headers, structure, and RFC 4180 escaping', () => {
    const csv = [
      'Customer,Email,Contact,PAN',
      '"Doe, Jane",shivam@example.com,"Primary, 9876543210",ABCDE1234F',
      '"Smith, Bob",shivam@example.com,"Secondary, +91 98765 43210",ABCDE1234F',
    ].join('\n');

    const res = processCsvDocument(csv, 'PSEUDONYM', [], true);

    expect(res.parseError).toBeUndefined();
    expect(res.csvHeaders).toEqual(['Customer', 'Email', 'Contact', 'PAN']);
    expect(res.sanitizedCsvRows?.[0]).toEqual(['Customer', 'Email', 'Contact', 'PAN']);
    expect(res.sanitizedCsvRows?.[1]).toEqual([
      'Doe, Jane',
      'USER_01',
      'Primary, PHONE_01',
      'PAN_01',
    ]);
    expect(res.sanitizedCsvRows?.[2][1]).toBe('USER_01');
    expect(res.sanitizedCsvRows?.[2][3]).toBe('PAN_01');

    // Re-parsing exported CSV confirms valid RFC 4180 round-trip
    const roundTrip = parseCsv(res.sanitizedText);
    expect(roundTrip.error).toBeUndefined();
    expect(roundTrip.rows).toHaveLength(3);
  });

  it('preserves line breaks in TXT processing and generates proper export filenames', () => {
    const txt = 'Line 1: shivam@example.com\nLine 2: 192.168.1.45\nLine 3: clean';
    const res = processTextDocument(txt, 'FULL_MASK');

    expect(res.sanitizedText).toBe('Line 1: [REDACTED]\nLine 2: [REDACTED]\nLine 3: clean');
    expect(buildSanitizedFileName('incident-log.txt', 'text')).toBe('incident-log-sanitized.txt');
    expect(buildSanitizedFileName('users.csv', 'csv')).toBe('users-sanitized.csv');
    expect(serializeCsv([['a,b', 'plain']])).toBe('"a,b",plain');
  });

  it('rejects unsupported file extensions, empty files, oversized files, and malformed CSV', () => {
    const badExt = new File(['hello'], 'payload.exe', { type: 'application/octet-stream' });
    expect(validateSelectedFile(badExt).valid).toBe(false);

    const emptyTxt = new File([], 'empty.txt', { type: 'text/plain' });
    expect(validateSelectedFile(emptyTxt).valid).toBe(false);

    const bigFile = new File(['x'], 'huge.txt', { type: 'text/plain' });
    Object.defineProperty(bigFile, 'size', { value: MAX_FILE_SIZE_BYTES + 10 });
    expect(validateSelectedFile(bigFile).valid).toBe(false);

    const malformedCsv = processCsvDocument('Name,Email\n"Unclosed quote,shivam@example.com', 'FULL_MASK');
    expect(malformedCsv.parseError).toBeDefined();
  });
});
