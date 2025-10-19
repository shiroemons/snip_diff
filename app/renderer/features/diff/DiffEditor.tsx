import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { DiffEditor as MonacoDiffEditor, Editor as MonacoEditor, loader } from '@monaco-editor/react';
import { useDiffStore } from '../../stores/diffStore';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import './DiffEditor.css';

// Monaco Editor のローダー設定 - ローカルから読み込み
loader.config({ monaco });

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
            <div className="compare-panel-content">
              <MonacoDiffEditor
                original={leftContent}
                modified={rightContent}
                language={language}
                theme={theme === 'light' ? 'vs' : 'vs-dark'}
                onMount={handleDiffEditorDidMount}
                options={{
                  readOnly: true,
                  renderSideBySide: activeSession?.options.viewMode === 'side-by-side',
                  ignoreTrimWhitespace: activeSession?.options.ignoreWhitespace ?? false,
                  originalEditable: false,
                  automaticLayout: true,
                  fontSize: activeSession?.options.fontSize ?? 14,
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
