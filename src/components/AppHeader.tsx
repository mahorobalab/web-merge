import React from 'react';
import { ArrowRightLeft, ShieldCheck, CheckCircle2, AlertCircle, Globe, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTranslation, type Locale } from '../i18n/I18nContext';

export interface AppHeaderProps {
  hasActiveTab?: boolean;
  isFolderTab: boolean;
  folderDiffCount: number;
  isFileMatch: boolean;
  locale: Locale;
  onChangeLocale?: (locale: Locale) => void;
  onToggleLocale?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  hasActiveTab = true,
  isFolderTab,
  folderDiffCount,
  isFileMatch,
  locale,
  onChangeLocale,
  theme,
  onToggleTheme,
}) => {
  const { t, setLocale, supportedLocales } = useTranslation();

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as Locale;
    if (onChangeLocale) {
      onChangeLocale(nextLocale);
    } else {
      setLocale(nextLocale);
    }
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <ArrowRightLeft size={20} />
          <span>{t.app.title}</span>
        </div>
        <span className="brand-badge">{t.app.tagline}</span>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <ShieldCheck size={14} color="#10b981" />
          <span>{t.app.zeroServer}</span>
        </div>

        {hasActiveTab && (
          <div className="stat-item">
            {isFolderTab ? (
              folderDiffCount === 0 ? (
                <span className="stat-diff-tag equal">
                  <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {t.app.noDiff}
                </span>
              ) : (
                <span className="stat-diff-tag different">
                  <AlertCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {folderDiffCount} {t.app.hasDiff}
                </span>
              )
            ) : isFileMatch ? (
              <span className="stat-diff-tag equal">
                <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                {t.app.noDiff}
              </span>
            ) : (
              <span className="stat-diff-tag different">
                <AlertCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                {t.app.hasDiff}
              </span>
            )}
          </div>
        )}

        {/* Language Select Dropdown */}
        <div
          className="language-select-wrapper"
          title="Select Language / 言語選択"
        >
          <Globe size={13} className="language-icon" />
          <select
            className="language-select"
            value={locale}
            onChange={handleLocaleChange}
            aria-label="Select Language"
          >
            {supportedLocales.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.nativeName}
              </option>
            ))}
          </select>
          <ChevronDown size={11} className="language-chevron" />
        </div>

        {/* Theme Toggle */}
        <button
          className="btn-secondary theme-toggle-btn"
          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
          onClick={onToggleTheme}
          title={theme === 'dark' ? (locale === 'ja' ? 'ライトモードに切り替え' : 'Switch to Light Mode') : (locale === 'ja' ? 'ダークモードに切り替え' : 'Switch to Dark Mode')}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={13} color="#f59e0b" />
              <span>{locale === 'ja' ? 'ライト' : 'Light'}</span>
            </>
          ) : (
            <>
              <Moon size={13} color="#3b82f6" />
              <span>{locale === 'ja' ? 'ダーク' : 'Dark'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
