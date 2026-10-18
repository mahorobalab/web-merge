export interface NormalizeOptions {
  /** 改行コードの違い（CRLF / LF / CR）を無視してLFに統一するか */
  ignoreLineEndings?: boolean;
  /** すべての空白文字（スペース、タブ）の違いを無視するか */
  ignoreAllWhitespace?: boolean;
  /** 行頭・行末の空白文字を無視するか */
  ignoreLeadingTrailingWhitespace?: boolean;
  /** 連続する空白文字の差異を無視（1つの半角スペースとして扱う）するか */
  collapseWhitespace?: boolean;
  /** 空行（空白のみの行を含む）を無視するか */
  ignoreBlankLines?: boolean;
}

/**
 * 改行コードをLF(\n)に正規化する純粋関数
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n|\r/g, '\n');
}

/**
 * 指定された比較オプションに従ってテキストを正規化する純粋関数
 */
export function normalizeText(text: string, options: NormalizeOptions = {}): string {
  let result = text;

  // 1. 改行コードの正規化（デフォルトで有効またはオプション指定）
  if (options.ignoreLineEndings ?? true) {
    result = normalizeLineEndings(result);
  }

  const lines = result.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    let processed = line;

    if (options.ignoreAllWhitespace) {
      // すべての空白（半角スペース・タブ）を除去
      processed = processed.replace(/[ \t]+/g, '');
    } else {
      if (options.collapseWhitespace) {
        // 連続する空白を1つのスペースに圧縮
        processed = processed.replace(/[ \t]+/g, ' ');
      }
      if (options.ignoreLeadingTrailingWhitespace) {
        // 行頭・行末の空白を除去
        processed = processed.trim();
      }
    }

    if (options.ignoreBlankLines) {
      // 空白のみの行または完全な空行を除外
      if (processed.trim().length === 0) {
        continue;
      }
    }

    processedLines.push(processed);
  }

  return processedLines.join('\n');
}

/**
 * 2つのテキストが指定オプションのもとで一致しているかを判定する
 */
export function areTextsEqual(textA: string, textB: string, options: NormalizeOptions = {}): boolean {
  if (textA === textB) {
    return true;
  }
  const normalizedA = normalizeText(textA, options);
  const normalizedB = normalizeText(textB, options);
  return normalizedA === normalizedB;
}
