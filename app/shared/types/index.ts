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
  normalizeEOL: boolean;
  viewMode: 'unified' | 'side-by-side';
  compactMode: boolean;
  wordWrap: boolean;
  tabSize: number;
  fontSize: number;
  insertSpaces: boolean;
  diffAlgorithm: 'legacy' | 'advanced';
  hideUnchangedRegions: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
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
 * アクセントカラー設定
 */
export type AccentColor = 'blue' | 'green';

/**
 * アプリケーション設定
 */
export interface AppSettings {
  theme: Theme;
  accentColor: AccentColor;
  defaultOptions: DiffOptions;
  defaultLanguage: string; // シンタックスハイライトのデフォルト言語
  defaultEOL: 'LF' | 'CRLF' | 'auto'; // デフォルト改行コード
  shortcuts: Record<string, string>;
  clipboardHistorySize: number;
  clipboardHistoryTTL: number; // ミリ秒
  autoUpdate: boolean;
  crashReport: boolean;
  devMode?: boolean; // 開発者モード（設定ファイルで有効化）
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
 * 更新情報
 */
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
  downloadedPath?: string;
}

/**
 * ダウンロード進捗情報
 */
export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
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
  SETTINGS_OPEN: 'settings:open',

  // ウィンドウ
  WINDOW_CLOSE: 'window:close',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_MAXIMIZED_CHANGED: 'window:maximized:changed',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // 表示モード
  VIEW_MODE_CHANGE: 'view:mode',
  VIEW_TOGGLE_COMPACT: 'view:toggle-compact',

  // テーマ
  THEME_CHANGED: 'theme:changed',
  THEME_GET: 'theme:get',

  // 自動更新
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_NOT_AVAILABLE: 'update:not-available',
  UPDATE_DOWNLOAD_PROGRESS: 'update:download-progress',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_INSTALL: 'update:install',
  UPDATE_ERROR: 'update:error',
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
