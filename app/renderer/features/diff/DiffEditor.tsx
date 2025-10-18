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
}

const DiffEditor = forwardRef<DiffEditorRef>((props, ref) => {
  const { getActiveSession, updateStats } = useDiffStore();
  const activeSession = getActiveSession();
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const leftEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const rightEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [showComparePanel, setShowComparePanel] = useState(true);
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [comparePanelHeight, setComparePanelHeight] = useState(350);

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

  // 外部から呼び出せるようにメソッドを公開
  useImperativeHandle(ref, () => ({
    compare: handleCompare,
  }));

  // 左エディタのマウント処理
  const handleLeftEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    leftEditorRef.current = editor;
  };

  // 右エディタのマウント処理
  const handleRightEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    rightEditorRef.current = editor;
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
        className="input-editor-section"
        style={{
          height: showComparePanel ? `calc(100% - ${comparePanelHeight}px)` : '100%',
        }}
      >
        <div className="editor-labels">
          <div className="editor-label editor-label-left">Before</div>
          <div className="editor-label editor-label-right">After</div>
        </div>
        <div className="dual-editor-container">
          <div className="editor-pane">
            <MonacoEditor
              defaultValue={leftContent}
              language="plaintext"
              theme="vs-dark"
              onMount={handleLeftEditorDidMount}
              options={commonEditorOptions}
            />
          </div>
          <div className="editor-divider"></div>
          <div className="editor-pane">
            <MonacoEditor
              defaultValue={rightContent}
              language="plaintext"
              theme="vs-dark"
              onMount={handleRightEditorDidMount}
              options={commonEditorOptions}
            />
          </div>
        </div>
      </div>

      {/* 下部: 比較パネル */}
      {showComparePanel && (
        <div
          className="compare-panel"
          style={{ height: `${comparePanelHeight}px` }}
        >
          <div className="compare-panel-header">
            <span className="compare-panel-title">差分表示</span>
            <button className="close-panel-button" onClick={handleCloseComparePanel}>
              ✕
            </button>
          </div>
          <div className="compare-panel-content">
            <MonacoDiffEditor
              original={leftContent}
              modified={rightContent}
              language="plaintext"
              theme="vs-dark"
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
