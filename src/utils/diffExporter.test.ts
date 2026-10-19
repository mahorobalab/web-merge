import { describe, it, expect } from 'vitest';
import { generateUnifiedDiff, generateHtmlReport } from './diffExporter';

describe('diffExporter', () => {
  describe('generateUnifiedDiff', () => {
    it('returns empty patch when both texts are identical', () => {
      const text = 'line 1\nline 2\n';
      const patch = generateUnifiedDiff('a.txt', 'b.txt', text, text);
      expect(patch).toContain('--- a.txt');
      expect(patch).toContain('+++ b.txt');
      expect(patch).toContain('No differences');
    });

    it('generates standard unified diff with additions and deletions', () => {
      const left = 'Apple\nBanana\nCherry\n';
      const right = 'Apple\nBlueberry\nCherry\nDate\n';

      const patch = generateUnifiedDiff('fruit_old.txt', 'fruit_new.txt', left, right);

      expect(patch).toContain('--- fruit_old.txt');
      expect(patch).toContain('+++ fruit_new.txt');
      expect(patch).toContain('-Banana');
      expect(patch).toContain('+Blueberry');
      expect(patch).toContain('+Date');
    });

    it('handles empty left file (pure additions)', () => {
      const left = '';
      const right = 'Hello World\nSecond Line\n';

      const patch = generateUnifiedDiff('empty.txt', 'new.txt', left, right);
      expect(patch).toContain('+Hello World');
      expect(patch).toContain('+Second Line');
    });

    it('handles empty right file (pure deletions)', () => {
      const left = 'Line 1\nLine 2\n';
      const right = '';

      const patch = generateUnifiedDiff('old.txt', 'empty.txt', left, right);
      expect(patch).toContain('-Line 1');
      expect(patch).toContain('-Line 2');
    });
  });

  describe('generateHtmlReport', () => {
    it('generates a self-contained HTML document with diff tables and styles', () => {
      const html = generateHtmlReport({
        leftTitle: 'v1.0.0/config.json',
        rightTitle: 'v2.0.0/config.json',
        leftContent: '{\n  "version": "1.0"\n}\n',
        rightContent: '{\n  "version": "2.0",\n  "enabled": true\n}\n',
        language: 'json',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>WebMerge Diff Report</title>');
      expect(html).toContain('v1.0.0/config.json');
      expect(html).toContain('v2.0.0/config.json');
      expect(html).toContain('class="diff-line');
      expect(html).toContain('<style>');
    });
  });
});
