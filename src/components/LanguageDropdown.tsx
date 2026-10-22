import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useTranslation, type LocalePreference, type LocaleInfo } from '../i18n/I18nContext';

export interface LanguageDropdownProps {
  className?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ className = '' }) => {
  const { locale, preference, detectedLocale, setLocale, supportedLocales } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentInfo = supportedLocales.find((l) => l.code === locale) || supportedLocales[0];
  const detectedInfo = supportedLocales.find((l) => l.code === detectedLocale) || supportedLocales[0];

  const handleSelect = (code: LocalePreference) => {
    setLocale(code);
    setIsOpen(false);
  };

  const triggerLabel =
    preference === 'auto'
      ? `Auto (${currentInfo.nativeName})`
      : currentInfo.nativeName;

  return (
    <div
      ref={containerRef}
      className={`lang-dropdown-container ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        className={`lang-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={locale === 'ja' ? '言語を切り替え' : 'Switch Language'}
      >
        <Globe size={14} className="lang-icon" />
        <span className="lang-current-label">{triggerLabel}</span>
        <ChevronDown
          size={12}
          className={`lang-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="lang-menu" role="listbox">
          {/* Top item: Auto / Browser Language */}
          <div className="lang-menu-header">
            <span className="lang-menu-title">
              {locale === 'ja' ? '表示言語の選択' : 'Display Language'}
            </span>
          </div>

          <button
            type="button"
            role="option"
            aria-selected={preference === 'auto'}
            className={`lang-item auto-item ${preference === 'auto' ? 'selected' : ''}`}
            onClick={() => handleSelect('auto')}
          >
            <div className="lang-item-left">
              <span className="lang-check-icon">
                {preference === 'auto' ? <Check size={14} /> : null}
              </span>
              <Sparkles size={13} className="lang-auto-sparkle" />
              <span className="lang-name font-medium">Auto</span>
            </div>
            <span className="lang-auto-badge">
              {detectedInfo.nativeName}
            </span>
          </button>

          <div className="lang-divider" />

          {/* Supported Languages List */}
          <div className="lang-list-scroll">
            {supportedLocales.map((item: LocaleInfo) => {
              const isSelected = preference === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`lang-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(item.code)}
                >
                  <div className="lang-item-left">
                    <span className="lang-check-icon">
                      {isSelected ? <Check size={14} /> : null}
                    </span>
                    <span className="lang-name">{item.nativeName}</span>
                  </div>
                  <span className="lang-english-sub">{item.englishName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
