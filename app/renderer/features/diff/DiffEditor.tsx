import { loader } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import type React from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useDiffStore } from '../../stores/diffStore';
import { ComparisonPanel } from './components/ComparisonPanel';
import { InputEditorPanel } from './components/InputEditorPanel';
import { useCompactMode } from './hooks/useCompactMode';
import { usePanelResize } from './hooks/usePanelResize';
import { defineCompactThemes, getThemeName } from './themes/compactThemes';
import './DiffEditor.css';

// Monaco Editor のローダー設定 - ローカルから読み込み
loader.config({ monaco });

// Compactテーマの初期化フラグ
let themesInitialized = false;

export interface DiffEditorRef {
  compare: () => void;
  swap: () => void;
  clear: () => void;
}

interface DiffEditorProps {
  theme?: 'light' | 'dark';
  isMaximized?: boolean;
}

const DiffEditor = forwardRef<DiffEditorRef, DiffEditorProps>(
  ({ theme = 'dark', isMaximized = false }, ref) => {
    const { getActiveSession, updateStats } = useDiffStore();
    const activeSession = getActiveSession();
    const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
    const leftEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const rightEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const [showComparePanel, setShowComparePanel] = useState(true);
    const [leftContent, setLeftContent] = useState('');
    const [rightContent, setRightContent] = useState('');

    // usePanelResizeフックを使用
    const {
      panelHeight,
      isFullscreen,
      isResizing,
      isMinimized,
      toggleFullscreen,
      toggleMinimize,
      startResize,
    } = usePanelResize({ initialHeight: 350 });

    // useCompactModeフックを使用
    useCompactMode(diffEditorRef, {
      compactMode: activeSession?.options.compactMode ?? false,
      viewMode: activeSession?.options.viewMode ?? 'side-by-side',
    });

    // storeから言語を取得
    const language = activeSession?.left.lang || 'plaintext';

    // Compactテーマの初期化
    useEffect(() => {
      if (!themesInitialized) {
        defineCompactThemes();
        themesInitialized = true;
      }
    }, []);

    // 左エディタのオプションを動的に更新
    useEffect(() => {
      if (leftEditorRef.current && activeSession) {
        leftEditorRef.current.updateOptions({
          tabSize: activeSession.options.tabSize ?? 4,
          insertSpaces: activeSession.options.insertSpaces ?? true,
          fontSize: activeSession.options.fontSize ?? 14,
          wordWrap: activeSession.options.wordWrap ? 'on' : 'off',
        });
      }
    }, [
      activeSession?.options.tabSize,
      activeSession?.options.insertSpaces,
      activeSession?.options.fontSize,
      activeSession?.options.wordWrap,
      activeSession,
    ]);

    // 右エディタのオプションを動的に更新
    useEffect(() => {
      if (rightEditorRef.current && activeSession) {
        rightEditorRef.current.updateOptions({
          tabSize: activeSession.options.tabSize ?? 4,
          insertSpaces: activeSession.options.insertSpaces ?? true,
          fontSize: activeSession.options.fontSize ?? 14,
          wordWrap: activeSession.options.wordWrap ? 'on' : 'off',
        });
      }
    }, [
      activeSession?.options.tabSize,
      activeSession?.options.insertSpaces,
      activeSession?.options.fontSize,
      activeSession?.options.wordWrap,
      activeSession,
    ]);

    // Diffエディタのオプションを動的に更新
    useEffect(() => {
      if (diffEditorRef.current && activeSession) {
        diffEditorRef.current.updateOptions({
          fontSize: activeSession.options.fontSize ?? 14,
          // @ts-expect-error - Monaco DiffEditorのupdateOptionsでもtabSizeとinsertSpacesは有効
          tabSize: activeSession.options.tabSize ?? 4,
          insertSpaces: activeSession.options.insertSpaces ?? true,
        });
      }
    }, [
      activeSession?.options.tabSize,
      activeSession?.options.insertSpaces,
      activeSession?.options.fontSize,
      activeSession,
    ]);

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
      startResize(e.clientY);
    };

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
      renderWhitespace: activeSession?.options.renderWhitespace ?? 'none',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 0,
    };

    if (!activeSession) {
      return (
        <div className="diff-editor-container">
          <div className="no-session">セッションが見つかりません</div>
        </div>
      );
    }

    // compactModeに応じたテーマ名を取得
    const themeName = getThemeName(activeSession.options.compactMode ?? false, theme);

    // 入力エディタセクションの高さを計算
    const inputEditorHeight = showComparePanel
      ? isMinimized
        ? 'calc(100% - 40px)'
        : `calc(100% - ${panelHeight}px)`
      : '100%';

    return (
      <div className="diff-editor-container">
        {/* 上部: 入力エディタ */}
        <InputEditorPanel
          leftDefaultValue={leftContent}
          rightDefaultValue={rightContent}
          language={language}
          theme={theme}
          editorOptions={commonEditorOptions}
          height={inputEditorHeight}
          isResizing={isResizing}
          onLeftEditorMount={handleLeftEditorDidMount}
          onRightEditorMount={handleRightEditorDidMount}
          onPasteLeft={handlePasteLeft}
          onPasteRight={handlePasteRight}
          onClearLeft={handleClearLeft}
          onClearRight={handleClearRight}
        />

        {/* 下部: 比較パネル */}
        {showComparePanel && (
          <ComparisonPanel
            leftContent={leftContent}
            rightContent={rightContent}
            language={language}
            themeName={themeName}
            panelHeight={panelHeight}
            isFullscreen={isFullscreen}
            isMinimized={isMinimized}
            isResizing={isResizing}
            isWindowMaximized={isMaximized}
            compactMode={activeSession.options.compactMode ?? false}
            viewMode={activeSession.options.viewMode ?? 'side-by-side'}
            ignoreWhitespace={activeSession.options.ignoreWhitespace ?? false}
            fontSize={activeSession.options.fontSize ?? 14}
            tabSize={activeSession.options.tabSize ?? 4}
            insertSpaces={activeSession.options.insertSpaces ?? true}
            hideUnchangedRegions={activeSession.options.hideUnchangedRegions ?? false}
            renderWhitespace={activeSession.options.renderWhitespace ?? 'none'}
            onDiffEditorMount={handleDiffEditorDidMount}
            onToggleFullscreen={toggleFullscreen}
            onToggleMinimize={toggleMinimize}
            onResizeMouseDown={handleResizeMouseDown}
          />
        )}
      </div>
    );
  }
);

DiffEditor.displayName = 'DiffEditor';

export default DiffEditor;
