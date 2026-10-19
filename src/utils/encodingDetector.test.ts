import { describe, it, expect } from 'vitest';
import { detectEncoding, decodeBuffer } from './encodingDetector';

describe('encodingDetector', () => {
  it('identifies standard UTF-8 text correctly', () => {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode('こんにちは世界 (Hello World)');
    expect(detectEncoding(utf8Bytes)).toBe('utf-8');
  });

  it('detects UTF-8 with BOM signature', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x62, 0x63]);
    expect(detectEncoding(bytes)).toBe('utf-8');
  });

  it('detects UTF-16LE and UTF-16BE by BOM', () => {
    const le = new Uint8Array([0xff, 0xfe, 0x61, 0x00]);
    expect(detectEncoding(le)).toBe('utf-16le');

    const be = new Uint8Array([0xfe, 0xff, 0x00, 0x61]);
    expect(detectEncoding(be)).toBe('utf-16be');
  });

  it('identifies Shift-JIS encoded Japanese bytes and decodes successfully', () => {
    // "テスト" in Shift-JIS (CP932):
    // テ = 0x83 0x65
    // ス = 0x83 0x58
    // ト = 0x83 0x67
    const sjisBytes = new Uint8Array([0x83, 0x65, 0x83, 0x58, 0x83, 0x67]);

    expect(detectEncoding(sjisBytes)).toBe('shift_jis');

    const { text, encoding } = decodeBuffer(sjisBytes.buffer);
    expect(encoding).toBe('shift_jis');
    expect(text).toBe('テスト');
  });

  it('handles empty buffers by defaulting to utf-8', () => {
    const empty = new Uint8Array([]);
    expect(detectEncoding(empty)).toBe('utf-8');
  });
});
