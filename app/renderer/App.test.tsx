import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useDiffStore } from './stores/diffStore';

// Mock the DiffEditor module before importing
vi.mock('./features/diff/DiffEditor', async () => {
  const React = await import('react');
  const { useDiffStore } = await import('./stores/diffStore');

  interface DiffEditorHandle {
    compare: () => void;
    swap: () => void;
    clear: () => void;
  }

  const MockDiffEditor = React.forwardRef<DiffEditorHandle, { theme: string }>(
    ({ theme }: { theme: string }, ref: React.Ref<DiffEditorHandle>) => {
      React.useImperativeHandle(ref, () => ({
        compare: vi.fn(),
        swap: () => {
          const { updateLeftBuffer, updateRightBuffer, getActiveSession } = useDiffStore.getState();
          const session = getActiveSession();
          if (session) {
            const temp = session.left.content;
            updateLeftBuffer(session.right.content);
            updateRightBuffer(temp);
          }
        },
        clear: () => {
          const { updateLeftBuffer, updateRightBuffer } = useDiffStore.getState();
          updateLeftBuffer('');
          updateRightBuffer('');
        },
      }));

      return React.createElement(
        'div',
        {
          'data-testid': 'diff-editor',
          'data-theme': theme,
        },
        'Diff Editor Mock'
      );
    }
  );

  return {
    default: MockDiffEditor,
  };
});

// Mock Electron API
const mockElectronAPI = {
  clipboard: {
    read: vi.fn().mockResolvedValue(''),
    write: vi.fn().mockResolvedValue(true),
    getHistory: vi.fn().mockResolvedValue([]),
    addToHistory: vi.fn().mockResolvedValue({ id: '1', content: '', timestamp: Date.now() }),
  },
  file: {
    save: vi.fn().mockResolvedValue({ success: true }),
    open: vi.fn().mockResolvedValue({ success: true }),
  },
  settings: {
    get: vi.fn().mockResolvedValue({
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
      },
      defaultLanguage: 'plaintext',
      defaultEOL: 'auto',
    }),
    set: vi.fn().mockResolvedValue({ success: true }),
    onOpen: vi.fn(),
    removeListener: vi.fn(),
  },
  theme: {
    get: vi.fn(),
    onChanged: vi.fn(),
    removeListener: vi.fn(),
  },
  window: {
    close: vi.fn().mockResolvedValue(undefined),
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizedChanged: vi.fn(),
    removeMaximizedListener: vi.fn(),
  },
  view: {
    onModeChange: vi.fn(),
    onToggleCompact: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  updater: {
    checkForUpdates: vi.fn().mockResolvedValue(undefined),
    downloadUpdate: vi.fn().mockResolvedValue(undefined),
    installUpdate: vi.fn().mockResolvedValue(undefined),
    onUpdateAvailable: vi.fn(),
    onUpdateNotAvailable: vi.fn(),
    onDownloadProgress: vi.fn(),
    onUpdateDownloaded: vi.fn(),
    onError: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  platform: 'darwin' as NodeJS.Platform,
};

describe('App', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDiffStore.setState({
      sessions: [],
      activeSessionId: null,
      theme: 'auto',
    });

    // Mock window.electron
    (global.window as Window & typeof globalThis).electron = mockElectronAPI;

    // Reset mocks
    vi.clearAllMocks();

    // Default mock implementation
    mockElectronAPI.theme.get.mockResolvedValue({
      shouldUseDarkColors: true,
      theme: 'dark',
    });
  });

  describe('Rendering', () => {
    it('should render main components', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('SnipDiff')).toBeTruthy();
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });
    });

    it('should initialize session on mount', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        const { getActiveSession } = useDiffStore.getState();
        const session = getActiveSession();

        expect(session).toBeDefined();
        expect(session?.id).toBeTruthy();
      });
    });
  });

  describe('Theme management', () => {
    it('should apply dark theme by default in auto mode', async () => {
      mockElectronAPI.theme.get.mockResolvedValue({
        shouldUseDarkColors: true,
        theme: 'dark',
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('dark');
      });
    });

    it('should apply light theme when system uses light colors', async () => {
      mockElectronAPI.theme.get.mockResolvedValue({
        shouldUseDarkColors: false,
        theme: 'light',
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should apply explicit theme when set', async () => {
      mockElectronAPI.settings.get.mockResolvedValue({
        theme: 'light',
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
        },
        defaultLanguage: 'plaintext',
        defaultEOL: 'auto',
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should handle theme changes', async () => {
      let themeChangeCallback: ((themeInfo: { shouldUseDarkColors: boolean }) => void) | null =
        null;
      mockElectronAPI.theme.onChanged.mockImplementation((callback) => {
        themeChangeCallback = callback;
      });

      await act(async () => {
        render(<App />);
      });

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      // Trigger theme change
      await act(async () => {
        if (themeChangeCallback) {
          themeChangeCallback({
            shouldUseDarkColors: false,
          });
        }
      });

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should handle missing Electron API gracefully', async () => {
      // @ts-expect-error - Temporarily removing electron for testing
      (global.window as Window & typeof globalThis).electron = undefined;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Electron API is not available. Running in browser mode.'
        );
      });

      consoleSpy.mockRestore();

      // Restore for other tests
      (global.window as Window & typeof globalThis).electron = mockElectronAPI;
    });
  });

  describe('Header integration', () => {
    it('should call handleSwap when Header swap button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      const { updateLeftBuffer, updateRightBuffer, getActiveSession } = useDiffStore.getState();

      await act(async () => {
        updateLeftBuffer('left content');
        updateRightBuffer('right content');
      });

      // Click swap button in Header
      const swapButton = screen.getByTitle(/左右を入れ替え/);
      await user.click(swapButton);

      await waitFor(() => {
        const session = getActiveSession();
        expect(session?.left.content).toBe('right content');
        expect(session?.right.content).toBe('left content');
      });
    });

    it('should call handleClear when Header clear button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      const { updateLeftBuffer, updateRightBuffer, getActiveSession } = useDiffStore.getState();

      await act(async () => {
        updateLeftBuffer('left content');
        updateRightBuffer('right content');
      });

      // Click clear button in Header
      const clearButton = screen.getByTitle(/クリア/);
      await user.click(clearButton);

      await waitFor(() => {
        const session = getActiveSession();
        expect(session?.left.content).toBe('');
        expect(session?.right.content).toBe('');
      });
    });
  });

  describe('Menu events', () => {
    it('should handle view.onToggleCompact event', async () => {
      let toggleCompactCallback: (() => void) | null = null;
      mockElectronAPI.view.onToggleCompact.mockImplementation((callback) => {
        toggleCompactCallback = callback;
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      const { getActiveSession } = useDiffStore.getState();
      const initialCompactMode = getActiveSession()?.options.compactMode ?? false;

      // Trigger toggle compact event
      await act(async () => {
        if (toggleCompactCallback) {
          toggleCompactCallback();
        }
      });

      await waitFor(() => {
        const session = getActiveSession();
        expect(session?.options.compactMode).toBe(!initialCompactMode);
      });
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should switch to unified mode on Cmd+1', async () => {
      await act(async () => {
        render(<App />);
      });

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      // Trigger Cmd+1
      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: '1',
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      const { getActiveSession } = useDiffStore.getState();
      const session = getActiveSession();
      expect(session?.options.viewMode).toBe('unified');
    });

    it('should switch to side-by-side mode on Cmd+2', async () => {
      await act(async () => {
        render(<App />);
      });

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      // Trigger Cmd+2
      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: '2',
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      const { getActiveSession } = useDiffStore.getState();
      const session = getActiveSession();
      expect(session?.options.viewMode).toBe('side-by-side');
    });

    it('should toggle compact mode on Cmd+3', async () => {
      await act(async () => {
        render(<App />);
      });

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      const { getActiveSession } = useDiffStore.getState();
      const initialCompactMode = getActiveSession()?.options.compactMode ?? false;

      // Trigger Cmd+3
      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: '3',
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      const session = getActiveSession();
      expect(session?.options.compactMode).toBe(!initialCompactMode);
    });

    it('should clear buffers on Cmd+k', async () => {
      await act(async () => {
        render(<App />);
      });

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      const { updateLeftBuffer, updateRightBuffer, getActiveSession } = useDiffStore.getState();

      // Set some content
      await act(async () => {
        updateLeftBuffer('left content');
        updateRightBuffer('right content');
      });

      // Trigger Cmd+k
      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          shiftKey: false,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const session = getActiveSession();
        expect(session?.left.content).toBe('');
        expect(session?.right.content).toBe('');
      });
    });

    it('should swap buffers on Cmd+Shift+K', async () => {
      await act(async () => {
        render(<App />);
      });

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      const { updateLeftBuffer, updateRightBuffer, getActiveSession } = useDiffStore.getState();

      // Set some content
      await act(async () => {
        updateLeftBuffer('left content');
        updateRightBuffer('right content');
      });

      // Trigger Cmd+Shift+K
      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: 'K',
          metaKey: true,
          shiftKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const session = getActiveSession();
        expect(session?.left.content).toBe('right content');
        expect(session?.right.content).toBe('left content');
      });
    });

    it('should not trigger shortcuts without Cmd key', async () => {
      await act(async () => {
        render(<App />);
      });

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      const { getActiveSession } = useDiffStore.getState();
      const initialViewMode = getActiveSession()?.options.viewMode;

      // Try 1 without Cmd
      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: '1',
          metaKey: false,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      const session = getActiveSession();
      expect(session?.options.viewMode).toBe(initialViewMode);
    });
  });
});
