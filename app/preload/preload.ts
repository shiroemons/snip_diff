import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, DownloadProgress, UpdateInfo } from '../shared/types';

/**
 * IPC通信チャンネル定義
 */
const IPC_CHANNELS = {
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
 * Electron APIをレンダラープロセスに公開
 * contextIsolation: trueの環境で安全にIPCを使用するためのブリッジ
 */
const electronAPI = {
  // クリップボード操作
  clipboard: {
    read: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_READ),
    write: (text: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_WRITE, text),
    getHistory: (): Promise<Array<{ id: string; content: string; timestamp: number }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_HISTORY_GET),
    addToHistory: (content: string): Promise<{ id: string; content: string; timestamp: number }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_HISTORY_ADD, content),
  },

  // ファイル操作
  file: {
    save: (
      content: string,
      defaultName?: string
    ): Promise<{
      success: boolean;
      filePath?: string;
      canceled?: boolean;
      error?: string;
    }> => ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE, content, defaultName),
    open: (): Promise<{
      success: boolean;
      content?: string;
      filePath?: string;
      canceled?: boolean;
      error?: string;
    }> => ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN),
  },

  // 設定
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  },

  // テーマ
  theme: {
    get: (): Promise<{ shouldUseDarkColors: boolean; system: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),
    onChanged: (callback: (theme: { shouldUseDarkColors: boolean }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.THEME_CHANGED, (_event, theme) => {
        callback(theme);
      });
    },
    removeListener: () => {
      ipcRenderer.removeAllListeners(IPC_CHANNELS.THEME_CHANGED);
    },
  },

  // ウィンドウ操作
  window: {
    close: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    minimize: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
    onMaximizedChanged: (callback: (state: { isMaximized: boolean }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGED, (_event, state) => {
        callback(state);
      });
    },
    removeMaximizedListener: () => {
      ipcRenderer.removeAllListeners(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGED);
    },
  },

  // 自動更新
  updater: {
    checkForUpdates: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK),
    downloadUpdate: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DOWNLOAD),
    installUpdate: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_INSTALL),
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, (_event, info) => {
        callback(info);
      });
    },
    onUpdateNotAvailable: (callback: (info: { version: string }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.UPDATE_NOT_AVAILABLE, (_event, info) => {
        callback(info);
      });
    },
    onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
      ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOAD_PROGRESS, (_event, progress) => {
        callback(progress);
      });
    },
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, (_event, info) => {
        callback(info);
      });
    },
    onError: (callback: (error: { message: string }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.UPDATE_ERROR, (_event, error) => {
        callback(error);
      });
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(IPC_CHANNELS.UPDATE_AVAILABLE);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.UPDATE_NOT_AVAILABLE);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.UPDATE_DOWNLOAD_PROGRESS);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.UPDATE_DOWNLOADED);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.UPDATE_ERROR);
    },
  },

  // システム情報
  platform: process.platform,
};

// windowオブジェクトにAPIを公開
contextBridge.exposeInMainWorld('electron', electronAPI);

// TypeScript用の型定義をグローバルに追加
export type ElectronAPI = typeof electronAPI;
