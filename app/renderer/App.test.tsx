import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';
import { useDiffStore } from './stores/diffStore';

// Mock the DiffEditor module before importing
vi.mock('./features/diff/DiffEditor', async () => {
  const React = await import('react');
  const { useDiffStore } = await import('./stores/diffStore');

  const MockDiffEditor = React.forwardRef<any, { theme: string }>(
    ({ theme }: { theme: string }, ref: React.Ref<any>) => {
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

      return React.createElement('div', {
        'data-testid': 'diff-editor',
        'data-theme': theme,
      }, 'Diff Editor Mock');
    }
  );

  return {
    default: MockDiffEditor,
  };
});

// Mock Electron API
const mockElectronAPI = {
  theme: {
    get: vi.fn(),
    onChanged: vi.fn(),
    removeListener: vi.fn(),
  },
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
    (global.window as any).electron = mockElectronAPI;

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
      const { setTheme } = useDiffStore.getState();
      setTheme('light');

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should handle theme changes', async () => {
      let themeChangeCallback: ((themeInfo: any) => void) | null = null;
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
            theme: 'light',
          });
        }
      });

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should cleanup theme listener on unmount', async () => {
      let component;
      await act(async () => {
        component = render(<App />);
      });

      await act(async () => {
        component.unmount();
      });

      expect(mockElectronAPI.theme.removeListener).toHaveBeenCalled();
    });

    it('should handle missing Electron API gracefully', async () => {
      delete (global.window as any).electron;

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
      (global.window as any).electron = mockElectronAPI;
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
