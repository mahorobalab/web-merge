import type { AppTab, FileState } from '../types/app';
import type { Locale } from '../i18n/I18nContext';

export interface CreateEmptyCompareOptions {
  counter: number;
  locale?: Locale | string;
  timestamp?: number;
}

/**
 * Creates an empty side-by-side diff comparison tab in WinMerge style.
 * Both sides are initialized with empty content and untitled labels.
 */
export function createEmptyCompareTab(options: CreateEmptyCompareOptions): AppTab {
  const { counter, locale = 'ja', timestamp = Date.now() } = options;
  const untitledBase = locale === 'ja' ? `無題 ${counter}` : `Untitled ${counter}`;

  const leftFile: FileState = {
    name: locale === 'ja' ? `${untitledBase} (左)` : `${untitledBase} (Left)`,
    content: '',
    encoding: 'utf-8',
    isDirty: false,
    size: 0,
    lastModified: timestamp,
  };

  const rightFile: FileState = {
    name: locale === 'ja' ? `${untitledBase} (右)` : `${untitledBase} (Right)`,
    content: '',
    encoding: 'utf-8',
    isDirty: false,
    size: 0,
    lastModified: timestamp,
  };

  return {
    id: `file-new-${timestamp}`,
    type: 'file',
    title: `${untitledBase} ↔ ${untitledBase}`,
    canClose: true,
    leftFile,
    rightFile,
  };
}
