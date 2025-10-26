/**
 * Test data for E2E tests
 */

export const TEST_TEXT = {
  SIMPLE_LEFT: 'Hello World\nThis is a test',
  SIMPLE_RIGHT: 'Hello World\nThis is a test with changes',

  MULTILINE_LEFT: `Line 1
Line 2
Line 3
Line 4
Line 5`,

  MULTILINE_RIGHT: `Line 1
Line 2 modified
Line 3
Line 4 changed
Line 5`,

  LARGE_TEXT_LEFT: Array(100)
    .fill(0)
    .map((_, i) => `Line ${i + 1}: Original content`)
    .join('\n'),

  LARGE_TEXT_RIGHT: Array(100)
    .fill(0)
    .map((_, i) => `Line ${i + 1}: ${i % 3 === 0 ? 'Modified' : 'Original'} content`)
    .join('\n'),

  EMPTY: '',

  WHITESPACE_DIFF_LEFT: 'Hello   World',
  WHITESPACE_DIFF_RIGHT: 'Hello World',

  CASE_DIFF_LEFT: 'Hello World',
  CASE_DIFF_RIGHT: 'hello world',
};

export const KEYBOARD_SHORTCUTS = {
  CLEAR: 'Meta+k', // ⌘K
  SWAP: 'Meta+Shift+k', // ⌘⇧K
  MODE_INLINE: 'Meta+1', // ⌘1
  MODE_SIDE_BY_SIDE: 'Meta+2', // ⌘2
  PASTE_LEFT: 'Meta+v', // ⌘V
  PASTE_RIGHT: 'Meta+Shift+v', // ⌘⇧V
};

export const SELECTORS = {
  // Header
  HEADER: 'header',
  TITLE: 'header h1',
  THEME_TOGGLE: '[aria-label*="theme"]',
  SETTINGS_BUTTON: '[aria-label*="settings"], [aria-label*="設定"]',
  RENDER_WHITESPACE_SELECT: 'select:near(:text("空白文字の表示"))',
  WINDOW_CONTROLS: {
    MINIMIZE: '[aria-label*="minimize"], [aria-label*="最小化"]',
    MAXIMIZE: '[aria-label*="maximize"], [aria-label*="最大化"]',
    CLOSE: '[aria-label*="close"], [aria-label*="閉じる"]',
  },

  // Diff Editor
  DIFF_EDITOR: '.diff-editor-container',
  MONACO_EDITOR: '.monaco-editor',
  LEFT_EDITOR: '.original-editor',
  RIGHT_EDITOR: '.modified-editor',

  // Controls
  CLEAR_BUTTON: '[aria-label*="clear"], [aria-label*="クリア"], button:has-text("Clear")',
  SWAP_BUTTON: '[aria-label*="swap"], [aria-label*="入れ替え"], button:has-text("Swap")',
  MODE_TOGGLE: '.view-mode-toggle',
  INLINE_MODE_BUTTON: 'button:has-text("Unified")',
  SIDE_BY_SIDE_MODE_BUTTON: 'button:has-text("Side by Side")',

  // Footer
  FOOTER: 'footer',
  FOOTER_RENDER_WHITESPACE_SELECT:
    'footer select[title="空白文字の表示（スペースやタブを可視化）"]',
  PASTE_LEFT_BUTTON:
    '[aria-label*="paste left"], [aria-label*="左に貼り付け"], button:has-text("Paste Left")',
  PASTE_RIGHT_BUTTON:
    '[aria-label*="paste right"], [aria-label*="右に貼り付け"], button:has-text("Paste Right")',
  SAVE_LEFT_BUTTON:
    '[aria-label*="save left"], [aria-label*="左を保存"], button:has-text("Save Left")',
  SAVE_RIGHT_BUTTON:
    '[aria-label*="save right"], [aria-label*="右を保存"], button:has-text("Save Right")',
  OPEN_LEFT_BUTTON:
    '[aria-label*="open left"], [aria-label*="左を開く"], button:has-text("Open Left")',
  OPEN_RIGHT_BUTTON:
    '[aria-label*="open right"], [aria-label*="右を開く"], button:has-text("Open Right")',

  // Settings Modal
  SETTINGS_MODAL: '[role="dialog"], .settings-modal',
  SETTINGS_CLOSE_BUTTON: '[aria-label*="close"], button:has-text("Close")',
  THEME_SELECT: 'select[name="theme"], #theme',
  SETTINGS_RENDER_WHITESPACE_SELECT: '.settings-modal select:near(:text("空白文字の表示"))',
  IGNORE_WHITESPACE_CHECKBOX: 'input[type="checkbox"][name*="whitespace"]',
  IGNORE_CASE_CHECKBOX: 'input[type="checkbox"][name*="case"]',
  HISTORY_LIMIT_INPUT: 'input[type="number"][name*="history"]',

  // Clipboard History
  CLIPBOARD_HISTORY_BUTTON:
    '[aria-label*="clipboard history"], [aria-label*="履歴"], button:has-text("History")',
  CLIPBOARD_HISTORY_MODAL: '[role="dialog"]:has-text("Clipboard History")',
  CLIPBOARD_HISTORY_ITEM: '.clipboard-history-item',

  // Update Notification
  UPDATE_NOTIFICATION: '.update-notification',
  UPDATE_DOWNLOAD_BUTTON: 'button:has-text("Download")',
  UPDATE_DISMISS_BUTTON: 'button:has-text("Dismiss")',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

export const DIFF_MODES = {
  INLINE: 'inline',
  SIDE_BY_SIDE: 'side-by-side',
};

export const RENDER_WHITESPACE = {
  NONE: 'none',
  BOUNDARY: 'boundary',
  SELECTION: 'selection',
  TRAILING: 'trailing',
  ALL: 'all',
};
