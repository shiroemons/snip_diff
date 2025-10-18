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

  // 比較パネルを閉じる
  const handleCloseComparePanel = () => {
    setShowComparePanel(false);
  };

  // 全画面表示の切り替え
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
    setIsResizing(true);
    document.body.classList.add('resizing-panel');
  };

  // リサイズ中のマウス移動処理
  useEffect(() => {
    if (!isResizing) return;

    let animationFrameId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const containerHeight = window.innerHeight - 100; // ヘッダーとフッターを除く
        const newHeight = containerHeight - e.clientY;

        // 最小200px、最大80%に制限
        const minHeight = 200;
        const maxHeight = containerHeight * 0.8;
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        setComparePanelHeight(clampedHeight);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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
  const commonEditorOptions: editor.IEditorOptions = {
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
          height: showComparePanel ? `calc(100% - ${comparePanelHeight}px)` : '100%',
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
              language="plaintext"
              theme={theme === 'light' ? 'vs' : 'vs-dark'}
              onMount={handleLeftEditorDidMount}
              options={commonEditorOptions}
            />
          </div>
          <div className="editor-divider"></div>
          <div className="editor-pane">
            <MonacoEditor
              defaultValue={rightContent}
              language="plaintext"
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
          className={`compare-panel ${isFullscreen ? 'fullscreen' : ''} ${isResizing ? 'resizing' : ''}`}
          style={{ height: isFullscreen ? '100%' : `${comparePanelHeight}px` }}
        >
          {/* リサイズハンドル */}
          {!isFullscreen && (
            <div
              className={`resize-handle ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleResizeMouseDown}
            >
              <div className="resize-handle-bar" />
            </div>
          )}

          <div className="compare-panel-header">
            <span className="compare-panel-title">差分表示</span>
            <div className="compare-panel-actions">
              <button
                className="panel-action-button"
                onClick={handleToggleFullscreen}
                title={isFullscreen ? '元のサイズに戻す' : '全画面表示'}
              >
                {isFullscreen ? '⊡' : '⛶'}
              </button>
              <button className="close-panel-button" onClick={handleCloseComparePanel}>
                ✕
              </button>
            </div>
          </div>
          <div className="compare-panel-content">
            <MonacoDiffEditor
              original={leftContent}
              modified={rightContent}
              language="plaintext"
              theme={theme === 'light' ? 'vs' : 'vs-dark'}
              onMount={handleDiffEditorDidMount}
              options={{
                readOnly: true,
                renderSideBySide: activeSession?.options.viewMode === 'side-by-side' ?? true,
                ignoreTrimWhitespace: activeSession?.options.ignoreWhitespace ?? false,
                originalEditable: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

DiffEditor.displayName = 'DiffEditor';

export default DiffEditor;
