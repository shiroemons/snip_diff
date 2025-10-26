import type { DiffOptions, DiffSession, DiffStats, Theme } from '@shared/types';
import { createBuffer, generateId } from '@shared/utils';
import { create } from 'zustand';

export interface DiffStore {
  // セッション管理
  sessions: DiffSession[];
  activeSessionId: string | null;

  // テーマ
  theme: Theme;

  // 設定モーダル
  isSettingsModalOpen: boolean;

  // デフォルト設定
  defaultOptions: DiffOptions;
  defaultLanguage: string;
  defaultEOL: 'LF' | 'CRLF' | 'auto';

  // 開発者モード
  devMode: boolean;

  // 更新通知
  isUpdateAvailable: boolean;

  // アクション
  initializeSession: () => void;
  createNewSession: () => string;
  setActiveSession: (id: string) => void;
  updateLeftBuffer: (content: string) => void;
  updateRightBuffer: (content: string) => void;
  updateOptions: (options: Partial<DiffOptions>) => void;
  updateStats: (stats: DiffStats) => void;
  swapBuffers: () => void;
  clearBuffers: () => void;
  setTheme: (theme: Theme) => void;
  updateLeftBufferEOL: (eol: 'LF' | 'CRLF' | 'auto') => void;
  updateRightBufferEOL: (eol: 'LF' | 'CRLF' | 'auto') => void;
  updateBuffersLang: (lang: string) => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  setIsUpdateAvailable: (isAvailable: boolean) => void;
  loadSettings: (settings: {
    theme: Theme;
    defaultOptions: DiffOptions;
    defaultLanguage: string;
    defaultEOL: 'LF' | 'CRLF' | 'auto';
    devMode?: boolean;
  }) => void;
  resetSettings: () => void;

  // ヘルパー
  getActiveSession: () => DiffSession | undefined;
}

// デフォルト設定値（リセット時に使用）
export const INITIAL_DEFAULT_OPTIONS: DiffOptions = {
  ignoreWhitespace: false,
  normalizeEOL: true,
  viewMode: 'side-by-side',
  compactMode: false,
  wordWrap: false,
  tabSize: 4,
  fontSize: 14,
  insertSpaces: true,
  diffAlgorithm: 'advanced',
  hideUnchangedRegions: false,
};

export const INITIAL_DEFAULT_THEME: Theme = 'auto';
export const INITIAL_DEFAULT_LANGUAGE = 'plaintext';
export const INITIAL_DEFAULT_EOL: 'LF' | 'CRLF' | 'auto' = 'auto';

const createEmptySession = (
  defaults: DiffOptions,
  defaultLang: string,
  defaultEOL: 'LF' | 'CRLF' | 'auto'
): DiffSession => ({
  id: generateId(),
  left: { ...createBuffer(''), lang: defaultLang, eol: defaultEOL },
  right: { ...createBuffer(''), lang: defaultLang, eol: defaultEOL },
  options: { ...defaults },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useDiffStore = create<DiffStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  theme: INITIAL_DEFAULT_THEME,
  isSettingsModalOpen: false,
  defaultOptions: { ...INITIAL_DEFAULT_OPTIONS },
  defaultLanguage: INITIAL_DEFAULT_LANGUAGE,
  defaultEOL: INITIAL_DEFAULT_EOL,
  devMode: false,
  isUpdateAvailable: false,

  initializeSession: () => {
    const { defaultOptions: opts, defaultLanguage, defaultEOL } = get();
    const session = createEmptySession(opts, defaultLanguage, defaultEOL);
    set({
      sessions: [session],
      activeSessionId: session.id,
    });
  },

  createNewSession: () => {
    const { defaultOptions: opts, defaultLanguage, defaultEOL } = get();
    const session = createEmptySession(opts, defaultLanguage, defaultEOL);
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    }));
    return session.id;
  },

  setActiveSession: (id: string) => {
    set({ activeSessionId: id });
  },

  updateLeftBuffer: (content: string) => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      left: createBuffer(content),
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  updateRightBuffer: (content: string) => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      right: createBuffer(content),
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  updateOptions: (options: Partial<DiffOptions>) => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      options: { ...activeSession.options, ...options },
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  updateStats: (stats: DiffStats) => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      stats,
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  swapBuffers: () => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      left: activeSession.right,
      right: activeSession.left,
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  clearBuffers: () => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      left: createBuffer(''),
      right: createBuffer(''),
      stats: undefined,
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  setTheme: (theme: Theme) => {
    set({ theme });
  },

  updateLeftBufferEOL: (eol: 'LF' | 'CRLF' | 'auto') => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      left: { ...activeSession.left, eol },
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  updateRightBufferEOL: (eol: 'LF' | 'CRLF' | 'auto') => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      right: { ...activeSession.right, eol },
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  updateBuffersLang: (lang: string) => {
    const activeSession = get().getActiveSession();
    if (!activeSession) return;

    const updatedSession: DiffSession = {
      ...activeSession,
      left: { ...activeSession.left, lang },
      right: { ...activeSession.right, lang },
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)),
    }));
  },

  openSettingsModal: () => {
    set({ isSettingsModalOpen: true });
  },

  closeSettingsModal: () => {
    set({ isSettingsModalOpen: false });
  },

  setIsUpdateAvailable: (isAvailable: boolean) => {
    set({ isUpdateAvailable: isAvailable });
  },

  loadSettings: (settings) => {
    set({
      theme: settings.theme,
      defaultOptions: settings.defaultOptions,
      defaultLanguage: settings.defaultLanguage,
      defaultEOL: settings.defaultEOL,
      devMode: settings.devMode ?? false,
    });
  },

  resetSettings: () => {
    set({
      theme: INITIAL_DEFAULT_THEME,
      defaultOptions: { ...INITIAL_DEFAULT_OPTIONS },
      defaultLanguage: INITIAL_DEFAULT_LANGUAGE,
      defaultEOL: INITIAL_DEFAULT_EOL,
    });
  },

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId);
  },
}));
