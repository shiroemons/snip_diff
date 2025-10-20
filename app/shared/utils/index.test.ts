import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectEOL,
  normalizeText,
  generatePreview,
  countLines,
  calculateSimpleStats,
  sanitizeFilename,
  formatTimestamp,
  createBuffer,
  generateId,
  debounce,
} from './index';

describe('detectEOL', () => {
  it('should detect LF', () => {
    expect(detectEOL('line1\nline2\nline3')).toBe('LF');
  });

  it('should detect CRLF', () => {
    expect(detectEOL('line1\r\nline2\r\nline3')).toBe('CRLF');
  });

  it('should return LF when no line breaks exist', () => {
    expect(detectEOL('single line')).toBe('LF');
  });

  it('should detect CRLF when CRLF count is greater than LF', () => {
    expect(detectEOL('line1\r\nline2\r\nline3\n')).toBe('CRLF');
  });

  it('should detect LF when LF count is greater than CRLF', () => {
    expect(detectEOL('line1\nline2\nline3\r\n')).toBe('LF');
  });
});

describe('normalizeText', () => {
  it('should normalize EOL when normalizeEOL is true', () => {
    const text = 'line1\r\nline2\r\nline3';
    const result = normalizeText(text, { normalizeEOL: true });
    expect(result).toBe('line1\nline2\nline3');
  });

  it('should remove trailing whitespace when ignoreWhitespace is true', () => {
    const text = 'line1  \nline2\t\nline3   ';
    const result = normalizeText(text, { ignoreWhitespace: true });
    expect(result).toBe('line1\nline2\nline3');
  });

  it('should apply both options when both are true', () => {
    const text = 'line1  \r\nline2\t\r\nline3   ';
    const result = normalizeText(text, { normalizeEOL: true, ignoreWhitespace: true });
    expect(result).toBe('line1\nline2\nline3');
  });

  it('should not modify text when no options are enabled', () => {
    const text = 'line1  \r\nline2\t';
    const result = normalizeText(text, {});
    expect(result).toBe(text);
  });
});

describe('generatePreview', () => {
  it('should return full text when shorter than maxLength', () => {
    const text = 'Short text';
    expect(generatePreview(text, 100)).toBe('Short text');
  });

  it('should truncate text when longer than maxLength', () => {
    const text = 'a'.repeat(150);
    const result = generatePreview(text, 100);
    expect(result).toBe('a'.repeat(100) + '...');
  });

  it('should normalize whitespace', () => {
    const text = '  multiple   spaces  \n  and\tnewlines  ';
    const result = generatePreview(text, 100);
    expect(result).toBe('multiple spaces and newlines');
  });

  it('should handle empty string', () => {
    expect(generatePreview('', 100)).toBe('');
  });

  it('should use default maxLength of 100', () => {
    const text = 'a'.repeat(150);
    const result = generatePreview(text);
    expect(result).toBe('a'.repeat(100) + '...');
  });
});

describe('countLines', () => {
  it('should count lines with LF', () => {
    expect(countLines('line1\nline2\nline3')).toBe(3);
  });

  it('should count lines with CRLF', () => {
    expect(countLines('line1\r\nline2\r\nline3')).toBe(3);
  });

  it('should count lines with CR', () => {
    expect(countLines('line1\rline2\rline3')).toBe(3);
  });

  it('should return 0 for empty string', () => {
    expect(countLines('')).toBe(0);
  });

  it('should return 1 for single line without newline', () => {
    expect(countLines('single line')).toBe(1);
  });

  it('should count trailing newline as separate line', () => {
    expect(countLines('line1\nline2\n')).toBe(3);
  });
});

describe('calculateSimpleStats', () => {
  it('should calculate additions when right has more lines', () => {
    const left = 'line1\nline2';
    const right = 'line1\nline2\nline3\nline4';
    const stats = calculateSimpleStats(left, right);
    expect(stats.adds).toBe(2);
    expect(stats.dels).toBe(0);
    expect(stats.leftLines).toBe(2);
    expect(stats.rightLines).toBe(4);
  });

  it('should calculate deletions when left has more lines', () => {
    const left = 'line1\nline2\nline3\nline4';
    const right = 'line1\nline2';
    const stats = calculateSimpleStats(left, right);
    expect(stats.adds).toBe(0);
    expect(stats.dels).toBe(2);
    expect(stats.leftLines).toBe(4);
    expect(stats.rightLines).toBe(2);
  });

  it('should return zero adds/dels when line counts are equal', () => {
    const left = 'line1\nline2\nline3';
    const right = 'lineA\nlineB\nlineC';
    const stats = calculateSimpleStats(left, right);
    expect(stats.adds).toBe(0);
    expect(stats.dels).toBe(0);
    expect(stats.leftLines).toBe(3);
    expect(stats.rightLines).toBe(3);
  });

  it('should handle empty strings', () => {
    const stats = calculateSimpleStats('', '');
    expect(stats.adds).toBe(0);
    expect(stats.dels).toBe(0);
    expect(stats.leftLines).toBe(0);
    expect(stats.rightLines).toBe(0);
  });

  it('should always set hunks to 1', () => {
    const stats = calculateSimpleStats('line1', 'line2');
    expect(stats.hunks).toBe(1);
  });
});

describe('sanitizeFilename', () => {
  it('should replace special characters with underscores', () => {
    expect(sanitizeFilename('file@name#test.txt')).toBe('file_name_test.txt');
  });

  it('should keep alphanumeric, hyphens, underscores, and dots', () => {
    expect(sanitizeFilename('valid-file_name123.txt')).toBe('valid-file_name123.txt');
  });

  it('should replace spaces with underscores', () => {
    expect(sanitizeFilename('my file name.txt')).toBe('my_file_name.txt');
  });

  it('should handle empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });

  it('should replace multiple special characters', () => {
    expect(sanitizeFilename('file/name\\with:many*chars?.txt')).toBe('file_name_with_many_chars_.txt');
  });
});

describe('formatTimestamp', () => {
  it('should format timestamp in Japanese locale', () => {
    const timestamp = new Date('2025-01-15T10:30:45').getTime();
    const formatted = formatTimestamp(timestamp);
    // The exact format may vary by environment, so we check for key components
    expect(formatted).toMatch(/2025/);
    expect(formatted).toMatch(/01/);
    expect(formatted).toMatch(/15/);
  });

  it('should handle Unix epoch', () => {
    const formatted = formatTimestamp(0);
    expect(formatted).toBeTruthy();
  });

  it('should handle current time', () => {
    const now = Date.now();
    const formatted = formatTimestamp(now);
    expect(formatted).toBeTruthy();
  });
});

describe('createBuffer', () => {
  it('should create buffer with default language', () => {
    const buffer = createBuffer('test content');
    expect(buffer.content).toBe('test content');
    expect(buffer.lang).toBe('plaintext');
    expect(buffer.id).toBeTruthy();
    expect(buffer.eol).toBe('LF');
  });

  it('should create buffer with specified language', () => {
    const buffer = createBuffer('const x = 1;', 'typescript');
    expect(buffer.content).toBe('const x = 1;');
    expect(buffer.lang).toBe('typescript');
  });

  it('should detect CRLF in content', () => {
    const buffer = createBuffer('line1\r\nline2\r\nline3');
    expect(buffer.eol).toBe('CRLF');
  });

  it('should detect LF in content', () => {
    const buffer = createBuffer('line1\nline2\nline3');
    expect(buffer.eol).toBe('LF');
  });

  it('should generate unique IDs', () => {
    const buffer1 = createBuffer('test1');
    const buffer2 = createBuffer('test2');
    expect(buffer1.id).not.toBe(buffer2.id);
  });
});

describe('generateId', () => {
  it('should generate a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should contain timestamp and random part', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous timeout on subsequent calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2', 123);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should use the most recent arguments', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(50);
    debouncedFn('second');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('should work with multiple invocations after timeout', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('first');

    debouncedFn('second');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('should handle zero wait time', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 0);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
