import type React from 'react';
import {
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
import { diffChars } from 'diff';
import { Clipboard, Trash2, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
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
      // 文字レベルの差分ハイライトを完全に透明化（カスタムdecorationのみを使用）
      'diffEditor.insertedTextBackground': '#00000000',
      'diffEditor.removedTextBackground': '#00000000',

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
      // 文字レベルの差分ハイライトを完全に透明化（カスタムdecorationのみを使用）
      'diffEditor.insertedTextBackground': '#00000000',
      'diffEditor.removedTextBackground': '#00000000',

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
  const compactDecorationsRef = useRef<{
    original: editor.IEditorDecorationsCollection | null;
    modified: editor.IEditorDecorationsCollection | null
  }>({
    original: null,
    modified: null,
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
    if (compactDecorationsRef.current.original) {
      compactDecorationsRef.current.original.clear();
      compactDecorationsRef.current.original = null;
    }
    if (compactDecorationsRef.current.modified) {
      compactDecorationsRef.current.modified.clear();
      compactDecorationsRef.current.modified = null;
    }
  }, []);

  // Unifiedモードのview-zone内のchar-deleteクラスを修正
  const fixUnifiedModeCharHighlights = useCallback(() => {
    if (activeSession?.options.viewMode !== 'unified') return;
    if (!activeSession?.options.compactMode) return;

    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    const originalModel = diffEditor.getOriginalEditor()?.getModel();
    const modifiedModel = diffEditor.getModifiedEditor()?.getModel();
    if (!originalModel || !modifiedModel) return;

    const lineChanges = diffEditor.getLineChanges();
    if (!lineChanges) return;

    // DOMを直接操作して、char-deleteクラスを正しい範囲だけに適用
    setTimeout(() => {
      const editorElement = diffEditor.getContainerDomNode();
      const viewZones = editorElement.querySelectorAll('.view-lines.line-delete');

      lineChanges.forEach((lineChange) => {
        if (!lineChange?.charChanges) return;

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

          const charDiffs = diffChars(originalText, modifiedText);

          // このcharChange全体を含むchar-delete要素を探す
          viewZones.forEach((viewZone) => {
            const charDeleteSpans = viewZone.querySelectorAll('.char-delete');

            charDeleteSpans.forEach((span) => {
              const spanText = span.textContent || '';

              // このspanがoriginalTextと一致するか確認（改行を除いて比較）
              if (spanText === originalText || spanText === originalText.replace(/\n/g, '')) {
                // このspanを細かく分割してハイライトを適用
                const parent = span.parentNode;
                if (!parent) return;

                // 新しい要素を作成
                const fragment = document.createDocumentFragment();

                charDiffs.forEach((part) => {
                  if (part.removed) {
                    // 削除部分: char-deleteクラス付きのspanを作成
                    const newSpan = document.createElement('span');
                    newSpan.className = span.className;
                    newSpan.textContent = part.value;
                    fragment.appendChild(newSpan);
                  } else if (!part.added) {
                    // 共通部分: char-deleteクラスなしのspanを作成
                    const newSpan = document.createElement('span');
                    newSpan.className = span.className.replace('char-delete', '').trim();
                    newSpan.textContent = part.value;
                    fragment.appendChild(newSpan);
                  }
                  // added部分はスキップ（削除行には表示されない）
                });

                // 元のspanを新しい要素で置き換え
                parent.replaceChild(fragment, span);
              }
            });
          });
        });
      });
    }, 100); // Monaco側のレンダリングを待つため少し遅延
  }, [activeSession?.options.viewMode, activeSession?.options.compactMode]);

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

        // diffCharsで文字単位の詳細な差分を計算(中間の共通部分も除外)
        const charDiffs = diffChars(originalText, modifiedText);

        let originalOffset = 0;
        let modifiedOffset = 0;

        charDiffs.forEach((part) => {
          if (part.removed) {
            // 削除された部分をハイライト
            const startPos = originalModel.getPositionAt(
              originalModel.getOffsetAt(
                new monaco.Position(
                  charChange.originalStartLineNumber,
                  charChange.originalStartColumn,
                ),
              ) + originalOffset,
            );
            const endPos = originalModel.getPositionAt(
              originalModel.getOffsetAt(
                new monaco.Position(
                  charChange.originalStartLineNumber,
                  charChange.originalStartColumn,
                ),
              ) +
                originalOffset +
                part.value.length,
            );

            const range = new monaco.Range(
              startPos.lineNumber,
              startPos.column,
              endPos.lineNumber,
              endPos.column,
            );

            const ranges = splitRangeToSingleLine(originalModel, range);
            ranges.forEach((r) => {
              originalDecorations.push({
                range: r,
                options: {
                  inlineClassName: 'compact-diff-delete',
                  stickiness:
                    monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                },
              });
            });
          }

          if (part.added) {
            // 追加された部分をハイライト
            const startPos = modifiedModel.getPositionAt(
              modifiedModel.getOffsetAt(
                new monaco.Position(
                  charChange.modifiedStartLineNumber,
                  charChange.modifiedStartColumn,
                ),
              ) + modifiedOffset,
            );
            const endPos = modifiedModel.getPositionAt(
              modifiedModel.getOffsetAt(
                new monaco.Position(
                  charChange.modifiedStartLineNumber,
                  charChange.modifiedStartColumn,
                ),
              ) +
                modifiedOffset +
                part.value.length,
            );

            const range = new monaco.Range(
              startPos.lineNumber,
              startPos.column,
              endPos.lineNumber,
              endPos.column,
            );

            const ranges = splitRangeToSingleLine(modifiedModel, range);
            ranges.forEach((r) => {
              modifiedDecorations.push({
                range: r,
                options: {
                  inlineClassName: 'compact-diff-insert',
                  stickiness:
                    monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                },
              });
            });
          }

          // オフセットを更新(共通部分も含む)
          if (!part.added) {
            originalOffset += part.value.length;
          }
          if (!part.removed) {
            modifiedOffset += part.value.length;
          }
        });
      });
    });

    // 既存のdecorationsをクリア
    if (compactDecorationsRef.current.original) {
      compactDecorationsRef.current.original.clear();
    }
    if (compactDecorationsRef.current.modified) {
      compactDecorationsRef.current.modified.clear();
    }

    // 新しいdecorationsを設定
    compactDecorationsRef.current.original = originalEditor.createDecorationsCollection(originalDecorations);
    compactDecorationsRef.current.modified = modifiedEditor.createDecorationsCollection(modifiedDecorations);

    // UnifiedモードのDOMを修正
    fixUnifiedModeCharHighlights();
  }, [activeSession?.options.compactMode, clearCompactDecorations, fixUnifiedModeCharHighlights]);

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
    scrollBeyondLastLine: false,  // 最後の行を超えてスクロールしない
    scrollBeyondLastColumn: 0,     // 最後の列を超えてスクロールしない
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
                type="button"
                className="editor-label-button"
                onClick={handlePasteLeft}
                title="クリップボードから貼り付け (⌘V)"
              >
                <Clipboard size={16} />
              </button>
              <button
                type="button"
                className="editor-label-button"
                onClick={handleClearLeft}
                title="クリア"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="editor-label editor-label-right">
            <span className="editor-label-text">After</span>
            <div className="editor-label-actions">
              <button
                type="button"
                className="editor-label-button"
                onClick={handlePasteRight}
                title="クリップボードから貼り付け (⌘V)"
              >
                <Clipboard size={16} />
              </button>
              <button
                type="button"
                className="editor-label-button"
                onClick={handleClearRight}
                title="クリア"
              >
                <Trash2 size={16} />
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
              role="separator"
              aria-label="比較パネルのリサイズハンドル"
              aria-valuenow={comparePanelHeight}
              aria-valuemin={100}
              aria-valuemax={800}
              aria-orientation="horizontal"
              tabIndex={0}
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
                  type="button"
                  className={activeSession?.options.viewMode === 'unified' ? 'active' : ''}
                  onClick={() => useDiffStore.getState().updateOptions({ viewMode: 'unified' })}
                  title="Unified (⌘1)"
                >
                  Unified
                </button>
                <button
                  type="button"
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
                  type="button"
                  className="panel-action-button"
                  onClick={handleToggleMinimize}
                  title={isMinimized ? 'パネルを復元' : 'パネルを最小化'}
                >
                  {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  type="button"
                  className="panel-action-button"
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? '元のサイズに戻す' : '全画面表示'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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
                  ignoreTrimWhitespace: activeSession?.options.ignoreWhitespace ?? false,  // 空白無視オプションに基づいて行末の空白を制御
                  originalEditable: false,
                  automaticLayout: true,
                  fontSize: activeSession?.options.fontSize ?? 14,
                  tabSize: activeSession?.options.tabSize ?? 4,
                  insertSpaces: activeSession?.options.insertSpaces ?? true,
                  diffAlgorithm: 'advanced',
                  renderIndicators: !activeSession?.options.compactMode,  // Compactモードの時はインジケーターを非表示
                  renderWhitespace: 'none',
                  renderOverviewRuler: !activeSession?.options.compactMode,  // Compactモードの時はOverview Rulerを非表示
                  scrollBeyondLastLine: false,  // 最後の行を超えてスクロールしない
                  scrollBeyondLastColumn: 0,     // 最後の列を超えてスクロールしない
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
