import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES, detectBrowserLocale } from './I18nContext';
import { en } from './locales/en';
import { ja } from './locales/ja';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { ko } from './locales/ko';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { it as itLocale } from './locales/it';
import { pt } from './locales/pt';
import { nl } from './locales/nl';
import { ru } from './locales/ru';
import { pl } from './locales/pl';
import { cs } from './locales/cs';
import { hu } from './locales/hu';
import { uk } from './locales/uk';
import { ro } from './locales/ro';
import { el } from './locales/el';
import { tr } from './locales/tr';
import { da } from './locales/da';
import { fi } from './locales/fi';
import { no } from './locales/no';
import { sv } from './locales/sv';
import { ar } from './locales/ar';
import { fa } from './locales/fa';
import { he } from './locales/he';

describe('I18n Localization Suite', () => {
  it('supports exactly 26 locales matching WinMerge standard list', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(26);
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(26);
  });

  it('marks RTL languages (Arabic, Persian, Hebrew) correctly', () => {
    const rtlLocales = SUPPORTED_LOCALES.filter((l) => l.dir === 'rtl').map((l) => l.code);
    expect(rtlLocales).toContain('ar');
    expect(rtlLocales).toContain('fa');
    expect(rtlLocales).toContain('he');
    expect(rtlLocales).toHaveLength(3);
  });

  it('detects browser language accurately', () => {
    const originalNavigator = globalThis.navigator;
    try {
      // Mock Japanese browser
      Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'ja-JP', languages: ['ja-JP', 'ja', 'en'] },
        configurable: true,
      });
      expect(detectBrowserLocale()).toBe('ja');

      // Mock German browser
      Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'de-DE', languages: ['de-DE', 'de'] },
        configurable: true,
      });
      expect(detectBrowserLocale()).toBe('de');

      // Mock Traditional Chinese
      Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'zh-TW', languages: ['zh-TW', 'zh'] },
        configurable: true,
      });
      expect(detectBrowserLocale()).toBe('zh-TW');

      // Fallback to English for unknown language
      Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'xx-YY', languages: ['xx-YY'] },
        configurable: true,
      });
      expect(detectBrowserLocale()).toBe('en');
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    }
  });

  const allLocales = [
    { code: 'en', dict: en },
    { code: 'ja', dict: ja },
    { code: 'zh-CN', dict: zhCN },
    { code: 'zh-TW', dict: zhTW },
    { code: 'ko', dict: ko },
    { code: 'de', dict: de },
    { code: 'fr', dict: fr },
    { code: 'es', dict: es },
    { code: 'it', dict: itLocale },
    { code: 'pt', dict: pt },
    { code: 'nl', dict: nl },
    { code: 'ru', dict: ru },
    { code: 'pl', dict: pl },
    { code: 'cs', dict: cs },
    { code: 'hu', dict: hu },
    { code: 'uk', dict: uk },
    { code: 'ro', dict: ro },
    { code: 'el', dict: el },
    { code: 'tr', dict: tr },
    { code: 'da', dict: da },
    { code: 'fi', dict: fi },
    { code: 'no', dict: no },
    { code: 'sv', dict: sv },
    { code: 'ar', dict: ar },
    { code: 'fa', dict: fa },
    { code: 'he', dict: he },
  ];

  it.each(allLocales)('has valid structure and non-empty translations for $code', ({ dict }) => {
    expect(dict.app.title).toBe('WebMerge');
    expect(dict.toolbar.open).toBeTruthy();
    expect(dict.toolbar.newFile).toBeTruthy();
    expect(dict.folderPanel.compare).toBeTruthy();
    expect(dict.folderTable.name).toBeTruthy();
    expect(dict.statusbar.language).toBeTruthy();
    expect(dict.confirmModal.delete).toBeTruthy();
  });
});
