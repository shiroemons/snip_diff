import * as monaco from 'monaco-editor';

/**
 * Diffエディタ用のコンパクトテーマを定義
 * - 行背景を削除（透明化）
 * - カスタムデコレーションによる文字レベルのハイライトのみを使用
 */
export const defineCompactThemes = (): void => {
  // ダークテーマ - 透明な背景で視認性を向上
  monaco.editor.defineTheme('compact-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      // 文字レベルの差分ハイライト（完全に透明 - カスタムデコレーションのみ使用）
      'diffEditor.insertedTextBackground': '#00000000',
      'diffEditor.removedTextBackground': '#00000000',

      // 行レベルの背景（完全に透明）
      'diffEditor.insertedLineBackground': '#00000000',
      'diffEditor.removedLineBackground': '#00000000',

      // Gutterの背景（透明）
      'diffEditorGutter.insertedLineBackground': '#00000000',
      'diffEditorGutter.removedLineBackground': '#00000000',

      // Overview ruler（透明）
      'diffEditorOverview.insertedForeground': '#00000000',
      'diffEditorOverview.removedForeground': '#00000000',

      // その他の境界線（透明）
      'diffEditor.border': '#00000000',
      'diffEditor.diagonalFill': '#00000000',
    },
  });

  // ライトテーマ - 明確な色設定
  monaco.editor.defineTheme('compact-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      // 文字レベルの差分ハイライト（完全に透明 - カスタムデコレーションのみ使用）
      'diffEditor.insertedTextBackground': '#00000000',
      'diffEditor.removedTextBackground': '#00000000',

      // 行レベルの背景（完全に透明）
      'diffEditor.insertedLineBackground': '#00000000',
      'diffEditor.removedLineBackground': '#00000000',

      // Gutterの背景（透明）
      'diffEditorGutter.insertedLineBackground': '#00000000',
      'diffEditorGutter.removedLineBackground': '#00000000',

      // Overview ruler（透明）
      'diffEditorOverview.insertedForeground': '#00000000',
      'diffEditorOverview.removedForeground': '#00000000',

      // その他の境界線（透明）
      'diffEditor.border': '#00000000',
      'diffEditor.diagonalFill': '#00000000',
    },
  });
};

/**
 * compactModeとテーマ設定に基づいてテーマ名を取得
 * @param compactMode - Compactモードが有効かどうか
 * @param theme - テーマ設定 ('light' | 'dark')
 * @returns Monaco エディタのテーマ名
 */
export const getThemeName = (compactMode: boolean, theme: 'light' | 'dark'): string => {
  if (compactMode) {
    return theme === 'light' ? 'compact-light' : 'compact-dark';
  }
  return theme === 'light' ? 'vs' : 'vs-dark';
};
