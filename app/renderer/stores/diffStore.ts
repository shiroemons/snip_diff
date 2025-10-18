import { create } from 'zustand';
import {
  DiffSession,
  DiffOptions,
  Theme,
  DiffStats,
} from '@shared/types';
import { generateId, createBuffer } from '@shared/utils';

interface DiffStore {
  // セッション管理
  sessions: DiffSession[];
  activeSessionId: string | null;

  // テーマ
  theme: Theme;

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

  // ヘルパー
  getActiveSession: () => DiffSession | undefined;
}

const defaultOptions: DiffOptions = {
  ignoreWhitespace: false,
  ignoreCase: false,
  normalizeEOL: true,
  viewMode: 'side-by-side',
  wordWrap: false,
  tabSize: 4,
  fontSize: 14,
};

const createEmptySession = (): DiffSession => ({
  id: generateId(),
  left: createBuffer(''),
  right: createBuffer(''),
  options: { ...defaultOptions },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useDiffStore = create<DiffStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  theme: 'auto',

  initializeSession: () => {
    const session = createEmptySession();
    set({
      sessions: [session],
      activeSessionId: session.id,
    });
  },

  createNewSession: () => {
    const session = createEmptySession();
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
      sessions: state.sessions.map((s) =>
        s.id === activeSession.id ? updatedSession : s
      ),
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
      sessions: state.sessions.map((s) =>
        s.id === activeSession.id ? updatedSession : s
      ),
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
      sessions: state.sessions.map((s) =>
        s.id === activeSession.id ? updatedSession : s
      ),
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
      sessions: state.sessions.map((s) =>
        s.id === activeSession.id ? updatedSession : s
      ),
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
      sessions: state.sessions.map((s) =>
        s.id === activeSession.id ? updatedSession : s
      ),
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
      sessions: state.sessions.map((s) =>
        s.id === activeSession.id ? updatedSession : s
      ),
    }));
  },

  setTheme: (theme: Theme) => {
    set({ theme });
  },

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId);
  },
}));
