import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineCompactThemes, getThemeName } from './compactThemes';

// Monaco Editorのモック
const mockDefineTheme = vi.fn();

vi.mock('monaco-editor', () => ({
  default: {
    editor: {
      defineTheme: mockDefineTheme,
    },
  },
  editor: {
    defineTheme: mockDefineTheme,
  },
}));

describe('compactThemes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('defineCompactThemes', () => {
    it('should define compact-dark theme', () => {
      defineCompactThemes();

      expect(mockDefineTheme).toHaveBeenCalledWith(
        'compact-dark',
        expect.objectContaining({
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: expect.objectContaining({
            'diffEditor.insertedTextBackground': '#00000000',
            'diffEditor.removedTextBackground': '#00000000',
            'diffEditor.insertedLineBackground': '#00000000',
            'diffEditor.removedLineBackground': '#00000000',
          }),
        }),
      );
    });

    it('should define compact-light theme', () => {
      defineCompactThemes();

      expect(mockDefineTheme).toHaveBeenCalledWith(
        'compact-light',
        expect.objectContaining({
          base: 'vs',
          inherit: true,
          rules: [],
          colors: expect.objectContaining({
            'diffEditor.insertedTextBackground': '#00000000',
            'diffEditor.removedTextBackground': '#00000000',
            'diffEditor.insertedLineBackground': '#00000000',
            'diffEditor.removedLineBackground': '#00000000',
          }),
        }),
      );
    });

    it('should call defineTheme twice (for both themes)', () => {
      defineCompactThemes();

      expect(mockDefineTheme).toHaveBeenCalledTimes(2);
    });

    it('should set all diff backgrounds to transparent', () => {
      defineCompactThemes();

      // compact-dark テーマの色設定を取得
      const darkThemeCall = (mockDefineTheme as any).mock.calls.find(
        (call: any[]) => call[0] === 'compact-dark',
      );
      const darkColors = darkThemeCall[1].colors;

      // compact-light テーマの色設定を取得
      const lightThemeCall = (mockDefineTheme as any).mock.calls.find(
        (call: any[]) => call[0] === 'compact-light',
      );
      const lightColors = lightThemeCall[1].colors;

      // すべての背景色が透明 (#00000000) であることを確認
      const transparentKeys = [
        'diffEditor.insertedTextBackground',
        'diffEditor.removedTextBackground',
        'diffEditor.insertedLineBackground',
        'diffEditor.removedLineBackground',
        'diffEditorGutter.insertedLineBackground',
        'diffEditorGutter.removedLineBackground',
        'diffEditorOverview.insertedForeground',
        'diffEditorOverview.removedForeground',
        'diffEditor.border',
        'diffEditor.diagonalFill',
      ];

      transparentKeys.forEach((key) => {
        expect(darkColors[key]).toBe('#00000000');
        expect(lightColors[key]).toBe('#00000000');
      });
    });
  });

  describe('getThemeName', () => {
    it('should return "compact-dark" when compactMode is true and theme is dark', () => {
      const result = getThemeName(true, 'dark');
      expect(result).toBe('compact-dark');
    });

    it('should return "compact-light" when compactMode is true and theme is light', () => {
      const result = getThemeName(true, 'light');
      expect(result).toBe('compact-light');
    });

    it('should return "vs-dark" when compactMode is false and theme is dark', () => {
      const result = getThemeName(false, 'dark');
      expect(result).toBe('vs-dark');
    });

    it('should return "vs" when compactMode is false and theme is light', () => {
      const result = getThemeName(false, 'light');
      expect(result).toBe('vs');
    });

    it('should handle all combinations correctly', () => {
      const cases: Array<[boolean, 'light' | 'dark', string]> = [
        [true, 'light', 'compact-light'],
        [true, 'dark', 'compact-dark'],
        [false, 'light', 'vs'],
        [false, 'dark', 'vs-dark'],
      ];

      cases.forEach(([compactMode, theme, expected]) => {
        expect(getThemeName(compactMode, theme)).toBe(expected);
      });
    });
  });
});
