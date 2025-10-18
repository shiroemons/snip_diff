import React, { useEffect, useRef } from 'react';
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';
import { useDiffStore } from '../../stores/diffStore';
import { debounce } from '@shared/utils';
import type { editor } from 'monaco-editor';
import './DiffEditor.css';

const DiffEditor: React.FC = () => {
  const { getActiveSession, updateLeftBuffer, updateRightBuffer, updateStats } = useDiffStore();
  const activeSession = getActiveSession();
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  // デバウンス付きの更新関数
  const debouncedUpdateStats = useRef(
    debounce((leftContent: string, rightContent: string) => {
      // 簡易統計計算（後でWeb Workerに移行）
      const leftLines = leftContent.split('\n').length;
      const rightLines = rightContent.split('\n').length;

      updateStats({
        adds: Math.max(0, rightLines - leftLines),
        dels: Math.max(0, leftLines - rightLines),
        hunks: 1,
        leftLines,
        rightLines,
      });
    }, 120)
  ).current;

  // エディタマウント時の処理
  const handleEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    editorRef.current = editor;

    // エディタオプションの設定
    const editorOptions: editor.IDiffEditorOptions = {
      readOnly: false,
      renderSideBySide: activeSession?.options.viewMode === 'side-by-side',
      ignoreTrimWhitespace: activeSession?.options.ignoreWhitespace ?? false,
      renderIndicators: true,
      originalEditable: true,
      automaticLayout: true,
    };

    editor.updateOptions(editorOptions);

    // 各エディタのオプションを個別に設定
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
    };

    editor.getOriginalEditor().updateOptions(commonEditorOptions);
    editor.getModifiedEditor().updateOptions(commonEditorOptions);

    // 変更イベントのリスナーとタブサイズ設定
    const originalModel = editor.getOriginalEditor().getModel();
    const modifiedModel = editor.getModifiedEditor().getModel();
    const tabSize = activeSession?.options.tabSize ?? 4;

    // タブサイズはモデルレベルで設定
    if (originalModel) {
      originalModel.updateOptions({ tabSize });
    }
    if (modifiedModel) {
      modifiedModel.updateOptions({ tabSize });
    }

    if (originalModel) {
      originalModel.onDidChangeContent(() => {
        const content = originalModel.getValue();
        updateLeftBuffer(content);
        debouncedUpdateStats(content, modifiedModel?.getValue() ?? '');
      });
    }

    if (modifiedModel) {
      modifiedModel.onDidChangeContent(() => {
        const content = modifiedModel.getValue();
        updateRightBuffer(content);
        debouncedUpdateStats(originalModel?.getValue() ?? '', content);
      });
    }
  };

  // セッションのオプションが変更された時にエディタを更新
  useEffect(() => {
    if (!editorRef.current || !activeSession) return;

    editorRef.current.updateOptions({
      renderSideBySide: activeSession.options.viewMode === 'side-by-side',
      ignoreTrimWhitespace: activeSession.options.ignoreWhitespace,
    });

    const commonEditorOptions: editor.IEditorOptions = {
      wordWrap: activeSession.options.wordWrap ? 'on' : 'off',
      fontSize: activeSession.options.fontSize,
    };

    editorRef.current.getOriginalEditor().updateOptions(commonEditorOptions);
    editorRef.current.getModifiedEditor().updateOptions(commonEditorOptions);

    // タブサイズはモデルレベルで設定
    const originalModel = editorRef.current.getOriginalEditor().getModel();
    const modifiedModel = editorRef.current.getModifiedEditor().getModel();

    if (originalModel) {
      originalModel.updateOptions({ tabSize: activeSession.options.tabSize });
    }
    if (modifiedModel) {
      modifiedModel.updateOptions({ tabSize: activeSession.options.tabSize });
    }
  }, [activeSession?.options]);

  if (!activeSession) {
    return (
      <div className="diff-editor-container">
        <div className="no-session">セッションが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="diff-editor-container">
      <MonacoDiffEditor
        original={activeSession.left.content}
        modified={activeSession.right.content}
        language={activeSession.left.lang || 'plaintext'}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          readOnly: false,
          renderSideBySide: activeSession.options.viewMode === 'side-by-side',
          ignoreTrimWhitespace: activeSession.options.ignoreWhitespace,
        }}
      />
    </div>
  );
};

export default DiffEditor;
