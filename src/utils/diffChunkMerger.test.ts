import { describe, it, expect } from 'vitest';
import {
  copyChunkLeftToRight,
  copyChunkRightToLeft,
  copySelectedLines,
  findLineChangeAtLine,
  type LineChangeInfo,
} from './diffChunkMerger';

describe('diffChunkMerger', () => {
  const leftText = [
    'line 1',
    'line 2 (left)',
    'line 3 (left)',
    'line 4',
  ].join('\n');

  const rightText = [
    'line 1',
    'line 2 (right)',
    'line 4',
  ].join('\n');

  // Change at line 2..3 in left, line 2..2 in right
  const change: LineChangeInfo = {
    originalStartLineNumber: 2,
    originalEndLineNumber: 3,
    modifiedStartLineNumber: 2,
    modifiedEndLineNumber: 2,
  };

  describe('copyChunkLeftToRight', () => {
    it('copies modified lines from left into right text', () => {
      const result = copyChunkLeftToRight(leftText, rightText, change);
      expect(result).toBe([
        'line 1',
        'line 2 (left)',
        'line 3 (left)',
        'line 4',
      ].join('\n'));
    });

    it('handles addition (when right had 0 lines)', () => {
      const left = 'A\nB\nC';
      const right = 'A\nC';
      const addChange: LineChangeInfo = {
        originalStartLineNumber: 2,
        originalEndLineNumber: 2,
        modifiedStartLineNumber: 1,
        modifiedEndLineNumber: 0,
      };
      const result = copyChunkLeftToRight(left, right, addChange);
      expect(result).toBe('A\nB\nC');
    });

    it('handles deletion (when left had 0 lines, copies emptiness to right)', () => {
      const left = 'A\nC';
      const right = 'A\nB\nC';
      const delChange: LineChangeInfo = {
        originalStartLineNumber: 2,
        originalEndLineNumber: 0,
        modifiedStartLineNumber: 2,
        modifiedEndLineNumber: 2,
      };
      const result = copyChunkLeftToRight(left, right, delChange);
      expect(result).toBe('A\nC');
    });
  });

  describe('copyChunkRightToLeft', () => {
    it('copies modified lines from right into left text', () => {
      const result = copyChunkRightToLeft(leftText, rightText, change);
      expect(result).toBe([
        'line 1',
        'line 2 (right)',
        'line 4',
      ].join('\n'));
    });
  });

  describe('copySelectedLines', () => {
    it('replaces targeted lines with selected lines from source', () => {
      const src = 'Header\nNew Line A\nNew Line B\nFooter';
      const target = 'Header\nOld Line\nFooter';
      const result = copySelectedLines(src, target, 2, 3, 2, 2);
      expect(result).toBe('Header\nNew Line A\nNew Line B\nFooter');
    });
  });

  describe('findLineChangeAtLine', () => {
    const changes: LineChangeInfo[] = [
      {
        originalStartLineNumber: 2,
        originalEndLineNumber: 3,
        modifiedStartLineNumber: 2,
        modifiedEndLineNumber: 2,
      },
      {
        originalStartLineNumber: 5,
        originalEndLineNumber: 5,
        modifiedStartLineNumber: 4,
        modifiedEndLineNumber: 5,
      },
    ];

    it('finds change in original (left) side by line number', () => {
      expect(findLineChangeAtLine(changes, 'left', 2)).toEqual(changes[0]);
      expect(findLineChangeAtLine(changes, 'left', 3)).toEqual(changes[0]);
      expect(findLineChangeAtLine(changes, 'left', 5)).toEqual(changes[1]);
      expect(findLineChangeAtLine(changes, 'left', 1)).toBeNull();
    });

    it('finds change in modified (right) side by line number', () => {
      expect(findLineChangeAtLine(changes, 'right', 2)).toEqual(changes[0]);
      expect(findLineChangeAtLine(changes, 'right', 4)).toEqual(changes[1]);
      expect(findLineChangeAtLine(changes, 'right', 5)).toEqual(changes[1]);
      expect(findLineChangeAtLine(changes, 'right', 1)).toBeNull();
    });
  });
});
