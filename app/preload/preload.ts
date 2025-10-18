import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';

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
    getHistory: (): Promise<
      Array<{ id: string; content: string; timestamp: number }>
    > => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_HISTORY_GET),
    addToHistory: (
      content: string
    ): Promise<{ id: string; content: string; timestamp: number }> =>
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
    get: (): Promise<unknown> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: unknown): Promise<{ success: boolean }> =>
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
    minimize: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  },

  // システム情報
  platform: process.platform,
};

// windowオブジェクトにAPIを公開
contextBridge.exposeInMainWorld('electron', electronAPI);

// TypeScript用の型定義をグローバルに追加
export type ElectronAPI = typeof electronAPI;
