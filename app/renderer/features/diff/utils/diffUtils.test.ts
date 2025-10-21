import { describe, it, expect, vi } from 'vitest';
import { getTextFromModel, splitRangeToSingleLine } from './diffUtils';

// Monaco Editorの型定義（モック用）
interface ITextModel {
  getValueInRange: (range: unknown) => string;
  getLineMaxColumn: (lineNumber: number) => number;
}

class MockRange {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number,
  ) {}
}

// Monaco Editorのモック
vi.mock('monaco-editor', () => ({
  default: {},
  editor: {},
  languages: {},
  Range: MockRange,
  Position: class MockPosition {
    constructor(public lineNumber: number, public column: number) {}
  },
}));

describe('diffUtils', () => {
  describe('getTextFromModel', () => {
    it('should return empty string when model is null', () => {
      const result = getTextFromModel(null, 1, 1, 1, 10);
      expect(result).toBe('');
    });

    it('should return empty string when startLine is invalid (<=0)', () => {
      const mockModel = {
        getValueInRange: vi.fn(),
      } as unknown as ITextModel;

      const result = getTextFromModel(mockModel, 0, 1, 1, 10);
      expect(result).toBe('');
      expect(mockModel.getValueInRange).not.toHaveBeenCalled();
    });

    it('should return empty string when startColumn is invalid (<=0)', () => {
      const mockModel = {
        getValueInRange: vi.fn(),
      } as unknown as ITextModel;

      const result = getTextFromModel(mockModel, 1, 0, 1, 10);
      expect(result).toBe('');
      expect(mockModel.getValueInRange).not.toHaveBeenCalled();
    });

    it('should return empty string when endLine is invalid (<=0)', () => {
      const mockModel = {
        getValueInRange: vi.fn(),
      } as unknown as ITextModel;

      const result = getTextFromModel(mockModel, 1, 1, 0, 10);
      expect(result).toBe('');
      expect(mockModel.getValueInRange).not.toHaveBeenCalled();
    });

    it('should return empty string when endColumn is invalid (<=0)', () => {
      const mockModel = {
        getValueInRange: vi.fn(),
      } as unknown as ITextModel;

      const result = getTextFromModel(mockModel, 1, 1, 1, 0);
      expect(result).toBe('');
      expect(mockModel.getValueInRange).not.toHaveBeenCalled();
    });

    it('should return text from valid range', () => {
      const mockModel = {
        getValueInRange: vi.fn().mockReturnValue('test text'),
      } as unknown as ITextModel;

      const result = getTextFromModel(mockModel, 1, 1, 1, 10);
      expect(result).toBe('test text');
      expect(mockModel.getValueInRange).toHaveBeenCalled();
    });
  });

  describe('splitRangeToSingleLine', () => {
    it('should return empty array when range is empty (same position)', () => {
      const mockModel = {
        getLineMaxColumn: vi.fn(),
      } as unknown as ITextModel;

      const range = new MockRange(1, 5, 1, 5) as unknown as any;
      const result = splitRangeToSingleLine(mockModel as any, range);

      expect(result).toEqual([]);
      expect(mockModel.getLineMaxColumn).not.toHaveBeenCalled();
    });

    it('should return single range when range is on same line', () => {
      const mockModel = {
        getLineMaxColumn: vi.fn(),
      } as unknown as ITextModel;

      const range = new MockRange(1, 5, 1, 10) as unknown as any;
      const result = splitRangeToSingleLine(mockModel as any, range);

      expect(result).toHaveLength(1);
      expect(mockModel.getLineMaxColumn).not.toHaveBeenCalled();
    });

    it('should split multi-line range into single-line ranges', () => {
      const mockModel = {
        getLineMaxColumn: vi.fn((line: number) => {
          // Mock line lengths: line 1 = 20, line 2 = 30, line 3 = 25
          const lineLengths: Record<number, number> = { 1: 20, 2: 30, 3: 25 };
          return lineLengths[line] || 1;
        }),
      } as unknown as ITextModel;

      const range = new MockRange(1, 5, 3, 10) as unknown as any;
      const result = splitRangeToSingleLine(mockModel as any, range);

      expect(result).toHaveLength(3);
      expect(result[0].startLineNumber).toBe(1);
      expect(result[0].startColumn).toBe(5);
      expect(result[0].endLineNumber).toBe(1);
      expect(result[0].endColumn).toBe(20);
      expect(result[1].startLineNumber).toBe(2);
      expect(result[1].startColumn).toBe(1);
      expect(result[1].endLineNumber).toBe(2);
      expect(result[1].endColumn).toBe(30);
      expect(result[2].startLineNumber).toBe(3);
      expect(result[2].startColumn).toBe(1);
      expect(result[2].endLineNumber).toBe(3);
      expect(result[2].endColumn).toBe(10);
    });

    it('should skip empty lines (where startColumn === endColumn)', () => {
      const mockModel = {
        getLineMaxColumn: vi.fn((line: number) => {
          // Mock: line 2 is empty (maxColumn = 1)
          return line === 2 ? 1 : 20;
        }),
      } as unknown as ITextModel;

      const range = new MockRange(1, 5, 3, 10) as unknown as any;
      const result = splitRangeToSingleLine(mockModel as any, range);

      expect(result).toHaveLength(2);
      expect(result[0].startLineNumber).toBe(1);
      expect(result[0].endColumn).toBe(20);
      expect(result[1].startLineNumber).toBe(3);
      expect(result[1].endColumn).toBe(10);
    });

    it('should handle range spanning two lines', () => {
      const mockModel = {
        getLineMaxColumn: vi.fn(() => 50),
      } as unknown as ITextModel;

      const range = new MockRange(2, 10, 3, 15) as unknown as any;
      const result = splitRangeToSingleLine(mockModel as any, range);

      expect(result).toHaveLength(2);
      expect(result[0].startLineNumber).toBe(2);
      expect(result[0].startColumn).toBe(10);
      expect(result[0].endColumn).toBe(50);
      expect(result[1].startLineNumber).toBe(3);
      expect(result[1].endColumn).toBe(15);
    });
  });
});
