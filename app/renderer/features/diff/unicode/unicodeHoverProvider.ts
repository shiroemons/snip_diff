import type * as monaco from 'monaco-editor';
import translationsJson from './translations.json';
import type { TranslationMap, UnicodeTranslation } from './types';

const translations: TranslationMap = translationsJson as TranslationMap;

/**
 * Unicode文字コードから翻訳データを取得
 */
function getTranslation(charCode: number): UnicodeTranslation | null {
  const key = `0x${charCode.toString(16).padStart(4, '0')}`;
  return translations[key] || null;
}

/**
 * 翻訳データをMarkdown形式のツールチップに整形
 */
function formatTooltip(translation: UnicodeTranslation): string {
  const { name, category, description, risk, example, note, action, similar } = translation;

  let categoryIcon = '⚠️';
  let categoryLabel = '警告';

  if (category === 'ambiguous') {
    categoryIcon = '⚠️';
    categoryLabel = '紛らわしい文字';
  } else if (category === 'invisible') {
    categoryIcon = '⚠️';
    categoryLabel = '不可視文字';
  } else if (category === 'control') {
    categoryIcon = '⚠️';
    categoryLabel = '制御文字';
  }

  let markdown = `${categoryIcon} **${categoryLabel}**\n\n`;
  markdown += `**${name}**\n\n`;
  markdown += `${description}\n\n`;

  if (similar && similar.length > 0) {
    markdown += `**類似文字**\n${similar.join(', ')}\n\n`;
  }

  if (risk) {
    markdown += `**セキュリティリスク/影響**\n${risk}\n\n`;
  }

  if (example) {
    markdown += `**例**\n${example}\n\n`;
  }

  if (action) {
    markdown += `**推奨アクション**\n${action}\n\n`;
  }

  if (note) {
    markdown += `**補足**\n${note}\n`;
  }

  return markdown.trim();
}

/**
 * Unicode Hover Providerを作成
 */
export function createUnicodeHoverProvider(
  monacoInstance: typeof monaco
): monaco.languages.HoverProvider {
  return {
    provideHover(model, position, _token) {
      // カーソル位置のオフセットを取得
      const offset = model.getOffsetAt(position);
      const text = model.getValue();

      // オフセットが範囲外の場合は null
      if (offset < 0 || offset >= text.length) {
        return null;
      }

      // カーソル位置の文字を取得
      const char = text[offset];
      const charCode = char.charCodeAt(0);

      // 翻訳データを取得
      const translation = getTranslation(charCode);
      if (!translation) {
        return null;
      }

      // Markdown形式のツールチップを返す
      return {
        contents: [{ value: formatTooltip(translation) }],
        range: new monacoInstance.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column + 1
        ),
      };
    },
  };
}

/**
 * Unicode Hover Providerを登録
 *
 * @returns 登録解除用のDisposable
 */
export function registerUnicodeHoverProvider(monacoInstance: typeof monaco): monaco.IDisposable {
  const provider = createUnicodeHoverProvider(monacoInstance);

  // すべての言語に対してHover Providerを登録
  return monacoInstance.languages.registerHoverProvider('*', provider);
}
