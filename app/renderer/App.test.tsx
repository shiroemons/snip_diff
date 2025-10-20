import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { useDiffStore } from './stores/diffStore';

// Mock the DiffEditor module before importing
vi.mock('./features/diff/DiffEditor', () => {
  const React = require('react');

  const MockDiffEditor = React.forwardRef<any, { theme: string }>(
    ({ theme }: { theme: string }, ref: React.Ref<any>) => {
      React.useImperativeHandle(ref, () => ({
        compare: vi.fn(),
        swap: () => {
          // Import dynamically to avoid circular dependency
          const { useDiffStore: store } = require('./stores/diffStore');
          const { updateLeftBuffer, updateRightBuffer, getActiveSession } = store.getState();
          const session = getActiveSession();
          if (session) {
            const temp = session.left.content;
            updateLeftBuffer(session.right.content);
            updateRightBuffer(temp);
          }
        },
        clear: () => {
          const { useDiffStore: store } = require('./stores/diffStore');
          const { updateLeftBuffer, updateRightBuffer } = store.getState();
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
    it('should render main components', () => {
      render(<App />);

      expect(screen.getByText('SnipDiff')).toBeTruthy();
      expect(screen.getByTestId('diff-editor')).toBeTruthy();
    });

    it('should initialize session on mount', () => {
      render(<App />);

      const { getActiveSession } = useDiffStore.getState();
      const session = getActiveSession();

      expect(session).toBeDefined();
      expect(session?.id).toBeTruthy();
    });
  });

  describe('Theme management', () => {
    it('should apply dark theme by default in auto mode', async () => {
      mockElectronAPI.theme.get.mockResolvedValue({
        shouldUseDarkColors: true,
        theme: 'dark',
      });

      render(<App />);

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

      render(<App />);

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should apply explicit theme when set', async () => {
      const { setTheme } = useDiffStore.getState();
      setTheme('light');

      render(<App />);

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

      render(<App />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
      });

      // Trigger theme change
      if (themeChangeCallback) {
        themeChangeCallback({
          shouldUseDarkColors: false,
          theme: 'light',
        });
      }

      await waitFor(() => {
        const diffEditor = screen.getByTestId('diff-editor');
        expect(diffEditor.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should cleanup theme listener on unmount', () => {
      const { unmount } = render(<App />);

      unmount();

      expect(mockElectronAPI.theme.removeListener).toHaveBeenCalled();
    });

    it('should handle missing Electron API gracefully', () => {
      delete (global.window as any).electron;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<App />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Electron API is not available. Running in browser mode.'
      );

      consoleSpy.mockRestore();

      // Restore for other tests
      (global.window as any).electron = mockElectronAPI;
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should switch to unified mode on Cmd+1', async () => {
      render(<App />);

      // Trigger Cmd+1
      const event = new KeyboardEvent('keydown', {
        key: '1',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      const { getActiveSession } = useDiffStore.getState();
      const session = getActiveSession();
      expect(session?.options.viewMode).toBe('unified');
    });

    it('should switch to side-by-side mode on Cmd+2', async () => {
      render(<App />);

      // Trigger Cmd+2
      const event = new KeyboardEvent('keydown', {
        key: '2',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      const { getActiveSession } = useDiffStore.getState();
      const session = getActiveSession();
      expect(session?.options.viewMode).toBe('side-by-side');
    });

    it('should toggle compact mode on Cmd+3', async () => {
      render(<App />);

      const { getActiveSession } = useDiffStore.getState();
      const initialCompactMode = getActiveSession()?.options.compactMode ?? false;

      // Trigger Cmd+3
      const event = new KeyboardEvent('keydown', {
        key: '3',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      const session = getActiveSession();
      expect(session?.options.compactMode).toBe(!initialCompactMode);
    });

    it('should not trigger shortcuts without Cmd key', async () => {
      render(<App />);

      const { getActiveSession } = useDiffStore.getState();
      const initialViewMode = getActiveSession()?.options.viewMode;

      // Try 1 without Cmd
      const event = new KeyboardEvent('keydown', {
        key: '1',
        metaKey: false,
        bubbles: true,
      });
      window.dispatchEvent(event);

      const session = getActiveSession();
      expect(session?.options.viewMode).toBe(initialViewMode);
    });
  });
});
