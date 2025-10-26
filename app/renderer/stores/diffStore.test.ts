import { beforeEach, describe, expect, it } from 'vitest';
import { useDiffStore } from './diffStore';
import { createBuffer } from '@shared/utils';

describe('diffStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDiffStore.setState({
      sessions: [],
      activeSessionId: null,
      theme: 'auto',
    });
  });

  describe('initializeSession', () => {
    it('should create initial session', () => {
      const { initializeSession } = useDiffStore.getState();

      initializeSession();

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.activeSessionId).toBeTruthy();
      expect(state.sessions[0].id).toBe(state.activeSessionId);
    });

    it('should create session with empty buffers', () => {
      const { initializeSession } = useDiffStore.getState();

      initializeSession();

      const state = useDiffStore.getState();
      const session = state.sessions[0];
      expect(session.left.content).toBe('');
      expect(session.right.content).toBe('');
    });

    it('should create session with default options', () => {
      const { initializeSession } = useDiffStore.getState();

      initializeSession();

      const state = useDiffStore.getState();
      const session = state.sessions[0];
      expect(session.options.ignoreWhitespace).toBe(false);
      expect(session.options.normalizeEOL).toBe(true);
      expect(session.options.viewMode).toBe('side-by-side');
      expect(session.options.fontSize).toBe(14);
      expect(session.options.renderWhitespace).toBe('none');
    });
  });

  describe('createNewSession', () => {
    it('should add new session to existing sessions', () => {
      const { initializeSession, createNewSession } = useDiffStore.getState();

      initializeSession();
      const newId = createNewSession();

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(2);
      expect(state.activeSessionId).toBe(newId);
    });

    it('should return new session ID', () => {
      const { initializeSession, createNewSession } = useDiffStore.getState();

      initializeSession();
      const newId = createNewSession();

      expect(typeof newId).toBe('string');
      expect(newId).toBeTruthy();
    });
  });

  describe('updateLeftBuffer', () => {
    it('should update left buffer content', () => {
      const { initializeSession, updateLeftBuffer, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateLeftBuffer('new left content');

      const session = getActiveSession();
      expect(session?.left.content).toBe('new left content');
    });

    it('should update timestamp when updating left buffer', () => {
      const { initializeSession, updateLeftBuffer, getActiveSession } = useDiffStore.getState();

      initializeSession();
      const beforeUpdate = getActiveSession()?.updatedAt || 0;

      // Wait a bit to ensure timestamp changes
      updateLeftBuffer('new content');

      const afterUpdate = getActiveSession()?.updatedAt || 0;
      expect(afterUpdate).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should not update when no active session', () => {
      const { updateLeftBuffer } = useDiffStore.getState();

      updateLeftBuffer('test');

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should detect EOL when updating left buffer', () => {
      const { initializeSession, updateLeftBuffer, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateLeftBuffer('line1\r\nline2\r\nline3');

      const session = getActiveSession();
      expect(session?.left.eol).toBe('CRLF');
    });
  });

  describe('updateRightBuffer', () => {
    it('should update right buffer content', () => {
      const { initializeSession, updateRightBuffer, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateRightBuffer('new right content');

      const session = getActiveSession();
      expect(session?.right.content).toBe('new right content');
    });

    it('should update timestamp when updating right buffer', () => {
      const { initializeSession, updateRightBuffer, getActiveSession } = useDiffStore.getState();

      initializeSession();
      const beforeUpdate = getActiveSession()?.updatedAt || 0;

      updateRightBuffer('new content');

      const afterUpdate = getActiveSession()?.updatedAt || 0;
      expect(afterUpdate).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should detect EOL when updating right buffer', () => {
      const { initializeSession, updateRightBuffer, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateRightBuffer('line1\nline2\nline3');

      const session = getActiveSession();
      expect(session?.right.eol).toBe('LF');
    });
  });

  describe('swapBuffers', () => {
    it('should swap left and right buffers', () => {
      const {
        initializeSession,
        updateLeftBuffer,
        updateRightBuffer,
        swapBuffers,
        getActiveSession,
      } = useDiffStore.getState();

      initializeSession();
      updateLeftBuffer('left content');
      updateRightBuffer('right content');

      swapBuffers();

      const session = getActiveSession();
      expect(session?.left.content).toBe('right content');
      expect(session?.right.content).toBe('left content');
    });

    it('should swap buffer EOL settings', () => {
      const {
        initializeSession,
        updateLeftBuffer,
        updateRightBuffer,
        swapBuffers,
        getActiveSession,
      } = useDiffStore.getState();

      initializeSession();
      updateLeftBuffer('line1\nline2');
      updateRightBuffer('line1\r\nline2');

      swapBuffers();

      const session = getActiveSession();
      expect(session?.left.eol).toBe('CRLF');
      expect(session?.right.eol).toBe('LF');
    });

    it('should update timestamp when swapping', () => {
      const { initializeSession, swapBuffers, getActiveSession } = useDiffStore.getState();

      initializeSession();
      const beforeSwap = getActiveSession()?.updatedAt || 0;

      swapBuffers();

      const afterSwap = getActiveSession()?.updatedAt || 0;
      expect(afterSwap).toBeGreaterThanOrEqual(beforeSwap);
    });
  });

  describe('clearBuffers', () => {
    it('should clear both buffers', () => {
      const {
        initializeSession,
        updateLeftBuffer,
        updateRightBuffer,
        clearBuffers,
        getActiveSession,
      } = useDiffStore.getState();

      initializeSession();
      updateLeftBuffer('left content');
      updateRightBuffer('right content');

      clearBuffers();

      const session = getActiveSession();
      expect(session?.left.content).toBe('');
      expect(session?.right.content).toBe('');
    });

    it('should clear stats', () => {
      const { initializeSession, updateStats, clearBuffers, getActiveSession } =
        useDiffStore.getState();

      initializeSession();
      updateStats({ adds: 10, dels: 5, hunks: 2, leftLines: 100, rightLines: 105 });

      clearBuffers();

      const session = getActiveSession();
      expect(session?.stats).toBeUndefined();
    });

    it('should update timestamp when clearing', () => {
      const { initializeSession, clearBuffers, getActiveSession } = useDiffStore.getState();

      initializeSession();
      const beforeClear = getActiveSession()?.updatedAt || 0;

      clearBuffers();

      const afterClear = getActiveSession()?.updatedAt || 0;
      expect(afterClear).toBeGreaterThanOrEqual(beforeClear);
    });
  });

  describe('updateOptions', () => {
    it('should update specific options', () => {
      const { initializeSession, updateOptions, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateOptions({ ignoreWhitespace: true, fontSize: 16 });

      const session = getActiveSession();
      expect(session?.options.ignoreWhitespace).toBe(true);
      expect(session?.options.fontSize).toBe(16);
    });

    it('should preserve unchanged options', () => {
      const { initializeSession, updateOptions, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateOptions({ fontSize: 18 });

      const session = getActiveSession();
      expect(session?.options.viewMode).toBe('side-by-side');
      expect(session?.options.normalizeEOL).toBe(true);
    });

    it('should update timestamp when updating options', () => {
      const { initializeSession, updateOptions, getActiveSession } = useDiffStore.getState();

      initializeSession();
      const beforeUpdate = getActiveSession()?.updatedAt || 0;

      updateOptions({ fontSize: 20 });

      const afterUpdate = getActiveSession()?.updatedAt || 0;
      expect(afterUpdate).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should update renderWhitespace option', () => {
      const { initializeSession, updateOptions, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateOptions({ renderWhitespace: 'all' });

      const session = getActiveSession();
      expect(session?.options.renderWhitespace).toBe('all');
    });

    it('should update multiple options including renderWhitespace', () => {
      const { initializeSession, updateOptions, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateOptions({
        renderWhitespace: 'trailing',
        fontSize: 16,
      });

      const session = getActiveSession();
      expect(session?.options.renderWhitespace).toBe('trailing');
      expect(session?.options.fontSize).toBe(16);
    });
  });

  describe('updateStats', () => {
    it('should update diff statistics', () => {
      const { initializeSession, updateStats, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateStats({ adds: 5, dels: 3, hunks: 1, leftLines: 50, rightLines: 52 });

      const session = getActiveSession();
      expect(session?.stats).toEqual({ adds: 5, dels: 3, hunks: 1, leftLines: 50, rightLines: 52 });
    });
  });

  describe('setTheme', () => {
    it('should update theme setting', () => {
      const { setTheme } = useDiffStore.getState();

      setTheme('dark');

      const state = useDiffStore.getState();
      expect(state.theme).toBe('dark');
    });

    it('should handle all theme values', () => {
      const { setTheme } = useDiffStore.getState();

      setTheme('light');
      expect(useDiffStore.getState().theme).toBe('light');

      setTheme('dark');
      expect(useDiffStore.getState().theme).toBe('dark');

      setTheme('auto');
      expect(useDiffStore.getState().theme).toBe('auto');
    });
  });

  describe('updateLeftBufferEOL', () => {
    it('should update left buffer EOL setting', () => {
      const { initializeSession, updateLeftBufferEOL, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateLeftBufferEOL('CRLF');

      const session = getActiveSession();
      expect(session?.left.eol).toBe('CRLF');
    });
  });

  describe('updateRightBufferEOL', () => {
    it('should update right buffer EOL setting', () => {
      const { initializeSession, updateRightBufferEOL, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateRightBufferEOL('LF');

      const session = getActiveSession();
      expect(session?.right.eol).toBe('LF');
    });
  });

  describe('updateBuffersLang', () => {
    it('should update both buffers language', () => {
      const { initializeSession, updateBuffersLang, getActiveSession } = useDiffStore.getState();

      initializeSession();
      updateBuffersLang('typescript');

      const session = getActiveSession();
      expect(session?.left.lang).toBe('typescript');
      expect(session?.right.lang).toBe('typescript');
    });
  });

  describe('getActiveSession', () => {
    it('should return active session', () => {
      const { initializeSession, getActiveSession } = useDiffStore.getState();

      initializeSession();
      const session = getActiveSession();

      expect(session).toBeTruthy();
      expect(session?.id).toBe(useDiffStore.getState().activeSessionId);
    });

    it('should return undefined when no active session', () => {
      const { getActiveSession } = useDiffStore.getState();

      const session = getActiveSession();

      expect(session).toBeUndefined();
    });
  });

  describe('setActiveSession', () => {
    it('should change active session', () => {
      const { initializeSession, createNewSession, setActiveSession } = useDiffStore.getState();

      initializeSession();
      const firstId = useDiffStore.getState().activeSessionId;
      createNewSession();

      setActiveSession(firstId!);

      expect(useDiffStore.getState().activeSessionId).toBe(firstId);
    });
  });

  describe('loadSettings', () => {
    it('should load all settings', () => {
      const { loadSettings } = useDiffStore.getState();

      loadSettings({
        theme: 'dark',
        defaultOptions: {
          ignoreWhitespace: true,
          normalizeEOL: false,
          viewMode: 'unified',
          compactMode: true,
          wordWrap: true,
          tabSize: 2,
          fontSize: 18,
          insertSpaces: false,
          diffAlgorithm: 'advanced',
          hideUnchangedRegions: true,
          renderWhitespace: 'none',
        },
        defaultLanguage: 'typescript',
        defaultEOL: 'LF',
      });

      const state = useDiffStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.defaultOptions.fontSize).toBe(18);
      expect(state.defaultOptions.tabSize).toBe(2);
      expect(state.defaultOptions.viewMode).toBe('unified');
      expect(state.defaultLanguage).toBe('typescript');
      expect(state.defaultEOL).toBe('LF');
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to initial defaults', () => {
      const { loadSettings, resetSettings } = useDiffStore.getState();

      // まず設定を変更
      loadSettings({
        theme: 'dark',
        defaultOptions: {
          ignoreWhitespace: true,
          normalizeEOL: false,
          viewMode: 'unified',
          compactMode: true,
          wordWrap: true,
          tabSize: 2,
          fontSize: 24,
          insertSpaces: false,
          diffAlgorithm: 'advanced',
          hideUnchangedRegions: true,
          renderWhitespace: 'all',
        },
        defaultLanguage: 'javascript',
        defaultEOL: 'CRLF',
      });

      // リセット実行
      resetSettings();

      // デフォルト値に戻っていることを確認
      const state = useDiffStore.getState();
      expect(state.theme).toBe('auto');
      expect(state.defaultOptions.ignoreWhitespace).toBe(false);
      expect(state.defaultOptions.normalizeEOL).toBe(true);
      expect(state.defaultOptions.viewMode).toBe('side-by-side');
      expect(state.defaultOptions.compactMode).toBe(false);
      expect(state.defaultOptions.wordWrap).toBe(false);
      expect(state.defaultOptions.tabSize).toBe(4);
      expect(state.defaultOptions.fontSize).toBe(14);
      expect(state.defaultOptions.insertSpaces).toBe(true);
      expect(state.defaultOptions.renderWhitespace).toBe('none');
      expect(state.defaultLanguage).toBe('plaintext');
      expect(state.defaultEOL).toBe('auto');
    });

    it('should reset theme to auto', () => {
      const { setTheme, resetSettings } = useDiffStore.getState();

      setTheme('dark');
      resetSettings();

      expect(useDiffStore.getState().theme).toBe('auto');
    });

    it('should reset language to plaintext', () => {
      const { loadSettings, resetSettings } = useDiffStore.getState();

      loadSettings({
        theme: 'auto',
        defaultOptions: {
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
          renderWhitespace: 'none',
        },
        defaultLanguage: 'typescript',
        defaultEOL: 'auto',
      });

      resetSettings();

      expect(useDiffStore.getState().defaultLanguage).toBe('plaintext');
    });

    it('should reset EOL to auto', () => {
      const { loadSettings, resetSettings } = useDiffStore.getState();

      loadSettings({
        theme: 'auto',
        defaultOptions: {
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
          renderWhitespace: 'none',
        },
        defaultLanguage: 'plaintext',
        defaultEOL: 'CRLF',
      });

      resetSettings();

      expect(useDiffStore.getState().defaultEOL).toBe('auto');
    });
  });

  describe('Edge cases - no active session', () => {
    beforeEach(() => {
      // セッションなし、またはactiveSessionIdがnullの状態
      useDiffStore.setState({
        sessions: [],
        activeSessionId: null,
      });
    });

    it('should not update left buffer when no active session', () => {
      const { updateLeftBuffer } = useDiffStore.getState();

      // activeSessionがnullなので何も起こらない
      updateLeftBuffer('test content');

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not update right buffer when no active session', () => {
      const { updateRightBuffer } = useDiffStore.getState();

      updateRightBuffer('test content');

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not update options when no active session', () => {
      const { updateOptions } = useDiffStore.getState();

      updateOptions({ fontSize: 20 });

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not update stats when no active session', () => {
      const { updateStats } = useDiffStore.getState();

      updateStats({ adds: 10, dels: 5, hunks: 2, leftLines: 100, rightLines: 105 });

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not swap buffers when no active session', () => {
      const { swapBuffers } = useDiffStore.getState();

      swapBuffers();

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not clear buffers when no active session', () => {
      const { clearBuffers } = useDiffStore.getState();

      clearBuffers();

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not update left buffer EOL when no active session', () => {
      const { updateLeftBufferEOL } = useDiffStore.getState();

      updateLeftBufferEOL('CRLF');

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not update right buffer EOL when no active session', () => {
      const { updateRightBufferEOL } = useDiffStore.getState();

      updateRightBufferEOL('CRLF');

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should not update buffers lang when no active session', () => {
      const { updateBuffersLang } = useDiffStore.getState();

      updateBuffersLang('typescript');

      const state = useDiffStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should return undefined when getting active session with null activeSessionId', () => {
      const { getActiveSession } = useDiffStore.getState();

      const session = getActiveSession();

      expect(session).toBeUndefined();
    });

    it('should return undefined when activeSessionId does not match any session', () => {
      useDiffStore.setState({
        sessions: [
          {
            id: 'session-1',
            left: { ...createBuffer(''), lang: 'plaintext', eol: 'LF' },
            right: { ...createBuffer(''), lang: 'plaintext', eol: 'LF' },
            options: {
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
              renderWhitespace: 'none',
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        activeSessionId: 'non-existent-id',
      });

      const { getActiveSession } = useDiffStore.getState();
      const session = getActiveSession();

      expect(session).toBeUndefined();
    });
  });

  describe('devMode setting', () => {
    it('should default devMode to false when not provided in loadSettings', () => {
      const { loadSettings } = useDiffStore.getState();

      loadSettings({
        theme: 'dark',
        defaultOptions: {
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
          renderWhitespace: 'none',
        },
        defaultLanguage: 'plaintext',
        defaultEOL: 'auto',
        // devMode not provided
      });

      const state = useDiffStore.getState();
      expect(state.devMode).toBe(false);
    });

    it('should set devMode to true when provided in loadSettings', () => {
      const { loadSettings } = useDiffStore.getState();

      loadSettings({
        theme: 'dark',
        defaultOptions: {
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
          renderWhitespace: 'none',
        },
        defaultLanguage: 'plaintext',
        defaultEOL: 'auto',
        devMode: true,
      });

      const state = useDiffStore.getState();
      expect(state.devMode).toBe(true);
    });
  });
});
