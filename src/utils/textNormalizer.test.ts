import { describe, it, expect } from 'vitest';
import { normalizeLineEndings, normalizeText, areTextsEqual } from './textNormalizer';

describe('textNormalizer', () => {
  describe('normalizeLineEndings', () => {
    it('normalizes Windows line endings (CRLF) to LF', () => {
      const input = 'line1\r\nline2\r\nline3';
      expect(normalizeLineEndings(input)).toBe('line1\nline2\nline3');
    });

    it('normalizes legacy Mac line endings (CR) to LF', () => {
      const input = 'line1\rline2\rline3';
      expect(normalizeLineEndings(input)).toBe('line1\nline2\nline3');
    });

    it('normalizes mixed CRLF, CR, and LF line endings uniformly to LF', () => {
      const input = 'line1\r\nline2\nline3\rline4';
      expect(normalizeLineEndings(input)).toBe('line1\nline2\nline3\nline4');
    });

    it('handles empty strings and solitary line breaks properly', () => {
      expect(normalizeLineEndings('')).toBe('');
      expect(normalizeLineEndings('\r\n')).toBe('\n');
      expect(normalizeLineEndings('\n')).toBe('\n');
    });
  });

  describe('normalizeText', () => {
    it('strips leading and trailing whitespace when ignoreLeadingTrailingWhitespace is true', () => {
      const input = '  const a = 1; \t\n\t let b = 2;   ';
      const output = normalizeText(input, { ignoreLeadingTrailingWhitespace: true });
      expect(output).toBe('const a = 1;\nlet b = 2;');
    });

    it('removes all whitespace when ignoreAllWhitespace is true', () => {
      const input = 'function test ( a , b ) {\n  return a + b ;\n}';
      const output = normalizeText(input, { ignoreAllWhitespace: true });
      expect(output).toBe('functiontest(a,b){\nreturna+b;\n}');
    });

    it('collapses consecutive whitespace characters into a single space', () => {
      const input = 'const    a   =    1;';
      const output = normalizeText(input, { collapseWhitespace: true });
      expect(output).toBe('const a = 1;');
    });

    it('omits blank lines when ignoreBlankLines is true', () => {
      const input = 'line1\n\n  \t  \nline2\n\nline3\n';
      const output = normalizeText(input, { ignoreBlankLines: true });
      expect(output).toBe('line1\nline2\nline3');
    });
  });

  describe('areTextsEqual', () => {
    it('treats text with differing line endings as equal by default', () => {
      const textA = 'console.log("hello");\r\nreturn 0;\r\n';
      const textB = 'console.log("hello");\nreturn 0;\n';
      expect(areTextsEqual(textA, textB, { ignoreLineEndings: true })).toBe(true);
    });

    it('ignores indentation differences when whitespace flags are enabled', () => {
      const textA = 'if (true) {\n    doSomething();\n}';
      const textB = 'if (true) {\n\tdoSomething();\n}';
      expect(areTextsEqual(textA, textB, { ignoreLeadingTrailingWhitespace: true })).toBe(true);
    });

    it('returns false when texts contain genuine differences', () => {
      const textA = 'const value = 10;';
      const textB = 'const value = 20;';
      expect(areTextsEqual(textA, textB)).toBe(false);
    });

    it('handles empty strings symmetrically', () => {
      expect(areTextsEqual('', '')).toBe(true);
    });
  });
});
