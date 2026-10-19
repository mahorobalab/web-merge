import { describe, it, expect } from 'vitest';
import {
  updateEntriesAfterCopy,
  updateEntriesAfterDelete,
} from './folderSync';
import type { FileEntry } from './diffMatcher';

describe('folderSync utility', () => {
  const leftEntries: FileEntry[] = [
    { path: 'manifest.json', name: 'manifest.json', size: 1024, lastModified: 1000, hash: 'hash1' },
    { path: 'dist/index.html', name: 'index.html', size: 4096, lastModified: 1000, hash: 'hash2' },
    { path: 'dist/app.js', name: 'app.js', size: 8192, lastModified: 1000, hash: 'hash3' },
  ];

  const rightEntries: FileEntry[] = [
    { path: 'manifest.json', name: 'manifest.json', size: 1080, lastModified: 2000, hash: 'hash1_diff' },
    { path: 'dist/index.html', name: 'index.html', size: 4096, lastModified: 1000, hash: 'hash2' },
  ];

  describe('updateEntriesAfterCopy', () => {
    it('should update existing target entry when copying modified file', () => {
      const updated = updateEntriesAfterCopy(leftEntries, rightEntries, 'manifest.json', false);
      const manifest = updated.find((e) => e.path === 'manifest.json');
      expect(manifest).toBeDefined();
      expect(manifest?.size).toBe(1024);
      expect(manifest?.hash).toBe('hash1');
      expect(updated.length).toBe(2);
    });

    it('should insert new target entry when copying left-only file', () => {
      const updated = updateEntriesAfterCopy(leftEntries, rightEntries, 'dist/app.js', false);
      expect(updated.length).toBe(3);
      const appJs = updated.find((e) => e.path === 'dist/app.js');
      expect(appJs).toBeDefined();
      expect(appJs?.size).toBe(8192);
      expect(appJs?.hash).toBe('hash3');
    });

    it('should copy all files under directory when copying a folder', () => {
      const emptyRight: FileEntry[] = [];
      const updated = updateEntriesAfterCopy(leftEntries, emptyRight, 'dist', true);
      expect(updated.length).toBe(2);
      expect(updated.some((e) => e.path === 'dist/index.html')).toBe(true);
      expect(updated.some((e) => e.path === 'dist/app.js')).toBe(true);
    });

    it('should assign new target handles and not leak source handles', () => {
      const mockTargetHandle = { name: 'app.js', kind: 'file' } as any;
      const targetHandles = new Map<string, FileSystemFileHandle>([
        ['dist/app.js', mockTargetHandle],
      ]);
      const updated = updateEntriesAfterCopy(leftEntries, rightEntries, 'dist/app.js', false, targetHandles);
      const appJs = updated.find((e) => e.path === 'dist/app.js');
      expect(appJs?.handle).toBe(mockTargetHandle);
    });
  });

  describe('updateEntriesAfterDelete', () => {
    it('should remove exact file entry on delete', () => {
      const updated = updateEntriesAfterDelete(leftEntries, 'manifest.json', false);
      expect(updated.length).toBe(2);
      expect(updated.some((e) => e.path === 'manifest.json')).toBe(false);
    });

    it('should remove all files in directory on folder delete', () => {
      const updated = updateEntriesAfterDelete(leftEntries, 'dist', true);
      expect(updated.length).toBe(1);
      expect(updated[0].path).toBe('manifest.json');
    });
  });
});
