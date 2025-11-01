/**
 * Unicode文字の翻訳情報
 */
export interface UnicodeTranslation {
  /** 文字そのもの */
  char: string;
  /** 文字の名称 */
  name: string;
  /** カテゴリ */
  category: 'ambiguous' | 'invisible' | 'control';
  /** 類似文字のリスト（ambiguousの場合） */
  similar?: string[];
  /** 文字の説明 */
  description: string;
  /** セキュリティリスクや影響 */
  risk?: string;
  /** 悪用例や使用例 */
  example?: string;
  /** 追加情報 */
  note?: string;
  /** 推奨アクション */
  action?: string;
}

/**
 * 文字コード（16進数文字列）から翻訳情報へのマップ
 * 例: "0x043e" -> UnicodeTranslation
 */
export type TranslationMap = Record<string, UnicodeTranslation>;
