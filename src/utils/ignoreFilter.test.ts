import { describe, it, expect } from 'vitest';
import { isPathIgnored } from './ignoreFilter';

describe('ignoreFilter', () => {
  it('.gitディレクトリやその配下のファイルを除外できること', () => {
    expect(isPathIgnored('.git')).toBe(true);
    expect(isPathIgnored('.git/config')).toBe(true);
    expect(isPathIgnored('.git/objects/abc')).toBe(true);
  });

  it('node_modulesやその配下のファイルを除外できること', () => {
    expect(isPathIgnored('node_modules')).toBe(true);
    expect(isPathIgnored('node_modules/react/index.js')).toBe(true);
    expect(isPathIgnored('packages/app/node_modules/lodash/index.js')).toBe(true);
  });

  it('システムファイル(.DS_Store, Thumbs.db)を除外できること', () => {
    expect(isPathIgnored('.DS_Store')).toBe(true);
    expect(isPathIgnored('src/.DS_Store')).toBe(true);
    expect(isPathIgnored('Thumbs.db')).toBe(true);
  });

  it('通常ソースファイルは除外されないこと', () => {
    expect(isPathIgnored('src/index.ts')).toBe(false);
    expect(isPathIgnored('README.md')).toBe(false);
    expect(isPathIgnored('package.json')).toBe(false);
    expect(isPathIgnored('components/Header.tsx')).toBe(false);
  });

  it('Windowsのバックスラッシュを含むパスでも正しく除外判定できること', () => {
    expect(isPathIgnored('node_modules\\react\\index.js')).toBe(true);
    expect(isPathIgnored('.git\\HEAD')).toBe(true);
    expect(isPathIgnored('src\\main.tsx')).toBe(false);
  });
});
