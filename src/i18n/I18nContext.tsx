import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './locales/en';
import { ja } from './locales/ja';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { ko } from './locales/ko';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { it } from './locales/it';
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
import type { Translations } from './locales/en';

export type Locale =
  | 'en'
  | 'ja'
  | 'zh-CN'
  | 'zh-TW'
  | 'ko'
  | 'de'
  | 'fr'
  | 'es'
  | 'it'
  | 'pt'
  | 'nl'
  | 'ru'
  | 'pl'
  | 'cs'
  | 'hu'
  | 'uk'
  | 'ro'
  | 'el'
  | 'tr'
  | 'da'
  | 'fi'
  | 'no'
  | 'sv'
  | 'ar'
  | 'fa'
  | 'he';

export interface LocaleInfo {
  code: Locale;
  nativeName: string;
  englishName: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese' },
  { code: 'zh-CN', nativeName: '简体中文', englishName: 'Chinese (Simplified)' },
  { code: 'zh-TW', nativeName: '繁體中文', englishName: 'Chinese (Traditional)' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
  { code: 'fr', nativeName: 'Français', englishName: 'French' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese' },
  { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish' },
  { code: 'cs', nativeName: 'Čeština', englishName: 'Czech' },
  { code: 'hu', nativeName: 'Magyar', englishName: 'Hungarian' },
  { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian' },
  { code: 'ro', nativeName: 'Română', englishName: 'Romanian' },
  { code: 'el', nativeName: 'Ελληνικά', englishName: 'Greek' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish' },
  { code: 'da', nativeName: 'Dansk', englishName: 'Danish' },
  { code: 'fi', nativeName: 'Suomi', englishName: 'Finnish' },
  { code: 'no', nativeName: 'Norsk', englishName: 'Norwegian' },
  { code: 'sv', nativeName: 'Svenska', englishName: 'Swedish' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl' },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', dir: 'rtl' },
  { code: 'he', nativeName: 'עברית', englishName: 'Hebrew', dir: 'rtl' },
];

const translationsMap: Record<Locale, Translations> = {
  en,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ko,
  de,
  fr,
  es,
  it,
  pt,
  nl,
  ru,
  pl,
  cs,
  hu,
  uk,
  ro,
  el,
  tr,
  da,
  fi,
  no,
  sv,
  ar,
  fa,
  he,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  supportedLocales: LocaleInfo[];
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: en,
  supportedLocales: SUPPORTED_LOCALES,
});

const STORAGE_KEY = 'webmerge_locale';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale;
      if (saved && translationsMap[saved]) {
        return saved;
      }
    }
    return 'en';
  });

  const setLocale = (newLocale: Locale) => {
    if (translationsMap[newLocale]) {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newLocale);
      }
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      const localeInfo = SUPPORTED_LOCALES.find((l) => l.code === locale);
      document.documentElement.dir = localeInfo?.dir === 'rtl' ? 'rtl' : 'ltr';
    }
  }, [locale]);

  const value = {
    locale,
    setLocale,
    t: translationsMap[locale] || en,
    supportedLocales: SUPPORTED_LOCALES,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useTranslation() {
  return useContext(I18nContext);
}
