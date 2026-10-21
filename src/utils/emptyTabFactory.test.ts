import { describe, it, expect } from 'vitest';
import { createEmptyCompareTab } from './emptyTabFactory';

describe('emptyTabFactory', () => {
  it('creates an empty tab with Japanese untitled naming by default', () => {
    const tab = createEmptyCompareTab({ counter: 1, locale: 'ja', timestamp: 1234567890 });

    expect(tab.id).toBe('file-new-1234567890');
    expect(tab.type).toBe('file');
    expect(tab.title).toBe('無題 1 ↔ 無題 1');
    expect(tab.canClose).toBe(true);

    expect(tab.leftFile).toBeDefined();
    expect(tab.leftFile?.name).toBe('無題 1 (左)');
    expect(tab.leftFile?.content).toBe('');
    expect(tab.leftFile?.size).toBe(0);
    expect(tab.leftFile?.isDirty).toBe(false);
    expect(tab.leftFile?.encoding).toBe('utf-8');

    expect(tab.rightFile).toBeDefined();
    expect(tab.rightFile?.name).toBe('無題 1 (右)');
    expect(tab.rightFile?.content).toBe('');
    expect(tab.rightFile?.size).toBe(0);
    expect(tab.rightFile?.isDirty).toBe(false);
    expect(tab.rightFile?.encoding).toBe('utf-8');
  });

  it('creates an empty tab with English untitled naming when locale is en', () => {
    const tab = createEmptyCompareTab({ counter: 2, locale: 'en', timestamp: 9876543210 });

    expect(tab.id).toBe('file-new-9876543210');
    expect(tab.type).toBe('file');
    expect(tab.title).toBe('Untitled 2 ↔ Untitled 2');

    expect(tab.leftFile?.name).toBe('Untitled 2 (Left)');
    expect(tab.leftFile?.content).toBe('');
    expect(tab.rightFile?.name).toBe('Untitled 2 (Right)');
    expect(tab.rightFile?.content).toBe('');
  });

  it('increments untitled number accurately according to counter parameter', () => {
    const tab1 = createEmptyCompareTab({ counter: 1 });
    const tab2 = createEmptyCompareTab({ counter: 2 });
    const tab3 = createEmptyCompareTab({ counter: 3 });

    expect(tab1.title).toBe('無題 1 ↔ 無題 1');
    expect(tab2.title).toBe('無題 2 ↔ 無題 2');
    expect(tab3.title).toBe('無題 3 ↔ 無題 3');
  });
});
