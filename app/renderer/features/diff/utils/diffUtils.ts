import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';

/**
 * 指定範囲のテキストをモデルから取得
 * @param model - Monaco エディタのモデル
 * @param startLine - 開始行番号 (1始まり)
 * @param startColumn - 開始列番号 (1始まり)
 * @param endLine - 終了行番号 (1始まり)
 * @param endColumn - 終了列番号 (1始まり)
 * @returns 範囲内のテキスト内容、無効な場合は空文字列
 */
export const getTextFromModel = (
  model: editor.ITextModel | null,
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): string => {
  if (!model) return '';
  if (startLine <= 0 || startColumn <= 0 || endLine <= 0 || endColumn <= 0) {
    return '';
  }
  return model.getValueInRange(new monaco.Range(startLine, startColumn, endLine, endColumn));
};

/**
 * 複数行のRangeを1行ごとのRangeに分割
 * @param model - Monaco エディタのモデル
 * @param range - 分割するRange
 * @returns 1行ごとのRangeの配列
 */
export const splitRangeToSingleLine = (
  model: editor.ITextModel,
  range: monaco.Range
): monaco.Range[] => {
  if (range.startLineNumber === range.endLineNumber) {
    if (range.startColumn === range.endColumn) {
      return [];
    }
    return [range];
  }

  const ranges: monaco.Range[] = [];
  for (let line = range.startLineNumber; line <= range.endLineNumber; line += 1) {
    const startColumn = line === range.startLineNumber ? range.startColumn : 1;
    const endColumn = line === range.endLineNumber ? range.endColumn : model.getLineMaxColumn(line);
    if (startColumn === endColumn) continue;
    ranges.push(new monaco.Range(line, startColumn, line, endColumn));
  }
  return ranges;
};
