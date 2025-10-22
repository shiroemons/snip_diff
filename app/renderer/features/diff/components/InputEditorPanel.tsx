import { Editor as MonacoEditor } from '@monaco-editor/react';
import { Clipboard, Trash2 } from 'lucide-react';
import type { editor } from 'monaco-editor';
import type React from 'react';

export interface InputEditorPanelProps {
  /** 左エディタのデフォルト値 */
  leftDefaultValue: string;
  /** 右エディタのデフォルト値 */
  rightDefaultValue: string;
  /** プログラミング言語 */
  language: string;
  /** テーマ ('light' | 'dark') */
  theme: 'light' | 'dark';
  /** エディタのオプション */
  editorOptions: editor.IStandaloneEditorConstructionOptions;
  /** パネルの高さ（CSSスタイル用） */
  height: string;
  /** リサイズ中かどうか */
  isResizing: boolean;
  /** 左エディタがマウントされたときのコールバック */
  onLeftEditorMount: (editor: editor.IStandaloneCodeEditor) => void;
  /** 右エディタがマウントされたときのコールバック */
  onRightEditorMount: (editor: editor.IStandaloneCodeEditor) => void;
  /** 左エディタに貼り付けるハンドラ */
  onPasteLeft: () => void;
  /** 右エディタに貼り付けるハンドラ */
  onPasteRight: () => void;
  /** 左エディタをクリアするハンドラ */
  onClearLeft: () => void;
  /** 右エディタをクリアするハンドラ */
  onClearRight: () => void;
}

/**
 * Before/Afterの入力エディタパネル
 */
export const InputEditorPanel: React.FC<InputEditorPanelProps> = ({
  leftDefaultValue,
  rightDefaultValue,
  language,
  theme,
  editorOptions,
  height,
  isResizing,
  onLeftEditorMount,
  onRightEditorMount,
  onPasteLeft,
  onPasteRight,
  onClearLeft,
  onClearRight,
}) => {
  const themeName = theme === 'light' ? 'vs' : 'vs-dark';

  return (
    <div className={`input-editor-section ${isResizing ? 'resizing' : ''}`} style={{ height }}>
      <div className="editor-labels">
        <div className="editor-label editor-label-left">
          <span className="editor-label-text">Before</span>
          <div className="editor-label-actions">
            <button
              type="button"
              className="editor-label-button"
              onClick={onPasteLeft}
              title="クリップボードから貼り付け (⌘V)"
            >
              <Clipboard size={16} />
            </button>
            <button
              type="button"
              className="editor-label-button"
              onClick={onClearLeft}
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
              onClick={onPasteRight}
              title="クリップボードから貼り付け (⌘V)"
            >
              <Clipboard size={16} />
            </button>
            <button
              type="button"
              className="editor-label-button"
              onClick={onClearRight}
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
            defaultValue={leftDefaultValue}
            language={language}
            theme={themeName}
            onMount={onLeftEditorMount}
            options={editorOptions}
          />
        </div>
        <div className="editor-divider"></div>
        <div className="editor-pane">
          <MonacoEditor
            defaultValue={rightDefaultValue}
            language={language}
            theme={themeName}
            onMount={onRightEditorMount}
            options={editorOptions}
          />
        </div>
      </div>
    </div>
  );
};
