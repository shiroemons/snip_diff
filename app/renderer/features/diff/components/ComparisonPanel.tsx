import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import type { editor } from 'monaco-editor';
import type React from 'react';
import { useDiffStore } from '../../../stores/diffStore';

export interface ComparisonPanelProps {
  /** 左側（original）のコンテンツ */
  leftContent: string;
  /** 右側（modified）のコンテンツ */
  rightContent: string;
  /** プログラミング言語 */
  language: string;
  /** テーマ名 */
  themeName: string;
  /** パネルの高さ（ピクセル） */
  panelHeight: number;
  /** 全画面モードかどうか */
  isFullscreen: boolean;
  /** 最小化されているかどうか */
  isMinimized: boolean;
  /** リサイズ中かどうか */
  isResizing: boolean;
  /** ウィンドウが最大化されているかどうか */
  isWindowMaximized?: boolean;
  /** Compactモードかどうか */
  compactMode: boolean;
  /** 表示モード */
  viewMode: 'unified' | 'side-by-side';
  /** 空白を無視するかどうか */
  ignoreWhitespace: boolean;
  /** フォントサイズ */
  fontSize: number;
  /** タブサイズ */
  tabSize: number;
  /** スペースを挿入するかどうか */
  insertSpaces: boolean;
  /** 変更されていない領域を隠すかどうか */
  hideUnchangedRegions: boolean;
  /** 空白文字の表示方法 */
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  /** Diffエディタがマウントされたときのコールバック */
  onDiffEditorMount: (editor: editor.IStandaloneDiffEditor) => void;
  /** 全画面トグルハンドラ */
  onToggleFullscreen: () => void;
  /** 最小化トグルハンドラ */
  onToggleMinimize: () => void;
  /** リサイズハンドル（mousedown）のハンドラ */
  onResizeMouseDown: (e: React.MouseEvent) => void;
}

/**
 * 差分表示パネル
 */
export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  leftContent,
  rightContent,
  language,
  themeName,
  panelHeight,
  isFullscreen,
  isMinimized,
  isResizing,
  isWindowMaximized = false,
  compactMode,
  viewMode,
  ignoreWhitespace,
  fontSize,
  tabSize,
  insertSpaces,
  hideUnchangedRegions,
  renderWhitespace,
  onDiffEditorMount,
  onToggleFullscreen,
  onToggleMinimize,
  onResizeMouseDown,
}) => {
  const panelStyle: React.CSSProperties = {
    height: isFullscreen ? '100%' : isMinimized ? '40px' : `${panelHeight}px`,
  };

  return (
    <div
      className={`compare-panel ${isFullscreen ? 'fullscreen' : ''} ${isMinimized ? 'minimized' : ''} ${isResizing ? 'resizing' : ''} ${isWindowMaximized ? 'maximized' : ''}`}
      style={panelStyle}
    >
      {/* リサイズハンドル */}
      {!isFullscreen && !isMinimized && (
        <div
          role="separator"
          aria-label="比較パネルのリサイズハンドル"
          aria-valuenow={panelHeight}
          aria-valuemin={100}
          aria-valuemax={800}
          aria-orientation="horizontal"
          tabIndex={0}
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={onResizeMouseDown}
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
              className={viewMode === 'unified' ? 'active' : ''}
              onClick={() => useDiffStore.getState().updateOptions({ viewMode: 'unified' })}
              title="Unified (⌘1)"
            >
              Unified
            </button>
            <button
              type="button"
              className={viewMode === 'side-by-side' ? 'active' : ''}
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
              checked={compactMode}
              onChange={(e) =>
                useDiffStore.getState().updateOptions({ compactMode: e.target.checked })
              }
              title="Compact Mode (⌘3)"
            />
            <span>Compact</span>
          </label>
          <div className="compare-panel-actions">
            <button
              type="button"
              className="panel-action-button"
              onClick={onToggleMinimize}
              title={isMinimized ? 'パネルを復元' : 'パネルを最小化'}
            >
              {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              type="button"
              className="panel-action-button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? '元のサイズに戻す' : '全画面表示'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>
      {!isMinimized && (
        <div className={`compare-panel-content ${compactMode ? 'compact-mode' : ''}`}>
          <MonacoDiffEditor
            original={leftContent}
            modified={rightContent}
            language={language}
            theme={themeName}
            onMount={onDiffEditorMount}
            options={
              {
                readOnly: true,
                renderSideBySide: viewMode === 'side-by-side',
                ignoreTrimWhitespace: ignoreWhitespace,
                originalEditable: false,
                automaticLayout: true,
                fontSize,
                tabSize,
                insertSpaces,
                diffAlgorithm: 'advanced',
                renderIndicators: !compactMode,
                renderWhitespace,
                renderOverviewRuler: !compactMode,
                scrollBeyondLastLine: false,
                scrollBeyondLastColumn: 0,
                hideUnchangedRegions:
                  compactMode || hideUnchangedRegions
                    ? {
                        enabled: true,
                        revealLineCount: 3,
                        minimumLineCount: 3,
                        contextLineCount: 3,
                      }
                    : undefined,
              } as editor.IDiffEditorConstructionOptions
            }
          />
        </div>
      )}
    </div>
  );
};
