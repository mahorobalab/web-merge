import { describe, it, expect } from 'vitest';
import { matchFolderEntries, type FileEntry } from './diffMatcher';

describe('diffMatcher', () => {
  it('左のみ・右のみのファイルを正しく判定できること', () => {
    const left: FileEntry[] = [
      { path: 'file1.txt', name: 'file1.txt', size: 100, lastModified: 1000 },
    ];
    const right: FileEntry[] = [
      { path: 'file2.txt', name: 'file2.txt', size: 200, lastModified: 2000 },
    ];

    const result = matchFolderEntries(left, right);
    expect(result.items).toHaveLength(2);
    expect(result.summary.total).toBe(2);
    expect(result.summary.leftOnly).toBe(1);
    expect(result.summary.rightOnly).toBe(1);

    const item1 = result.items.find((i) => i.path === 'file1.txt');
    expect(item1?.status).toBe('left-only');

    const item2 = result.items.find((i) => i.path === 'file2.txt');
    expect(item2?.status).toBe('right-only');
  });

  it('サイズ・更新日時が一致するファイルをidenticalと判定できること', () => {
    const left: FileEntry[] = [
      { path: 'same.ts', name: 'same.ts', size: 500, lastModified: 5000 },
    ];
    const right: FileEntry[] = [
      { path: 'same.ts', name: 'same.ts', size: 500, lastModified: 5000 },
    ];

    const result = matchFolderEntries(left, right);
    expect(result.items[0].status).toBe('identical');
    expect(result.summary.identical).toBe(1);
  });

  it('サイズまたは更新日時が異なるファイルをmodifiedと判定できること', () => {
    const left: FileEntry[] = [
      { path: 'diff.ts', name: 'diff.ts', size: 500, lastModified: 5000 },
    ];
    const right: FileEntry[] = [
      { path: 'diff.ts', name: 'diff.ts', size: 520, lastModified: 5000 },
    ];

    const result = matchFolderEntries(left, right);
    expect(result.items[0].status).toBe('modified');
    expect(result.summary.modified).toBe(1);
  });

  it('ハッシュ値が指定されている場合はハッシュの一致で判定できること', () => {
    const left: FileEntry[] = [
      { path: 'hash.ts', name: 'hash.ts', size: 500, lastModified: 1000, hash: 'abc123hash' },
    ];
    const right: FileEntry[] = [
      { path: 'hash.ts', name: 'hash.ts', size: 500, lastModified: 2000, hash: 'abc123hash' },
    ];

    const result = matchFolderEntries(left, right);
    // lastModifiedが異なっていてもhashが一致していればidentical
    expect(result.items[0].status).toBe('identical');
    expect(result.summary.identical).toBe(1);
  });

  it('パス順にアルファベット昇順ソートされること', () => {
    const left: FileEntry[] = [
      { path: 'z.txt', name: 'z.txt', size: 10, lastModified: 1 },
      { path: 'a.txt', name: 'a.txt', size: 10, lastModified: 1 },
      { path: 'm/sub.txt', name: 'sub.txt', size: 10, lastModified: 1 },
    ];
    const right: FileEntry[] = [];

    const result = matchFolderEntries(left, right);
    expect(result.items.map((i) => i.path)).toEqual(['a.txt', 'm/sub.txt', 'z.txt']);
  });
});
