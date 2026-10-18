import { describe, it, expect } from 'vitest';
import { detectLanguage } from './languageDetector';

describe('detectLanguage', () => {
  it('主要なプログラミング言語の拡張子を正しく判定できること', () => {
    expect(detectLanguage('index.ts')).toBe('typescript');
    expect(detectLanguage('App.tsx')).toBe('typescript');
    expect(detectLanguage('script.js')).toBe('javascript');
    expect(detectLanguage('main.py')).toBe('python');
    expect(detectLanguage('lib.rs')).toBe('rust');
    expect(detectLanguage('main.go')).toBe('go');
  });

  it('マークアップや設定ファイルの拡張子を正しく判定できること', () => {
    expect(detectLanguage('index.html')).toBe('html');
    expect(detectLanguage('styles.css')).toBe('css');
    expect(detectLanguage('package.json')).toBe('json');
    expect(detectLanguage('README.md')).toBe('markdown');
    expect(detectLanguage('docker-compose.yml')).toBe('yaml');
  });

  it('拡張子のない特殊ファイル名を正しく判定できること', () => {
    expect(detectLanguage('Dockerfile')).toBe('dockerfile');
    expect(detectLanguage('Makefile')).toBe('makefile');
  });

  it('未知の拡張子や空文字の場合はplaintextを返すこと', () => {
    expect(detectLanguage('data.unknown')).toBe('plaintext');
    expect(detectLanguage('')).toBe('plaintext');
    expect(detectLanguage('noextension')).toBe('plaintext');
  });
});
