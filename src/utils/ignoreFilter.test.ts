import { describe, it, expect } from 'vitest';
import { isPathIgnored } from './ignoreFilter';

describe('ignoreFilter', () => {
  it('excludes .git directory and nested files', () => {
    expect(isPathIgnored('.git')).toBe(true);
    expect(isPathIgnored('.git/config')).toBe(true);
    expect(isPathIgnored('.git/objects/abc')).toBe(true);
  });

  it('excludes node_modules and nested packages', () => {
    expect(isPathIgnored('node_modules')).toBe(true);
    expect(isPathIgnored('node_modules/react/index.js')).toBe(true);
    expect(isPathIgnored('packages/app/node_modules/lodash/index.js')).toBe(true);
  });

  it('excludes system artifacts like .DS_Store and Thumbs.db', () => {
    expect(isPathIgnored('.DS_Store')).toBe(true);
    expect(isPathIgnored('src/.DS_Store')).toBe(true);
    expect(isPathIgnored('Thumbs.db')).toBe(true);
  });

  it('preserves regular source and documentation files', () => {
    expect(isPathIgnored('src/index.ts')).toBe(false);
    expect(isPathIgnored('README.md')).toBe(false);
    expect(isPathIgnored('package.json')).toBe(false);
    expect(isPathIgnored('components/Header.tsx')).toBe(false);
  });

  it('handles Windows backslash separators correctly', () => {
    expect(isPathIgnored('node_modules\\react\\index.js')).toBe(true);
    expect(isPathIgnored('.git\\HEAD')).toBe(true);
    expect(isPathIgnored('src\\main.tsx')).toBe(false);
  });
});
