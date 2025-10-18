/**
 * 差分対象バッファの型定義
 */
export interface Buffer {
  id: string;
  content: string;
  lang?: string; // 推定言語
  eol: 'LF' | 'CRLF' | 'auto';
}

/**
 * 差分オプション
 */
export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  normalizeEOL: boolean;
  viewMode: 'unified' | 'side-by-side';
  wordWrap: boolean;
  tabSize: number;
  fontSize: number;
}

/**
 * 差分統計
 */
export interface DiffStats {
  adds: number;
  dels: number;
  hunks: number;
  leftLines: number;
  rightLines: number;
}

/**
 * 差分セッション（タブ）
 */
export interface DiffSession {
  id: string;
  left: Buffer;
  right: Buffer;
  options: DiffOptions;
  stats?: DiffStats;
  createdAt: number;
  updatedAt: number;
}

/**
 * テーマ設定
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * アプリケーション設定
 */
export interface AppSettings {
  theme: Theme;
  defaultOptions: DiffOptions;
  shortcuts: Record<string, string>;
  clipboardHistorySize: number;
  clipboardHistoryTTL: number; // ミリ秒
  autoUpdate: boolean;
  crashReport: boolean;
}

/**
 * クリップボード履歴アイテム
 */
export interface ClipboardHistoryItem {
  id: string;
  content: string;
  timestamp: number;
  preview: string; // 最初の100文字程度
}

/**
 * IPC通信チャンネル定義
 */
export const IPC_CHANNELS = {
  // クリップボード
  CLIPBOARD_READ: 'clipboard:read',
  CLIPBOARD_WRITE: 'clipboard:write',
  CLIPBOARD_HISTORY_GET: 'clipboard:history:get',
  CLIPBOARD_HISTORY_ADD: 'clipboard:history:add',

  // ファイル操作
  FILE_SAVE: 'file:save',
  FILE_OPEN: 'file:open',

  // 設定
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // ウィンドウ
  WINDOW_CLOSE: 'window:close',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_MAXIMIZED_CHANGED: 'window:maximized:changed',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // テーマ
  THEME_CHANGED: 'theme:changed',
  THEME_GET: 'theme:get',
} as const;

/**
 * エクスポート形式
 */
export type ExportFormat = 'unified-diff' | 'stats';

/**
 * エクスポートオプション
 */
export interface ExportOptions {
  format: ExportFormat;
  includeStats?: boolean;
  contextLines?: number;
}
