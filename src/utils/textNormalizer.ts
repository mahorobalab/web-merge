export interface NormalizeOptions {
  /** Ignore line ending differences (CRLF / LF / CR) by converting to LF */
  ignoreLineEndings?: boolean;
  /** Ignore all whitespace differences (spaces and tabs) */
  ignoreAllWhitespace?: boolean;
  /** Ignore leading and trailing whitespaces on each line */
  ignoreLeadingTrailingWhitespace?: boolean;
  /** Collapse consecutive whitespaces into a single space */
  collapseWhitespace?: boolean;
  /** Ignore blank lines (including whitespace-only lines) */
  ignoreBlankLines?: boolean;
}

/**
 * Pure function that normalizes all line endings (CRLF, CR) to standard LF (\n).
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n|\r/g, '\n');
}

/**
 * Pure function that normalizes text according to the provided comparison options.
 */
export function normalizeText(text: string, options: NormalizeOptions = {}): string {
  let result = text;

  // 1. Normalize line endings (default is true or as specified)
  if (options.ignoreLineEndings ?? true) {
    result = normalizeLineEndings(result);
  }

  const lines = result.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    let processed = line;

    if (options.ignoreAllWhitespace) {
      // Strip all whitespace characters
      processed = processed.replace(/[ \t]+/g, '');
    } else {
      if (options.collapseWhitespace) {
        // Collapse consecutive spaces/tabs into a single space
        processed = processed.replace(/[ \t]+/g, ' ');
      }
      if (options.ignoreLeadingTrailingWhitespace) {
        // Strip leading and trailing whitespace
        processed = processed.trim();
      }
    }

    if (options.ignoreBlankLines) {
      // Omit whitespace-only or empty lines
      if (processed.trim().length === 0) {
        continue;
      }
    }

    processedLines.push(processed);
  }

  return processedLines.join('\n');
}

/**
 * Checks whether two text strings are considered equal under the given normalization options.
 */
export function areTextsEqual(textA: string, textB: string, options: NormalizeOptions = {}): boolean {
  if (textA === textB) {
    return true;
  }
  const normalizedA = normalizeText(textA, options);
  const normalizedB = normalizeText(textB, options);
  return normalizedA === normalizedB;
}
