/**
 * Supported text character encodings.
 */
export type SupportedEncoding = 'utf-8' | 'shift_jis' | 'euc-jp' | 'utf-16le' | 'utf-16be';

/**
 * Formats encoding identifier into user-friendly display text (e.g. 'Shift-JIS', 'UTF-8').
 */
export function formatEncodingLabel(enc?: SupportedEncoding): string {
  switch (enc) {
    case 'shift_jis':
      return 'Shift-JIS';
    case 'euc-jp':
      return 'EUC-JP';
    case 'utf-16le':
      return 'UTF-16LE';
    case 'utf-16be':
      return 'UTF-16BE';
    case 'utf-8':
    default:
      return 'UTF-8';
  }
}

/**
 * Detects character encoding from a raw byte array.
 * Checks for BOM first, then validates UTF-8 sequences, and detects Shift-JIS / EUC-JP patterns.
 */
export function detectEncoding(bytes: Uint8Array): SupportedEncoding {
  if (bytes.length === 0) {
    return 'utf-8';
  }

  // 1. Check BOM (Byte Order Mark)
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le';
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be';
  }

  // 2. Check for strict UTF-8 validity
  let isUtf8Valid = true;
  let i = 0;

  while (i < bytes.length) {
    const b1 = bytes[i];

    if (b1 <= 0x7f) {
      // 1-byte ASCII
      i++;
    } else if ((b1 & 0xe0) === 0xc0) {
      // 2-byte sequence
      if (i + 1 >= bytes.length || (bytes[i + 1] & 0xc0) !== 0x80) {
        isUtf8Valid = false;
        break;
      }
      i += 2;
    } else if ((b1 & 0xf0) === 0xe0) {
      // 3-byte sequence
      if (
        i + 2 >= bytes.length ||
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80
      ) {
        isUtf8Valid = false;
        break;
      }
      i += 3;
    } else if ((b1 & 0xf8) === 0xf0) {
      // 4-byte sequence
      if (
        i + 3 >= bytes.length ||
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80 ||
        (bytes[i + 3] & 0xc0) !== 0x80
      ) {
        isUtf8Valid = false;
        break;
      }
      i += 4;
    } else {
      isUtf8Valid = false;
      break;
    }
  }

  // If valid UTF-8, return utf-8
  if (isUtf8Valid) {
    return 'utf-8';
  }

  // 3. Shift-JIS vs EUC-JP heuristic score
  let sjisScore = 0;
  let eucScore = 0;
  i = 0;

  while (i < bytes.length - 1) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];

    // Shift-JIS (CP932) lead and trail byte ranges
    const isSjisLead = (b1 >= 0x81 && b1 <= 0x9f) || (b1 >= 0xe0 && b1 <= 0xfc);
    const isSjisTrail = (b2 >= 0x40 && b2 <= 0x7e) || (b2 >= 0x80 && b2 <= 0xfc);
    if (isSjisLead && isSjisTrail) {
      sjisScore++;
      i += 2;
      continue;
    }

    // EUC-JP byte ranges (0xA1..0xFE for both bytes)
    const isEuc = b1 >= 0xa1 && b1 <= 0xfe && b2 >= 0xa1 && b2 <= 0xfe;
    if (isEuc) {
      eucScore++;
      i += 2;
      continue;
    }

    i++;
  }

  if (sjisScore > eucScore && sjisScore > 0) {
    return 'shift_jis';
  }
  if (eucScore > sjisScore && eucScore > 0) {
    return 'euc-jp';
  }

  return 'utf-8';
}

/**
 * Decodes an ArrayBuffer into a string using automatically detected character encoding.
 */
export function decodeBuffer(buffer: ArrayBuffer): { text: string; encoding: SupportedEncoding } {
  const bytes = new Uint8Array(buffer);
  const encoding = detectEncoding(bytes);

  try {
    const decoder = new TextDecoder(encoding);
    const text = decoder.decode(bytes);
    return { text, encoding };
  } catch (err) {
    console.warn(`TextDecoder failed for ${encoding}, falling back to utf-8:`, err);
    const fallbackDecoder = new TextDecoder('utf-8');
    return { text: fallbackDecoder.decode(bytes), encoding: 'utf-8' };
  }
}
