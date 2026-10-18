import { describe, it, expect } from 'vitest';
import { normalizeLineEndings, normalizeText, areTextsEqual } from './textNormalizer';

describe('textNormalizer', () => {
  describe('normalizeLineEndings', () => {
    it('Windows改行(CRLF)をLFに統一できること', () => {
      const input = 'line1\r\nline2\r\nline3';
      expect(normalizeLineEndings(input)).toBe('line1\nline2\nline3');
    });

    it('古いMac改行(CR)をLFに統一できること', () => {
      const input = 'line1\rline2\rline3';
      expect(normalizeLineEndings(input)).toBe('line1\nline2\nline3');
    });

    it('CRLF, CR, LFが混在していてもすべてLFに統一できること', () => {
      const input = 'line1\r\nline2\nline3\rline4';
      expect(normalizeLineEndings(input)).toBe('line1\nline2\nline3\nline4');
    });

    it('空文字列や単一改行でも正しく動作すること', () => {
      expect(normalizeLineEndings('')).toBe('');
      expect(normalizeLineEndings('\r\n')).toBe('\n');
      expect(normalizeLineEndings('\n')).toBe('\n');
    });
  });

  describe('normalizeText', () => {
    it('行頭・行末の空白無視(ignoreLeadingTrailingWhitespace)が機能すること', () => {
      const input = '  const a = 1; \t\n\t let b = 2;   ';
      const output = normalizeText(input, { ignoreLeadingTrailingWhitespace: true });
      expect(output).toBe('const a = 1;\nlet b = 2;');
    });

    it('すべての空白無視(ignoreAllWhitespace)が機能すること', () => {
      const input = 'function test ( a , b ) {\n  return a + b ;\n}';
      const output = normalizeText(input, { ignoreAllWhitespace: true });
      expect(output).toBe('functiontest(a,b){\nreturna+b;\n}');
    });

    it('空白の圧縮(collapseWhitespace)が機能すること', () => {
      const input = 'const    a   =    1;';
      const output = normalizeText(input, { collapseWhitespace: true });
      expect(output).toBe('const a = 1;');
    });

    it('空行の無視(ignoreBlankLines)が機能すること', () => {
      const input = 'line1\n\n  \t  \nline2\n\nline3\n';
      const output = normalizeText(input, { ignoreBlankLines: true });
      expect(output).toBe('line1\nline2\nline3');
    });
  });

  describe('areTextsEqual', () => {
    it('改行コードが異なっていてもデフォルトで一致とみなすこと', () => {
      const textA = 'console.log("hello");\r\nreturn 0;\r\n';
      const textB = 'console.log("hello");\nreturn 0;\n';
      expect(areTextsEqual(textA, textB, { ignoreLineEndings: true })).toBe(true);
    });

    it('空白無視オプションでインデント差分を無視して一致判定できること', () => {
      const textA = 'if (true) {\n    doSomething();\n}';
      const textB = 'if (true) {\n\tdoSomething();\n}';
      expect(areTextsEqual(textA, textB, { ignoreLeadingTrailingWhitespace: true })).toBe(true);
    });

    it('差分が存在する場合はfalseを返すこと', () => {
      const textA = 'const value = 10;';
      const textB = 'const value = 20;';
      expect(areTextsEqual(textA, textB)).toBe(false);
    });

    it('境界値: 両方が空文字の場合はtrueを返すこと', () => {
      expect(areTextsEqual('', '')).toBe(true);
    });
  });
});
