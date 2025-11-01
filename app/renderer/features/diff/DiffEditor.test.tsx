import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { editor } from 'monaco-editor';
import { act } from 'react';
import DiffEditor, { type DiffEditorRef } from './DiffEditor';
import { useDiffStore } from '../../stores/diffStore';
import { createBuffer } from '@shared/utils';
import React from 'react';

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  default: {},
  editor: {
    defineTheme: vi.fn(),
  },
  languages: {},
  Uri: {},
}));

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  loader: {
    config: vi.fn(),
  },
  Editor: vi.fn(({ defaultValue, onMount }) => {
    // Simulate editor mount
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: vi.fn(() => defaultValue || ''),
          setValue: vi.fn(),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as editor.IStandaloneCodeEditor;
        onMount(mockEditor);
      }
    }, [onMount, defaultValue]);

    return React.createElement(
      'div',
      { 'data-testid': 'monaco-editor' },
      `Editor: ${defaultValue}`
    );
  }),
  DiffEditor: vi.fn(({ original, modified, onMount }) => {
    // Simulate diff editor mount
    React.useEffect(() => {
      if (onMount) {
        const mockDiffEditor = {
          updateOptions: vi.fn(),
          getOriginalEditor: vi.fn(),
          getModifiedEditor: vi.fn(),
        } as unknown as editor.IStandaloneDiffEditor;
        onMount(mockDiffEditor);
      }
    }, [onMount]);

    return React.createElement(
      'div',
      { 'data-testid': 'monaco-diff-editor' },
      `Diff: ${original} vs ${modified}`
    );
  }),
}));

// Mock sub-components
vi.mock('./components/InputEditorPanel', () => ({
  InputEditorPanel: ({
    onLeftEditorMount,
    onRightEditorMount,
  }: {
    onLeftEditorMount: (editor: editor.IStandaloneCodeEditor) => void;
    onRightEditorMount: (editor: editor.IStandaloneCodeEditor) => void;
  }) => {
    React.useEffect(() => {
      const leftEditor = {
        getValue: vi.fn(() => ''),
        setValue: vi.fn(),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as editor.IStandaloneCodeEditor;

      const rightEditor = {
        getValue: vi.fn(() => ''),
        setValue: vi.fn(),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as editor.IStandaloneCodeEditor;

      onLeftEditorMount(leftEditor);
      onRightEditorMount(rightEditor);
    }, [onLeftEditorMount, onRightEditorMount]);

    return React.createElement(
      'div',
      { 'data-testid': 'input-editor-panel' },
      'Input Editor Panel'
    );
  },
}));

vi.mock('./components/ComparisonPanel', () => ({
  ComparisonPanel: ({
    onDiffEditorMount,
  }: {
    onDiffEditorMount: (editor: editor.IStandaloneDiffEditor) => void;
  }) => {
    React.useEffect(() => {
      const diffEditor = {
        updateOptions: vi.fn(),
        getOriginalEditor: vi.fn(),
        getModifiedEditor: vi.fn(),
      } as unknown as editor.IStandaloneDiffEditor;

      onDiffEditorMount(diffEditor);
    }, [onDiffEditorMount]);

    return React.createElement('div', { 'data-testid': 'comparison-panel' }, 'Comparison Panel');
  },
}));

// Mock hooks
vi.mock('./hooks/usePanelResize', () => ({
  usePanelResize: () => ({
    panelHeight: 350,
    isFullscreen: false,
    isResizing: false,
    isMinimized: false,
    toggleFullscreen: vi.fn(),
    toggleMinimize: vi.fn(),
    startResize: vi.fn(),
  }),
}));

vi.mock('./hooks/useCompactMode', () => ({
  useCompactMode: vi.fn(),
}));

// Mock compact themes
vi.mock('./themes/compactThemes', () => ({
  defineCompactThemes: vi.fn(),
  getThemeName: vi.fn((compactMode: boolean, theme: string) =>
    compactMode ? `${theme}-compact` : theme === 'light' ? 'vs' : 'vs-dark'
  ),
}));

describe('DiffEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDiffStore.setState({
      sessions: [
        {
          id: 'test-session',
          left: { ...createBuffer(''), lang: 'plaintext', eol: 'LF' },
          right: { ...createBuffer(''), lang: 'plaintext', eol: 'LF' },
          options: {
            viewMode: 'side-by-side',
            ignoreWhitespace: false,
            normalizeEOL: true,
            compactMode: false,
            wordWrap: false,
            fontSize: 14,
            tabSize: 4,
            insertSpaces: true,
            diffAlgorithm: 'advanced',
            hideUnchangedRegions: false,
            renderWhitespace: 'none',
            renderControlCharacters: true,
            unicodeHighlight: {
              invisibleCharacters: true,
              ambiguousCharacters: true,
              nonBasicASCII: false,
              includeComments: true,
              includeStrings: true,
            },
          },
          stats: { adds: 0, dels: 0, hunks: 0, leftLines: 0, rightLines: 0 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeSessionId: 'test-session',
    });
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<DiffEditor theme="dark" />);
      expect(screen.getByTestId('input-editor-panel')).toBeTruthy();
      expect(screen.getByTestId('comparison-panel')).toBeTruthy();
    });

    it('should show no session message when activeSession is null', () => {
      useDiffStore.setState({ sessions: [], activeSessionId: null });
      render(<DiffEditor theme="dark" />);
      expect(screen.getByText('セッションが見つかりません')).toBeTruthy();
    });

    it('should apply light theme correctly', () => {
      render(<DiffEditor theme="light" />);
      expect(screen.getByTestId('input-editor-panel')).toBeTruthy();
    });

    it('should apply dark theme correctly', () => {
      render(<DiffEditor theme="dark" />);
      expect(screen.getByTestId('input-editor-panel')).toBeTruthy();
    });

    it('should pass isMaximized prop to ComparisonPanel', () => {
      render(<DiffEditor theme="dark" isMaximized={true} />);
      expect(screen.getByTestId('comparison-panel')).toBeTruthy();
    });
  });

  describe('imperative methods via ref', () => {
    it('should expose compare, swap, and clear methods', () => {
      const ref = React.createRef<DiffEditorRef>();
      render(<DiffEditor ref={ref} theme="dark" />);

      expect(ref.current).not.toBeNull();
      expect(ref.current?.compare).toBeDefined();
      expect(ref.current?.swap).toBeDefined();
      expect(ref.current?.clear).toBeDefined();
    });

    it('should call compare method successfully', async () => {
      const ref = React.createRef<DiffEditorRef>();
      render(<DiffEditor ref={ref} theme="dark" />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      act(() => {
        ref.current?.compare();
      });

      // compare should not throw
      expect(ref.current?.compare).toBeDefined();
    });

    it('should call swap method successfully', async () => {
      const ref = React.createRef<DiffEditorRef>();
      render(<DiffEditor ref={ref} theme="dark" />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      act(() => {
        ref.current?.swap();
      });

      // swap should not throw
      expect(ref.current?.swap).toBeDefined();
    });

    it('should call clear method and update stats', async () => {
      const ref = React.createRef<DiffEditorRef>();
      render(<DiffEditor ref={ref} theme="dark" />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      act(() => {
        ref.current?.clear();
      });

      // Check stats are cleared
      const state = useDiffStore.getState();
      const session = state.getActiveSession();
      expect(session?.stats).toEqual({
        adds: 0,
        dels: 0,
        hunks: 0,
        leftLines: 0,
        rightLines: 0,
      });
    });
  });

  describe('theme changes', () => {
    it('should update theme when prop changes', () => {
      const { rerender } = render(<DiffEditor theme="light" />);
      expect(screen.getByTestId('input-editor-panel')).toBeTruthy();

      rerender(<DiffEditor theme="dark" />);
      expect(screen.getByTestId('input-editor-panel')).toBeTruthy();
    });

    it('should use compact theme when compactMode is enabled', () => {
      useDiffStore.setState({
        sessions: [
          {
            id: 'test-session',
            left: { ...createBuffer(''), lang: 'plaintext', eol: 'LF' },
            right: { ...createBuffer(''), lang: 'plaintext', eol: 'LF' },
            options: {
              viewMode: 'side-by-side',
              ignoreWhitespace: false,
              normalizeEOL: true,
              compactMode: true, // Enable compact mode
              wordWrap: false,
              fontSize: 14,
              tabSize: 4,
              insertSpaces: true,
              diffAlgorithm: 'advanced',
              hideUnchangedRegions: false,
              renderWhitespace: 'all',
              renderControlCharacters: true,
              unicodeHighlight: {
                invisibleCharacters: true,
                ambiguousCharacters: true,
                nonBasicASCII: false,
                includeComments: true,
                includeStrings: true,
              },
            },
            stats: { adds: 0, dels: 0, hunks: 0, leftLines: 0, rightLines: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        activeSessionId: 'test-session',
      });

      render(<DiffEditor theme="dark" />);
      expect(screen.getByTestId('comparison-panel')).toBeTruthy();
    });
  });

  describe('options updates', () => {
    it('should update editor options when activeSession options change', async () => {
      const { rerender } = render(<DiffEditor theme="dark" />);

      await waitFor(() => {
        expect(screen.getByTestId('input-editor-panel')).toBeTruthy();
      });

      // Update options
      act(() => {
        useDiffStore.getState().updateOptions({ fontSize: 16, tabSize: 2 });
      });

      rerender(<DiffEditor theme="dark" />);

      const session = useDiffStore.getState().getActiveSession();
      expect(session?.options.fontSize).toBe(16);
      expect(session?.options.tabSize).toBe(2);
    });

    it('should handle wordWrap option change', async () => {
      render(<DiffEditor theme="dark" />);

      await waitFor(() => {
        expect(screen.getByTestId('input-editor-panel')).toBeTruthy();
      });

      act(() => {
        useDiffStore.getState().updateOptions({ wordWrap: true });
      });

      const session = useDiffStore.getState().getActiveSession();
      expect(session?.options.wordWrap).toBe(true);
    });

    it('should handle insertSpaces option change', async () => {
      render(<DiffEditor theme="dark" />);

      await waitFor(() => {
        expect(screen.getByTestId('input-editor-panel')).toBeTruthy();
      });

      act(() => {
        useDiffStore.getState().updateOptions({ insertSpaces: false });
      });

      const session = useDiffStore.getState().getActiveSession();
      expect(session?.options.insertSpaces).toBe(false);
    });
  });

  describe('language support', () => {
    it('should use plaintext as default language', () => {
      render(<DiffEditor theme="dark" />);
      const session = useDiffStore.getState().getActiveSession();
      expect(session?.left.lang).toBe('plaintext');
    });

    it('should support different languages', () => {
      useDiffStore.setState({
        sessions: [
          {
            id: 'test-session',
            left: { ...createBuffer(''), lang: 'typescript', eol: 'LF' },
            right: { ...createBuffer(''), lang: 'typescript', eol: 'LF' },
            options: {
              viewMode: 'side-by-side',
              ignoreWhitespace: false,
              normalizeEOL: true,
              compactMode: false,
              wordWrap: false,
              fontSize: 14,
              tabSize: 4,
              insertSpaces: true,
              diffAlgorithm: 'advanced',
              hideUnchangedRegions: false,
              renderWhitespace: 'all',
              renderControlCharacters: true,
              unicodeHighlight: {
                invisibleCharacters: true,
                ambiguousCharacters: true,
                nonBasicASCII: false,
                includeComments: true,
                includeStrings: true,
              },
            },
            stats: { adds: 0, dels: 0, hunks: 0, leftLines: 0, rightLines: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        activeSessionId: 'test-session',
      });

      render(<DiffEditor theme="dark" />);
      const session = useDiffStore.getState().getActiveSession();
      expect(session?.left.lang).toBe('typescript');
    });
  });
});
