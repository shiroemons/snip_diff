import { diffChars } from 'diff';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { useCallback, useEffect, useRef } from 'react';
import { getTextFromModel, splitRangeToSingleLine } from '../utils/diffUtils';

export interface UseCompactModeOptions {
  /** Compactモードが有効かどうか */
  compactMode: boolean;
  /** 表示モード（unified/side-by-side） */
  viewMode: 'unified' | 'side-by-side';
}

/**
 * Compactモード用のデコレーション管理フック
 * @param diffEditorRef - Diffエディタの参照
 * @param options - オプション
 */
export const useCompactMode = (
  diffEditorRef: React.MutableRefObject<editor.IStandaloneDiffEditor | null>,
  options: UseCompactModeOptions
) => {
  const compactDecorationsRef = useRef<{
    original: editor.IEditorDecorationsCollection | null;
    modified: editor.IEditorDecorationsCollection | null;
  }>({
    original: null,
    modified: null,
  });

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
    if (options.viewMode !== 'unified') return;
    if (!options.compactMode) return;

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
            charChange.originalEndColumn
          );
          const modifiedText = getTextFromModel(
            modifiedModel,
            charChange.modifiedStartLineNumber,
            charChange.modifiedStartColumn,
            charChange.modifiedEndLineNumber,
            charChange.modifiedEndColumn
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
  }, [options.viewMode, options.compactMode, diffEditorRef]);

  const updateCompactDecorations = useCallback(() => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedEditor = diffEditor.getModifiedEditor();
    const originalModel = originalEditor?.getModel() ?? null;
    const modifiedModel = modifiedEditor?.getModel() ?? null;

    if (!options.compactMode) {
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
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
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
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
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
          charChange.originalEndColumn
        );
        const modifiedText = getTextFromModel(
          modifiedModel,
          charChange.modifiedStartLineNumber,
          charChange.modifiedStartColumn,
          charChange.modifiedEndLineNumber,
          charChange.modifiedEndColumn
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
                  charChange.originalStartColumn
                )
              ) + originalOffset
            );
            const endPos = originalModel.getPositionAt(
              originalModel.getOffsetAt(
                new monaco.Position(
                  charChange.originalStartLineNumber,
                  charChange.originalStartColumn
                )
              ) +
                originalOffset +
                part.value.length
            );

            const range = new monaco.Range(
              startPos.lineNumber,
              startPos.column,
              endPos.lineNumber,
              endPos.column
            );

            const ranges = splitRangeToSingleLine(originalModel, range);
            ranges.forEach((r) => {
              originalDecorations.push({
                range: r,
                options: {
                  inlineClassName: 'compact-diff-delete',
                  stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
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
                  charChange.modifiedStartColumn
                )
              ) + modifiedOffset
            );
            const endPos = modifiedModel.getPositionAt(
              modifiedModel.getOffsetAt(
                new monaco.Position(
                  charChange.modifiedStartLineNumber,
                  charChange.modifiedStartColumn
                )
              ) +
                modifiedOffset +
                part.value.length
            );

            const range = new monaco.Range(
              startPos.lineNumber,
              startPos.column,
              endPos.lineNumber,
              endPos.column
            );

            const ranges = splitRangeToSingleLine(modifiedModel, range);
            ranges.forEach((r) => {
              modifiedDecorations.push({
                range: r,
                options: {
                  inlineClassName: 'compact-diff-insert',
                  stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
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
    compactDecorationsRef.current.original =
      originalEditor.createDecorationsCollection(originalDecorations);
    compactDecorationsRef.current.modified =
      modifiedEditor.createDecorationsCollection(modifiedDecorations);

    // UnifiedモードのDOMを修正
    fixUnifiedModeCharHighlights();
  }, [options.compactMode, clearCompactDecorations, fixUnifiedModeCharHighlights, diffEditorRef]);

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
  }, [updateCompactDecorations, clearCompactDecorations, diffEditorRef]);
};
