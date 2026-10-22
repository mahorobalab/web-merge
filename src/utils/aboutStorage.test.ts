import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldShowAboutOnStartup,
  markAboutAsShown,
  resetAboutShown,
  ABOUT_SHOWN_STORAGE_KEY,
} from './aboutStorage';

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('aboutStorage', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('should return true on first access when storage key is missing', () => {
    expect(shouldShowAboutOnStartup(mockStorage)).toBe(true);
  });

  it('should return false once markAboutAsShown is called', () => {
    expect(shouldShowAboutOnStartup(mockStorage)).toBe(true);
    markAboutAsShown(mockStorage);
    expect(mockStorage.getItem(ABOUT_SHOWN_STORAGE_KEY)).toBe('true');
    expect(shouldShowAboutOnStartup(mockStorage)).toBe(false);
  });

  it('should reset flag when resetAboutShown is called', () => {
    markAboutAsShown(mockStorage);
    expect(shouldShowAboutOnStartup(mockStorage)).toBe(false);
    resetAboutShown(mockStorage);
    expect(mockStorage.getItem(ABOUT_SHOWN_STORAGE_KEY)).toBeNull();
    expect(shouldShowAboutOnStartup(mockStorage)).toBe(true);
  });

  it('should gracefully handle null storage without throwing', () => {
    expect(shouldShowAboutOnStartup(null)).toBe(false);
    expect(() => markAboutAsShown(null)).not.toThrow();
    expect(() => resetAboutShown(null)).not.toThrow();
  });

  it('should handle storage errors gracefully', () => {
    const errorStorage = {
      getItem: () => {
        throw new Error('Access denied');
      },
      setItem: () => {
        throw new Error('Quota exceeded');
      },
      removeItem: () => {
        throw new Error('Access denied');
      },
      clear: () => {},
      key: () => null,
      length: 0,
    } as unknown as Storage;

    expect(shouldShowAboutOnStartup(errorStorage)).toBe(false);
    expect(() => markAboutAsShown(errorStorage)).not.toThrow();
    expect(() => resetAboutShown(errorStorage)).not.toThrow();
  });
});
