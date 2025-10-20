import type { Buffer, DiffStats } from '../types';

/**
 * ユニークIDを生成
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 改行コードを検出
 */
export function detectEOL(text: string): 'LF' | 'CRLF' {
  const crlfCount = (text.match(/\r\n/g) || []).length;
  const lfCount = (text.match(/(?<!\r)\n/g) || []).length;

  return crlfCount > lfCount ? 'CRLF' : 'LF';
}

/**
 * テキストを正規化（オプションに応じて）
 */
export function normalizeText(
  text: string,
  options: {
    ignoreWhitespace?: boolean;
    normalizeEOL?: boolean;
  }
): string {
  let result = text;

  if (options.normalizeEOL) {
    result = result.replace(/\r\n/g, '\n');
  }

  if (options.ignoreWhitespace) {
    result = result.replace(/[ \t]+$/gm, ''); // 行末の空白を削除
  }

  return result;
}

/**
 * バッファを作成
 */
export function createBuffer(content: string, lang: string = 'plaintext'): Buffer {
  return {
    id: generateId(),
    content,
    lang,
    eol: detectEOL(content),
  };
}

/**
 * テキストのプレビューを生成（最初のN文字）
 */
export function generatePreview(text: string, maxLength: number = 100): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength
    ? `${normalized.substring(0, maxLength)}...`
    : normalized;
}

/**
 * テキストの行数を取得
 */
export function countLines(text: string): number {
  if (!text) return 0;
  return text.split(/\r\n|\r|\n/).length;
}

/**
 * 差分統計を計算（簡易版）
 */
export function calculateSimpleStats(
  leftText: string,
  rightText: string
): DiffStats {
  const leftLines = countLines(leftText);
  const rightLines = countLines(rightText);

  return {
    adds: Math.max(0, rightLines - leftLines),
    dels: Math.max(0, leftLines - rightLines),
    hunks: 1, // 簡易版なので1
    leftLines,
    rightLines,
  };
}

/**
 * debounce関数
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic debounce function requires any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * ファイル名のサニタイズ
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9-_.]/g, '_');
}

/**
 * タイムスタンプを人間が読める形式に変換
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
