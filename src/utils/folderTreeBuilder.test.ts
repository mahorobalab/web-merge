import { describe, it, expect } from 'vitest';
import { buildFolderTree, flattenFolderTree, getFileExtension } from './folderTreeBuilder';
import type { DiffItem } from './diffMatcher';

describe('folderTreeBuilder', () => {
  it('extracts file extensions correctly', () => {
    expect(getFileExtension('manifest.json')).toBe('json');
    expect(getFileExtension('test.file.ts')).toBe('ts');
    expect(getFileExtension('README')).toBe('');
    expect(getFileExtension('.gitignore')).toBe('gitignore');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('builds a hierarchical tree from flat DiffItem list', () => {
    const items: DiffItem[] = [
      {
        path: 'README.md',
        name: 'README.md',
        status: 'identical',
        left: { path: 'README.md', name: 'README.md', size: 100, lastModified: 1000 },
        right: { path: 'README.md', name: 'README.md', size: 100, lastModified: 1000 },
      },
      {
        path: 'dist/manifest.json',
        name: 'manifest.json',
        status: 'modified',
        left: { path: 'dist/manifest.json', name: 'manifest.json', size: 200, lastModified: 2000 },
        right: { path: 'dist/manifest.json', name: 'manifest.json', size: 250, lastModified: 2500 },
      },
      {
        path: 'dist/new_doc.txt',
        name: 'new_doc.txt',
        status: 'right-only',
        right: { path: 'dist/new_doc.txt', name: 'new_doc.txt', size: 50, lastModified: 3000 },
      },
      {
        path: 'src/index.ts',
        name: 'index.ts',
        status: 'identical',
        left: { path: 'src/index.ts', name: 'index.ts', size: 300, lastModified: 1500 },
        right: { path: 'src/index.ts', name: 'index.ts', size: 300, lastModified: 1500 },
      },
    ];

    const tree = buildFolderTree(items);

    // Root should have 2 folders ('dist', 'src') sorted first, then 1 file ('README.md')
    expect(tree).toHaveLength(3);
    expect(tree[0].name).toBe('dist');
    expect(tree[0].isFolder).toBe(true);
    expect(tree[0].status).toBe('modified'); // Contains modified and right-only files

    expect(tree[1].name).toBe('src');
    expect(tree[1].isFolder).toBe(true);
    expect(tree[1].status).toBe('identical'); // Contains only identical files

    expect(tree[2].name).toBe('README.md');
    expect(tree[2].isFolder).toBe(false);
    expect(tree[2].status).toBe('identical');

    // Check children of dist
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].name).toBe('manifest.json');
    expect(tree[0].children[1].name).toBe('new_doc.txt');
  });

  it('flattens tree properly based on expanded folders', () => {
    const items: DiffItem[] = [
      {
        path: 'dist/assets/app.js',
        name: 'app.js',
        status: 'identical',
      },
      {
        path: 'dist/manifest.json',
        name: 'manifest.json',
        status: 'modified',
      },
      {
        path: 'README.md',
        name: 'README.md',
        status: 'identical',
      },
    ];

    const tree = buildFolderTree(items);

    // When none expanded: only root items ('dist', 'README.md')
    const collapsed = flattenFolderTree(tree, new Set());
    expect(collapsed.map((n) => n.path)).toEqual(['dist', 'README.md']);

    // When 'dist' is expanded: 'dist', 'dist/assets', 'dist/manifest.json', 'README.md'
    const distExpanded = flattenFolderTree(tree, new Set(['dist']));
    expect(distExpanded.map((n) => n.path)).toEqual([
      'dist',
      'dist/assets',
      'dist/manifest.json',
      'README.md',
    ]);

    // When both 'dist' and 'dist/assets' are expanded
    const allExpanded = flattenFolderTree(tree, new Set(['dist', 'dist/assets']));
    expect(allExpanded.map((n) => n.path)).toEqual([
      'dist',
      'dist/assets',
      'dist/assets/app.js',
      'dist/manifest.json',
      'README.md',
    ]);
  });
});
