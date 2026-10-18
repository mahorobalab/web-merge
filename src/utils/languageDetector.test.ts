import { describe, it, expect } from 'vitest';
import { detectLanguage } from './languageDetector';

describe('detectLanguage', () => {
  it('correctly detects major programming languages by extension', () => {
    expect(detectLanguage('index.ts')).toBe('typescript');
    expect(detectLanguage('App.tsx')).toBe('typescript');
    expect(detectLanguage('script.js')).toBe('javascript');
    expect(detectLanguage('main.py')).toBe('python');
    expect(detectLanguage('lib.rs')).toBe('rust');
    expect(detectLanguage('main.go')).toBe('go');
  });

  it('correctly detects markup and config file formats', () => {
    expect(detectLanguage('index.html')).toBe('html');
    expect(detectLanguage('styles.css')).toBe('css');
    expect(detectLanguage('package.json')).toBe('json');
    expect(detectLanguage('README.md')).toBe('markdown');
    expect(detectLanguage('docker-compose.yml')).toBe('yaml');
  });

  it('correctly identifies special filenames without extensions', () => {
    expect(detectLanguage('Dockerfile')).toBe('dockerfile');
    expect(detectLanguage('Makefile')).toBe('makefile');
  });

  it('falls back to plaintext for unknown extensions or empty strings', () => {
    expect(detectLanguage('data.unknown')).toBe('plaintext');
    expect(detectLanguage('')).toBe('plaintext');
    expect(detectLanguage('noextension')).toBe('plaintext');
  });
});
