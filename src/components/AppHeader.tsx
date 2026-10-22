import React from 'react';
import { GitCompare, ShieldCheck, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTranslation, type Locale } from '../i18n/I18nContext';
import { LanguageDropdown } from './LanguageDropdown';

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
  theme,
  onToggleTheme,
}) => {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <div className="brand-logo-badge">
            <GitCompare size={17} />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">{t.app.title}</span>
            <span className="brand-subtitle">inspired by WinMerge</span>
          </div>
        </div>
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

        {/* Language Dropdown */}
        <LanguageDropdown />

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
