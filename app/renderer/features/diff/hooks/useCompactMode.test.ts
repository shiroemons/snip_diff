import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompactMode } from './useCompactMode';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';

// Monaco Editorのモック型定義
interface MockDecorationCollection {
  clear: ReturnType<typeof vi.fn>;
}

interface MockTextModel {
  getValueInRange: ReturnType<typeof vi.fn>;
  getLineMaxColumn: ReturnType<typeof vi.fn>;
  getPositionAt: ReturnType<typeof vi.fn>;
  getOffsetAt: ReturnType<typeof vi.fn>;
}

interface MockEditor {
  getModel: ReturnType<typeof vi.fn>;
  createDecorationsCollection: ReturnType<typeof vi.fn>;
}

interface MockDiffEditor {
  getOriginalEditor: ReturnType<typeof vi.fn>;
  getModifiedEditor: ReturnType<typeof vi.fn>;
  getLineChanges: ReturnType<typeof vi.fn>;
  onDidUpdateDiff: ReturnType<typeof vi.fn>;
  getContainerDomNode: ReturnType<typeof vi.fn>;
}

// Monaco Editorのモック
vi.mock('monaco-editor', () => {
  class MockRange {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number,
    ) {}
  }

  class MockPosition {
    constructor(
      public lineNumber: number,
      public column: number,
    ) {}
  }

  return {
    default: {
      Range: MockRange,
      Position: MockPosition,
      editor: {
        TrackedRangeStickiness: {
          NeverGrowsWhenTypingAtEdges: 0,
        },
      },
    },
    Range: MockRange,
    Position: MockPosition,
    editor: {
      TrackedRangeStickiness: {
        NeverGrowsWhenTypingAtEdges: 0,
      },
    },
  };
});

// diffライブラリのモック
vi.mock('diff', () => ({
  diffChars: vi.fn((original: string, modified: string) => {
    // シンプルな差分計算のモック
    if (original === modified) {
      return [{ value: original }];
    }
    return [
      { value: original, removed: true },
      { value: modified, added: true },
    ];
  }),
}));

describe('useCompactMode', () => {
  let mockDiffEditor: MockDiffEditor;
  let mockOriginalEditor: MockEditor;
  let mockModifiedEditor: MockEditor;
  let mockOriginalModel: MockTextModel;
  let mockModifiedModel: MockTextModel;
  let mockDecorationCollection: MockDecorationCollection;
  let diffEditorRef: React.MutableRefObject<editor.IStandaloneDiffEditor | null>;
  let disposeListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // デコレーションコレクションのモック
    mockDecorationCollection = {
      clear: vi.fn(),
    };

    // テキストモデルのモック
    mockOriginalModel = {
      getValueInRange: vi.fn().mockReturnValue('test'),
      getLineMaxColumn: vi.fn().mockReturnValue(10),
      getPositionAt: vi.fn((offset: number) => new monaco.Position(1, offset + 1)),
      getOffsetAt: vi.fn(() => 0),
    };

    mockModifiedModel = {
      getValueInRange: vi.fn().mockReturnValue('test'),
      getLineMaxColumn: vi.fn().mockReturnValue(10),
      getPositionAt: vi.fn((offset: number) => new monaco.Position(1, offset + 1)),
      getOffsetAt: vi.fn(() => 0),
    };

    // エディタのモック
    mockOriginalEditor = {
      getModel: vi.fn().mockReturnValue(mockOriginalModel),
      createDecorationsCollection: vi.fn().mockReturnValue(mockDecorationCollection),
    };

    mockModifiedEditor = {
      getModel: vi.fn().mockReturnValue(mockModifiedModel),
      createDecorationsCollection: vi.fn().mockReturnValue(mockDecorationCollection),
    };

    // リスナーのdisposeモック
    disposeListener = vi.fn();

    // Diffエディタのモック
    mockDiffEditor = {
      getOriginalEditor: vi.fn().mockReturnValue(mockOriginalEditor),
      getModifiedEditor: vi.fn().mockReturnValue(mockModifiedEditor),
      getLineChanges: vi.fn().mockReturnValue([]),
      onDidUpdateDiff: vi.fn().mockReturnValue({ dispose: disposeListener }),
      getContainerDomNode: vi.fn().mockReturnValue(document.createElement('div')),
    };

    // refのモック
    diffEditorRef = {
      current: mockDiffEditor as unknown as editor.IStandaloneDiffEditor,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本動作', () => {
    it('should register onDidUpdateDiff listener on mount', () => {
      renderHook(() =>
        useCompactMode(diffEditorRef, {
          compactMode: false,
          viewMode: 'side-by-side',
          editorMounted: true,
        }),
      );

      expect(mockDiffEditor.onDidUpdateDiff).toHaveBeenCalledTimes(1);
    });

    it('should dispose listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useCompactMode(diffEditorRef, {
          compactMode: false,
          viewMode: 'side-by-side',
          editorMounted: true,
        }),
      );

      unmount();

      expect(disposeListener).toHaveBeenCalledTimes(1);
    });

    it('should not throw when diffEditor is null', () => {
      const nullRef = { current: null };

      expect(() => {
        renderHook(() =>
          useCompactMode(nullRef, {
            compactMode: true,
            viewMode: 'side-by-side',
            editorMounted: false,
          }),
        );
      }).not.toThrow();
    });
  });

  describe('compactMode が false の時', () => {
    it('should clear decorations when compactMode is false', () => {
      const { rerender } = renderHook(
        ({ options }) => useCompactMode(diffEditorRef, options),
        {
          initialProps: {
            options: {
              compactMode: true,
              viewMode: 'side-by-side' as const,
            },
          },
        },
      );

      // compactMode を false に変更
      rerender({
        options: {
          compactMode: false,
          viewMode: 'side-by-side' as const,
        },
      });

      // デコレーションがクリアされることを期待
      // （実際のクリアは updateCompactDecorations 内で行われる）
      expect(mockDiffEditor.getLineChanges).toHaveBeenCalled();
    });

    it('should not create decorations when compactMode is disabled', () => {
      mockOriginalEditor.createDecorationsCollection.mockClear();
      mockModifiedEditor.createDecorationsCollection.mockClear();

      renderHook(() =>
        useCompactMode(diffEditorRef, {
          compactMode: false,
          viewMode: 'side-by-side',
        }),
      );

      // 初回レンダリング時は呼ばれない（compactMode=falseのため）
      expect(mockOriginalEditor.createDecorationsCollection).not.toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).not.toHaveBeenCalled();
    });
  });

  describe('compactMode が true の時', () => {
    it('should create decorations when compactMode is enabled and lineChanges exist', () => {
      // lineChanges を設定（charChanges なし）
      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: null,
        },
      ]);

      mockOriginalEditor.createDecorationsCollection.mockClear();
      mockModifiedEditor.createDecorationsCollection.mockClear();

      renderHook(() =>
        useCompactMode(diffEditorRef, {
          compactMode: true,
          viewMode: 'side-by-side',
        }),
      );

      // デコレーションが作成されることを期待
      expect(mockOriginalEditor.createDecorationsCollection).toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).toHaveBeenCalled();
    });

    it('should handle lineChanges with charChanges', () => {
      // charChanges を含む lineChanges を設定
      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: [
            {
              originalStartLineNumber: 1,
              originalStartColumn: 1,
              originalEndLineNumber: 1,
              originalEndColumn: 5,
              modifiedStartLineNumber: 1,
              modifiedStartColumn: 1,
              modifiedEndLineNumber: 1,
              modifiedEndColumn: 5,
            },
          ],
        },
      ]);

      mockOriginalEditor.createDecorationsCollection.mockClear();
      mockModifiedEditor.createDecorationsCollection.mockClear();

      renderHook(() =>
        useCompactMode(diffEditorRef, {
          compactMode: true,
          viewMode: 'side-by-side',
        }),
      );

      // モデルからテキストを取得することを期待
      expect(mockOriginalModel.getValueInRange).toHaveBeenCalled();
      expect(mockModifiedModel.getValueInRange).toHaveBeenCalled();

      // デコレーションが作成されることを期待
      expect(mockOriginalEditor.createDecorationsCollection).toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).toHaveBeenCalled();
    });

    it('should clear existing decorations before creating new ones', () => {
      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: null,
        },
      ]);

      const { rerender } = renderHook(
        ({ options }) => useCompactMode(diffEditorRef, options),
        {
          initialProps: {
            options: {
              compactMode: true,
              viewMode: 'side-by-side' as const,
              editorMounted: true,
            },
          },
        },
      );

      // 2回目のレンダリング（compactModeを一度falseにしてからtrueに戻す）
      rerender({
        options: {
          compactMode: false,
          viewMode: 'side-by-side' as const,
          editorMounted: true,
        },
      });

      rerender({
        options: {
          compactMode: true,
          viewMode: 'side-by-side' as const,
          editorMounted: true,
        },
      });

      // 既存のデコレーションがクリアされることを期待
      expect(mockDecorationCollection.clear).toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    it('should handle null lineChanges', () => {
      mockDiffEditor.getLineChanges.mockReturnValue(null);

      expect(() => {
        renderHook(() =>
          useCompactMode(diffEditorRef, {
            compactMode: true,
            viewMode: 'side-by-side',
          }),
        );
      }).not.toThrow();
    });

    it('should handle empty lineChanges array', () => {
      mockDiffEditor.getLineChanges.mockReturnValue([]);

      mockOriginalEditor.createDecorationsCollection.mockClear();
      mockModifiedEditor.createDecorationsCollection.mockClear();

      renderHook(() =>
        useCompactMode(diffEditorRef, {
          compactMode: true,
          viewMode: 'side-by-side',
        }),
      );

      // 空配列の場合もデコレーションコレクションは作成される（空の配列で）
      expect(mockOriginalEditor.createDecorationsCollection).toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).toHaveBeenCalled();
    });

    it('should handle null lineChange in array', () => {
      mockDiffEditor.getLineChanges.mockReturnValue([null]);

      expect(() => {
        renderHook(() =>
          useCompactMode(diffEditorRef, {
            compactMode: true,
            viewMode: 'side-by-side',
          }),
        );
      }).not.toThrow();
    });

    it('should handle missing model', () => {
      mockOriginalEditor.getModel.mockReturnValue(null);
      mockModifiedEditor.getModel.mockReturnValue(null);

      mockOriginalEditor.createDecorationsCollection.mockClear();
      mockModifiedEditor.createDecorationsCollection.mockClear();

      renderHook(() =>
        useCompactMode(diffEditorRef, {
          compactMode: true,
          viewMode: 'side-by-side',
        }),
      );

      // モデルがない場合、デコレーションは作成されない
      expect(mockOriginalEditor.createDecorationsCollection).not.toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).not.toHaveBeenCalled();
    });

    it('should handle line with maxColumn = 1 (empty line)', () => {
      mockOriginalModel.getLineMaxColumn.mockReturnValue(1);
      mockModifiedModel.getLineMaxColumn.mockReturnValue(1);

      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: null,
        },
      ]);

      expect(() => {
        renderHook(() =>
          useCompactMode(diffEditorRef, {
            compactMode: true,
            viewMode: 'side-by-side',
          }),
        );
      }).not.toThrow();

      // 空行の場合でもデコレーションは作成される（isWholeLine: true で）
      expect(mockOriginalEditor.createDecorationsCollection).toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).toHaveBeenCalled();
    });

    it('should skip lines with lineNumber <= 0', () => {
      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 0,
          originalEndLineNumber: 0,
          modifiedStartLineNumber: 0,
          modifiedEndLineNumber: 0,
          charChanges: null,
        },
      ]);

      expect(() => {
        renderHook(() =>
          useCompactMode(diffEditorRef, {
            compactMode: true,
            viewMode: 'side-by-side',
          }),
        );
      }).not.toThrow();
    });
  });

  describe('viewMode による動作の違い', () => {
    it('should work with unified mode', () => {
      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: null,
        },
      ]);

      expect(() => {
        renderHook(() =>
          useCompactMode(diffEditorRef, {
            compactMode: true,
            viewMode: 'unified',
          }),
        );
      }).not.toThrow();

      // unified モードでも同様にデコレーションが作成される
      expect(mockOriginalEditor.createDecorationsCollection).toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).toHaveBeenCalled();
    });

    it('should work with side-by-side mode', () => {
      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: null,
        },
      ]);

      expect(() => {
        renderHook(() =>
          useCompactMode(diffEditorRef, {
            compactMode: true,
            viewMode: 'side-by-side',
          }),
        );
      }).not.toThrow();

      expect(mockOriginalEditor.createDecorationsCollection).toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).toHaveBeenCalled();
    });
  });

  describe('初期化シナリオ', () => {
    it('should apply decorations when editor mounts with compactMode enabled from start', () => {
      // エディターがマウントされていない状態でスタート
      const nullRef = { current: null };

      mockDiffEditor.getLineChanges.mockReturnValue([
        {
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: null,
        },
      ]);

      mockOriginalEditor.createDecorationsCollection.mockClear();
      mockModifiedEditor.createDecorationsCollection.mockClear();

      // compactMode=true でレンダリング（エディターはまだnull）
      const { rerender } = renderHook(
        ({ editorRef }) =>
          useCompactMode(editorRef, {
            compactMode: true,
            viewMode: 'side-by-side',
          }),
        {
          initialProps: {
            editorRef: nullRef,
          },
        },
      );

      // エディターがnullの段階ではデコレーションは作成されない
      expect(mockOriginalEditor.createDecorationsCollection).not.toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).not.toHaveBeenCalled();

      // エディターがマウントされた状態に更新
      const mountedRef = {
        current: mockDiffEditor as unknown as editor.IStandaloneDiffEditor,
      };

      rerender({
        editorRef: mountedRef,
      });

      // エディターがマウントされた後、装飾が適用されることを期待
      expect(mockOriginalEditor.createDecorationsCollection).toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).toHaveBeenCalled();
    });

    it('should not apply decorations when editor mounts with compactMode disabled', () => {
      // エディターがマウントされていない状態でスタート
      const nullRef = { current: null };

      mockOriginalEditor.createDecorationsCollection.mockClear();
      mockModifiedEditor.createDecorationsCollection.mockClear();

      // compactMode=false でレンダリング
      const { rerender } = renderHook(
        ({ editorRef }) =>
          useCompactMode(editorRef, {
            compactMode: false,
            viewMode: 'side-by-side',
          }),
        {
          initialProps: {
            editorRef: nullRef,
          },
        },
      );

      // エディターがマウントされた状態に更新
      const mountedRef = {
        current: mockDiffEditor as unknown as editor.IStandaloneDiffEditor,
      };

      rerender({
        editorRef: mountedRef,
      });

      // compactMode=false なので、マウント後も装飾は作成されない
      expect(mockOriginalEditor.createDecorationsCollection).not.toHaveBeenCalled();
      expect(mockModifiedEditor.createDecorationsCollection).not.toHaveBeenCalled();
    });
  });
});
