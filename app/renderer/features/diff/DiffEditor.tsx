import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { DiffEditor as MonacoDiffEditor, Editor as MonacoEditor, loader } from '@monaco-editor/react';
import { useDiffStore } from '../../stores/diffStore';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import './DiffEditor.css';

// Monaco Editor のローダー設定 - ローカルから読み込み
loader.config({ monaco });

const getTextFromModel = (
  model: editor.ITextModel | null,
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
) => {
  if (!model) return '';
  if (startLine <= 0 || startColumn <= 0 || endLine <= 0 || endColumn <= 0) {
    return '';
  }
  return model.getValueInRange(
    new monaco.Range(startLine, startColumn, endLine, endColumn),
  );
};

const computeCommonPrefixLength = (a: string, b: string) => {
  const max = Math.min(a.length, b.length);
  let index = 0;
  while (index < max && a[index] === b[index]) {
    index += 1;
  }
  return index;
};

const computeCommonSuffixLength = (a: string, b: string, prefixLength: number) => {
  const aRemaining = a.length - prefixLength;
  const bRemaining = b.length - prefixLength;
  const max = Math.min(aRemaining, bRemaining);
  let index = 0;
  while (
    index < max
    && a[a.length - 1 - index] === b[b.length - 1 - index]
  ) {
    index += 1;
  }
  return index;
};

const computeTrimmedRange = (
  model: editor.ITextModel | null,
  startLine: number,
  startColumn: number,
  text: string,
  prefixLength: number,
  suffixLength: number,
) => {
  if (!model) return undefined;
  if (startLine <= 0 || startColumn <= 0) return undefined;

  const trimmedLength = text.length - prefixLength - suffixLength;
  if (trimmedLength <= 0) return undefined;

  const startPosition = new monaco.Position(startLine, startColumn);
  const startOffset = model.getOffsetAt(startPosition);
  const trimmedStartOffset = startOffset + prefixLength;
  const trimmedEndOffset = startOffset + text.length - suffixLength;

  if (trimmedEndOffset <= trimmedStartOffset) {
    return undefined;
  }

  const trimmedStartPosition = model.getPositionAt(trimmedStartOffset);
  const trimmedEndPosition = model.getPositionAt(trimmedEndOffset);

  return new monaco.Range(
    trimmedStartPosition.lineNumber,
    trimmedStartPosition.column,
    trimmedEndPosition.lineNumber,
    trimmedEndPosition.column,
  );
};

const splitRangeToSingleLine = (model: editor.ITextModel, range: monaco.Range) => {
  if (range.startLineNumber === range.endLineNumber) {
    if (range.startColumn === range.endColumn) {
      return [];
    }
    return [range];
  }

  const ranges: monaco.Range[] = [];
  for (let line = range.startLineNumber; line <= range.endLineNumber; line += 1) {
    const startColumn = line === range.startLineNumber ? range.startColumn : 1;
    const endColumn =
      line === range.endLineNumber
        ? range.endColumn
        : model.getLineMaxColumn(line);
    if (startColumn === endColumn) continue;
    ranges.push(new monaco.Range(line, startColumn, line, endColumn));
  }
  return ranges;
};

// Compactモード用のカスタムテーマを定義（行背景なし、文字ハイライトのみ）
const defineCompactThemes = () => {
  // ダークテーマ - 視認性を向上させた色設定
  monaco.editor.defineTheme('compact-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      // 文字レベルの差分ハイライト
      'diffEditor.insertedTextBackground': '#3fb95080',  // 追加文字のハイライト（明るい緑、50%透明度）
      'diffEditor.removedTextBackground': '#f8514980',   // 削除文字のハイライト（明るい赤、50%透明度）

      // 行レベルの背景を完全に透明化
      'diffEditor.insertedLineBackground': '#00000000',
      'diffEditor.removedLineBackground': '#00000000',

      // Gutterの背景も透明化
      'diffEditorGutter.insertedLineBackground': '#00000000',
      'diffEditorGutter.removedLineBackground': '#00000000',

      // Overview rulerも透明化
      'diffEditorOverview.insertedForeground': '#00000000',
      'diffEditorOverview.removedForeground': '#00000000',

      // その他の境界線等も透明化
      'diffEditor.border': '#00000000',
      'diffEditor.diagonalFill': '#00000000',
    },
  });

  // ライトテーマ - より明確な色設定
  monaco.editor.defineTheme('compact-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      // 文字レベルの差分ハイライト
      'diffEditor.insertedTextBackground': '#acf2bd60',  // 追加文字のハイライト（明るい緑、40%透明度）
      'diffEditor.removedTextBackground': '#ffeef060',   // 削除文字のハイライト（明るい赤、40%透明度）

      // 行レベルの背景を完全に透明化
      'diffEditor.insertedLineBackground': '#00000000',
      'diffEditor.removedLineBackground': '#00000000',

      // Gutterの背景も透明化
      'diffEditorGutter.insertedLineBackground': '#00000000',
      'diffEditorGutter.removedLineBackground': '#00000000',

      // Overview rulerも透明化
      'diffEditorOverview.insertedForeground': '#00000000',
      'diffEditorOverview.removedForeground': '#00000000',

      // その他の境界線等も透明化
      'diffEditor.border': '#00000000',
      'diffEditor.diagonalFill': '#00000000',
    },
  });
};

// テーマを一度だけ定義
let themesInitialized = false;

export interface DiffEditorRef {
  compare: () => void;
  swap: () => void;
  clear: () => void;
}

interface DiffEditorProps {
  theme?: 'light' | 'dark';
}

const DiffEditor = forwardRef<DiffEditorRef, DiffEditorProps>(({ theme = 'dark' }, ref) => {
  const { getActiveSession, updateStats } = useDiffStore();
  const activeSession = getActiveSession();
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const leftEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const rightEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const compactDecorationsRef = useRef<{ original: string[]; modified: string[] }>({
    original: [],
    modified: [],
  });
  const [showComparePanel, setShowComparePanel] = useState(true);
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [comparePanelHeight, setComparePanelHeight] = useState(350);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const lastHeightRef = useRef<number>(350);

  // storeから言語を取得
  const language = activeSession?.left.lang || 'plaintext';

  // Compactテーマの初期化
  useEffect(() => {
    if (!themesInitialized) {
      defineCompactThemes();
      themesInitialized = true;
    }
  }, []);

  // compactModeに応じたテーマ名を取得
  const getThemeName = () => {
    if (activeSession?.options.compactMode) {
      return theme === 'light' ? 'compact-light' : 'compact-dark';
    }
    return theme === 'light' ? 'vs' : 'vs-dark';
  };

  // 比較を実行する関数
  const handleCompare = () => {
    const leftValue = leftEditorRef.current?.getValue() || '';
    const rightValue = rightEditorRef.current?.getValue() || '';

    setLeftContent(leftValue);
    setRightContent(rightValue);

    // 統計を計算
    const leftLines = leftValue.split('\n').length;
    const rightLines = rightValue.split('\n').length;

    updateStats({
      adds: Math.max(0, rightLines - leftLines),
      dels: Math.max(0, leftLines - rightLines),
      hunks: 1,
      leftLines,
      rightLines,
    });

    // 比較パネルを表示
    setShowComparePanel(true);
  };

  // 全画面表示の切り替え
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 最小化の切り替え
  const handleToggleMinimize = () => {
    if (isMinimized) {
      // 復元
      setComparePanelHeight(lastHeightRef.current);
      setIsMinimized(false);
    } else {
      // 最小化
      lastHeightRef.current = comparePanelHeight;
      setIsMinimized(true);
    }
  };

  // 左右を入れ替え
  const handleSwap = () => {
    const leftValue = leftEditorRef.current?.getValue() || '';
    const rightValue = rightEditorRef.current?.getValue() || '';

    leftEditorRef.current?.setValue(rightValue);
    rightEditorRef.current?.setValue(leftValue);
  };

  // クリア
  const handleClear = () => {
    leftEditorRef.current?.setValue('');
    rightEditorRef.current?.setValue('');

    setLeftContent('');
    setRightContent('');

    updateStats({
      adds: 0,
      dels: 0,
      hunks: 0,
      leftLines: 0,
      rightLines: 0,
    });
  };

  // 左エディタに貼り付け
  const handlePasteLeft = async () => {
    if (!window.electron) return;
    try {
      const text = await window.electron.clipboard.read();
      leftEditorRef.current?.setValue(text);
    } catch (error) {
      console.error('Failed to paste to left editor:', error);
    }
  };

  // 右エディタに貼り付け
  const handlePasteRight = async () => {
    if (!window.electron) return;
    try {
      const text = await window.electron.clipboard.read();
      rightEditorRef.current?.setValue(text);
    } catch (error) {
      console.error('Failed to paste to right editor:', error);
    }
  };

  // 左エディタをクリア
  const handleClearLeft = () => {
    leftEditorRef.current?.setValue('');
  };

  // 右エディタをクリア
  const handleClearRight = () => {
    rightEditorRef.current?.setValue('');
  };

  // リサイズハンドルのマウスダウン
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = {
      y: e.clientY,
      height: comparePanelHeight,
    };
    setIsResizing(true);
    document.body.classList.add('resizing-panel');
  };

  // リサイズ中のマウス移動処理
  useEffect(() => {
    if (!isResizing || !dragStartRef.current) return;

    let animationFrameId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (!dragStartRef.current) return;

        const deltaY = dragStartRef.current.y - e.clientY;
        const newHeight = dragStartRef.current.height + deltaY;

        const containerHeight = window.innerHeight - 100; // ヘッダーとフッターを除く
        // 最小200px、最大80%に制限
        const minHeight = 200;
        const maxHeight = containerHeight * 0.8;
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        setComparePanelHeight(clampedHeight);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      dragStartRef.current = null;
      document.body.classList.remove('resizing-panel');
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing-panel');
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isResizing]);

  // 外部から呼び出せるようにメソッドを公開
  useImperativeHandle(ref, () => ({
    compare: handleCompare,
    swap: handleSwap,
    clear: handleClear,
  }));

  // 左エディタのマウント処理
  const handleLeftEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    leftEditorRef.current = editor;

    // 内容が変更されたら即座に差分を更新
    editor.onDidChangeModelContent(() => {
      const leftValue = editor.getValue();
      const rightValue = rightEditorRef.current?.getValue() || '';

      setLeftContent(leftValue);

      // 統計を更新
      const leftLines = leftValue.split('\n').length;
      const rightLines = rightValue.split('\n').length;

      updateStats({
        adds: Math.max(0, rightLines - leftLines),
        dels: Math.max(0, leftLines - rightLines),
        hunks: 1,
        leftLines,
        rightLines,
      });
    });
  };

  // 右エディタのマウント処理
  const handleRightEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    rightEditorRef.current = editor;

    // 内容が変更されたら即座に差分を更新
    editor.onDidChangeModelContent(() => {
      const leftValue = leftEditorRef.current?.getValue() || '';
      const rightValue = editor.getValue();

      setRightContent(rightValue);

      // 統計を更新
      const leftLines = leftValue.split('\n').length;
      const rightLines = rightValue.split('\n').length;

      updateStats({
        adds: Math.max(0, rightLines - leftLines),
        dels: Math.max(0, leftLines - rightLines),
        hunks: 1,
        leftLines,
        rightLines,
      });
    });
  };

  // Diffエディタのマウント処理
  const handleDiffEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor;
  };

  const clearCompactDecorations = useCallback(() => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedEditor = diffEditor.getModifiedEditor();

    if (originalEditor && compactDecorationsRef.current.original.length > 0) {
      compactDecorationsRef.current.original = originalEditor.deltaDecorations(
        compactDecorationsRef.current.original,
        [],
      );
    }
    if (modifiedEditor && compactDecorationsRef.current.modified.length > 0) {
      compactDecorationsRef.current.modified = modifiedEditor.deltaDecorations(
        compactDecorationsRef.current.modified,
        [],
      );
    }
  }, []);

  const updateCompactDecorations = useCallback(() => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedEditor = diffEditor.getModifiedEditor();
    const originalModel = originalEditor?.getModel() ?? null;
    const modifiedModel = modifiedEditor?.getModel() ?? null;

    if (!activeSession?.options.compactMode) {
      clearCompactDecorations();
      return;
    }

    if (!originalEditor || !modifiedEditor || !originalModel || !modifiedModel) {
      clearCompactDecorations();
      return;
    }

    const lineChanges = diffEditor.getLineChanges();
    if (!lineChanges) {
      clearCompactDecorations();
      return;
    }

    const originalDecorations: monaco.editor.IModelDeltaDecoration[] = [];
    const modifiedDecorations: monaco.editor.IModelDeltaDecoration[] = [];

    lineChanges.forEach((lineChange) => {
      if (!lineChange) {
        return;
      }

      if (!lineChange.charChanges || lineChange.charChanges.length === 0) {
        for (
          let line = lineChange.originalStartLineNumber;
          line <= lineChange.originalEndLineNumber;
          line += 1
        ) {
          if (line <= 0) continue;
          const maxColumn = originalModel.getLineMaxColumn(line);
          if (maxColumn > 1) {
            originalDecorations.push({
              range: new monaco.Range(line, 1, line, maxColumn),
              options: {
                inlineClassName: 'compact-diff-delete',
                stickiness:
                  monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            });
          } else {
            originalDecorations.push({
              range: new monaco.Range(line, 1, line, 1),
              options: {
                className: 'compact-diff-empty-line-delete',
                isWholeLine: true,
              },
            });
          }
        }
        for (
          let line = lineChange.modifiedStartLineNumber;
          line <= lineChange.modifiedEndLineNumber;
          line += 1
        ) {
          if (line <= 0) continue;
          const maxColumn = modifiedModel.getLineMaxColumn(line);
          if (maxColumn > 1) {
            modifiedDecorations.push({
              range: new monaco.Range(line, 1, line, maxColumn),
              options: {
                inlineClassName: 'compact-diff-insert',
                stickiness:
                  monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            });
          } else {
            modifiedDecorations.push({
              range: new monaco.Range(line, 1, line, 1),
              options: {
                className: 'compact-diff-empty-line-insert',
                isWholeLine: true,
              },
            });
          }
        }
        return;
      }

      lineChange.charChanges.forEach((charChange) => {
        const originalText = getTextFromModel(
          originalModel,
          charChange.originalStartLineNumber,
          charChange.originalStartColumn,
          charChange.originalEndLineNumber,
          charChange.originalEndColumn,
        );
        const modifiedText = getTextFromModel(
          modifiedModel,
          charChange.modifiedStartLineNumber,
          charChange.modifiedStartColumn,
          charChange.modifiedEndLineNumber,
          charChange.modifiedEndColumn,
        );

        const prefixLength = computeCommonPrefixLength(originalText, modifiedText);
        const suffixLength = computeCommonSuffixLength(
          originalText,
          modifiedText,
          prefixLength,
        );

        const trimmedOriginalRange = computeTrimmedRange(
          originalModel,
          charChange.originalStartLineNumber,
          charChange.originalStartColumn,
          originalText,
          prefixLength,
          suffixLength,
        );
        const trimmedModifiedRange = computeTrimmedRange(
          modifiedModel,
          charChange.modifiedStartLineNumber,
          charChange.modifiedStartColumn,
          modifiedText,
          prefixLength,
          suffixLength,
        );

        if (trimmedOriginalRange) {
          const ranges = splitRangeToSingleLine(originalModel, trimmedOriginalRange);
          ranges.forEach((range) => {
            originalDecorations.push({
              range,
              options: {
                inlineClassName: 'compact-diff-delete',
                stickiness:
                  monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            });
          });
        } else if (originalText.length > 0) {
          const fallbackRange = new monaco.Range(
            charChange.originalStartLineNumber,
            charChange.originalStartColumn,
            charChange.originalEndLineNumber,
            charChange.originalEndColumn,
          );
          const ranges = splitRangeToSingleLine(originalModel, fallbackRange);
          ranges.forEach((range) => {
            originalDecorations.push({
              range,
              options: {
                inlineClassName: 'compact-diff-delete',
                stickiness:
                  monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            });
          });
        }

        if (trimmedModifiedRange) {
          const ranges = splitRangeToSingleLine(modifiedModel, trimmedModifiedRange);
          ranges.forEach((range) => {
            modifiedDecorations.push({
              range,
              options: {
                inlineClassName: 'compact-diff-insert',
                stickiness:
                  monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            });
          });
        } else if (modifiedText.length > 0) {
          const fallbackRange = new monaco.Range(
            charChange.modifiedStartLineNumber,
            charChange.modifiedStartColumn,
            charChange.modifiedEndLineNumber,
            charChange.modifiedEndColumn,
          );
          const ranges = splitRangeToSingleLine(modifiedModel, fallbackRange);
          ranges.forEach((range) => {
            modifiedDecorations.push({
              range,
              options: {
                inlineClassName: 'compact-diff-insert',
                stickiness:
                  monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            });
          });
        }
      });
    });

    compactDecorationsRef.current.original = originalEditor.deltaDecorations(
      compactDecorationsRef.current.original,
      originalDecorations,
    );
    compactDecorationsRef.current.modified = modifiedEditor.deltaDecorations(
      compactDecorationsRef.current.modified,
      modifiedDecorations,
    );
  }, [activeSession?.id, activeSession?.options.compactMode, clearCompactDecorations]);

  useEffect(() => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    const listener = diffEditor.onDidUpdateDiff(() => {
      updateCompactDecorations();
    });

    updateCompactDecorations();

    return () => {
      listener.dispose();
      clearCompactDecorations();
    };
  }, [updateCompactDecorations, clearCompactDecorations]);

  // 共通エディタオプション
  const commonEditorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: true },
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
    },
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    wordWrap: activeSession?.options.wordWrap ? 'on' : 'off',
    fontSize: activeSession?.options.fontSize ?? 14,
    tabSize: activeSession?.options.tabSize ?? 4,
    insertSpaces: activeSession?.options.insertSpaces ?? true,
    automaticLayout: true,
  };


  if (!activeSession) {
    return (
      <div className="diff-editor-container">
        <div className="no-session">セッションが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="diff-editor-container">
      {/* 上部: 入力エディタ */}
      <div
        className={`input-editor-section ${isResizing ? 'resizing' : ''}`}
        style={{
          height: showComparePanel
            ? isMinimized
              ? 'calc(100% - 40px)'
              : `calc(100% - ${comparePanelHeight}px)`
            : '100%',
        }}
      >
        <div className="editor-labels">
          <div className="editor-label editor-label-left">
            <span className="editor-label-text">Before</span>
            <div className="editor-label-actions">
              <button
                className="editor-label-button"
                onClick={handlePasteLeft}
                title="クリップボードから貼り付け (⌘V)"
              >
                📋
              </button>
              <button
                className="editor-label-button"
                onClick={handleClearLeft}
                title="クリア"
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="editor-label editor-label-right">
            <span className="editor-label-text">After</span>
            <div className="editor-label-actions">
              <button
                className="editor-label-button"
                onClick={handlePasteRight}
                title="クリップボードから貼り付け (⌘V)"
              >
                📋
              </button>
              <button
                className="editor-label-button"
                onClick={handleClearRight}
                title="クリア"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
        <div className="dual-editor-container">
          <div className="editor-pane">
            <MonacoEditor
              defaultValue={leftContent}
              language={language}
              theme={theme === 'light' ? 'vs' : 'vs-dark'}
              onMount={handleLeftEditorDidMount}
              options={commonEditorOptions}
            />
          </div>
          <div className="editor-divider"></div>
          <div className="editor-pane">
            <MonacoEditor
              defaultValue={rightContent}
              language={language}
              theme={theme === 'light' ? 'vs' : 'vs-dark'}
              onMount={handleRightEditorDidMount}
              options={commonEditorOptions}
            />
          </div>
        </div>
      </div>

      {/* 下部: 比較パネル */}
      {showComparePanel && (
        <div
          className={`compare-panel ${isFullscreen ? 'fullscreen' : ''} ${isMinimized ? 'minimized' : ''} ${isResizing ? 'resizing' : ''}`}
          style={{ height: isFullscreen ? '100%' : isMinimized ? '40px' : `${comparePanelHeight}px` }}
        >
          {/* リサイズハンドル */}
          {!isFullscreen && !isMinimized && (
            <div
              className={`resize-handle ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleResizeMouseDown}
            >
              <div className="resize-handle-bar" />
            </div>
          )}

          <div className="compare-panel-header">
            <span className="compare-panel-title">差分表示</span>
            <div className="compare-panel-controls">
              {/* ビューモード切替 */}
              <div className="view-mode-toggle">
                <button
                  className={activeSession?.options.viewMode === 'unified' ? 'active' : ''}
                  onClick={() => useDiffStore.getState().updateOptions({ viewMode: 'unified' })}
                  title="Unified (⌘1)"
                >
                  Unified
                </button>
                <button
                  className={activeSession?.options.viewMode === 'side-by-side' ? 'active' : ''}
                  onClick={() => useDiffStore.getState().updateOptions({ viewMode: 'side-by-side' })}
                  title="Side by Side (⌘2)"
                >
                  Side by Side
                </button>
              </div>
              {/* Compactモードチェックボックス */}
              <label className="compact-mode-checkbox">
                <input
                  type="checkbox"
                  checked={activeSession?.options.compactMode ?? false}
                  onChange={(e) => useDiffStore.getState().updateOptions({ compactMode: e.target.checked })}
                  title="Compact Mode (⌘3)"
                />
                <span>Compact</span>
              </label>
              <div className="compare-panel-actions">
                <button
                  className="panel-action-button"
                  onClick={handleToggleMinimize}
                  title={isMinimized ? 'パネルを復元' : 'パネルを最小化'}
                >
                  {isMinimized ? '▲' : '▼'}
                </button>
                <button
                  className="panel-action-button"
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? '元のサイズに戻す' : '全画面表示'}
                >
                  {isFullscreen ? '⊡' : '⛶'}
                </button>
              </div>
            </div>
          </div>
          {!isMinimized && (
            <div className={`compare-panel-content ${activeSession?.options.compactMode ? 'compact-mode' : ''}`}>
              <MonacoDiffEditor
                original={leftContent}
                modified={rightContent}
                language={language}
                theme={getThemeName()}
                onMount={handleDiffEditorDidMount}
                options={{
                  readOnly: true,
                  renderSideBySide: activeSession?.options.viewMode === 'side-by-side',
                  ignoreTrimWhitespace: true,  // 常に行末の空白を無視
                  originalEditable: false,
                  automaticLayout: true,
                  fontSize: activeSession?.options.fontSize ?? 14,
                  diffAlgorithm: 'advanced',
                  renderIndicators: !activeSession?.options.compactMode,  // Compactモードの時はインジケーターを非表示
                  renderWhitespace: 'none',
                  renderOverviewRuler: !activeSession?.options.compactMode,  // Compactモードの時はOverview Rulerを非表示
                  hideUnchangedRegions:
                    activeSession?.options.compactMode ||
                    activeSession?.options.hideUnchangedRegions
                      ? {
                          enabled: true,
                          revealLineCount: 3,
                          minimumLineCount: 3,
                          contextLineCount: 3,
                        }
                      : undefined,
                } as editor.IDiffEditorConstructionOptions}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DiffEditor.displayName = 'DiffEditor';

export default DiffEditor;
