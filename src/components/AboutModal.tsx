import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  GitCompare,
  ExternalLink,
  ShieldCheck,
  Save,
  FolderGit2,
  Search,
  Code2,
  Boxes,
  Info,
} from 'lucide-react';
import {
  APP_INFO,
  OPEN_SOURCE_LIBRARIES,
  getAboutLabels,
  type OpenSourceLibrary,
} from '../data/aboutData';
import { useTranslation } from '../i18n/I18nContext';
import './AboutModal.css';

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const overlayRef = useRef<HTMLDivElement>(null);

  const labels = useMemo(() => getAboutLabels(locale), [locale]);
  const isJa = locale === 'ja';

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter libraries by category and search keyword
  const filteredLibraries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return OPEN_SOURCE_LIBRARIES.filter((lib) => {
      if (selectedCategory !== 'all' && lib.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      const matchName = lib.name.toLowerCase().includes(query);
      const matchPkg = lib.package.toLowerCase().includes(query);
      const matchDesc =
        lib.description.en.toLowerCase().includes(query) ||
        lib.description.ja.toLowerCase().includes(query);
      return matchName || matchPkg || matchDesc;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck size={20} />;
      case 'Save':
        return <Save size={20} />;
      case 'FolderGit2':
        return <FolderGit2 size={20} />;
      default:
        return <GitCompare size={20} />;
    }
  };

  return (
    <div
      className="about-modal-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="about-modal-container">
        {/* Header */}
        <header className="about-modal-header">
          <div className="about-header-branding">
            <div className="about-logo-badge">
              <GitCompare size={26} />
            </div>
            <div className="about-header-text">
              <h2 id="about-modal-title">
                {APP_INFO.name}
                <span className="about-version-tag">v{APP_INFO.version}</span>
              </h2>
              <p>{isJa ? APP_INFO.tagline.ja : APP_INFO.tagline.en}</p>
            </div>
          </div>
          <button
            type="button"
            className="about-modal-close-btn"
            onClick={onClose}
            aria-label={labels.close}
            title={labels.close}
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="about-modal-tabs">
          <button
            type="button"
            className={`about-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Info size={15} />
            <span>{labels.tabOverview}</span>
          </button>
          <button
            type="button"
            className={`about-tab-btn ${activeTab === 'licenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('licenses')}
          >
            <Boxes size={15} />
            <span>{labels.tabLicenses}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="about-modal-body">
          {activeTab === 'overview' ? (
            <div className="about-overview-section">
              {/* Tagline Card */}
              <div className="about-tagline-card">
                <p className="about-tagline-text">
                  {isJa ? APP_INFO.description.ja : APP_INFO.description.en}
                </p>
                <div className="about-actions-row">
                  <a
                    href={APP_INFO.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-github-link"
                  >
                    <Code2 size={16} />
                    <span>{labels.viewOnGitHub}</span>
                    <ExternalLink size={13} />
                  </a>
                  <div className="about-privacy-badge">
                    <ShieldCheck size={15} />
                    <span>{labels.privacyNotice}</span>
                  </div>
                </div>
              </div>

              {/* Key Features Grid */}
              <div className="about-features-container">
                <h3 className="about-features-title">{labels.featuresTitle}</h3>
                <div className="about-features-grid">
                  {APP_INFO.features.map((feature, idx) => (
                    <div key={idx} className="about-feature-item">
                      <div className="about-feature-icon">
                        {renderFeatureIcon(feature.iconName)}
                      </div>
                      <div className="about-feature-content">
                        <h4>{isJa ? feature.title.ja : feature.title.en}</h4>
                        <p>{isJa ? feature.desc.ja : feature.desc.en}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="about-licenses-section">
              {/* Search & Category Filter */}
              <div className="about-licenses-toolbar">
                <div className="about-search-input-wrap">
                  <Search size={15} />
                  <input
                    type="text"
                    className="about-search-input"
                    placeholder={labels.searchLibrariesPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="about-category-pills">
                  <button
                    type="button"
                    className={`about-category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    {labels.categoryAll}
                  </button>
                  <button
                    type="button"
                    className={`about-category-pill ${selectedCategory === 'editor' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('editor')}
                  >
                    {labels.categoryEditor}
                  </button>
                  <button
                    type="button"
                    className={`about-category-pill ${selectedCategory === 'core' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('core')}
                  >
                    {labels.categoryCore}
                  </button>
                  <button
                    type="button"
                    className={`about-category-pill ${selectedCategory === 'ui' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('ui')}
                  >
                    {labels.categoryUi}
                  </button>
                  <button
                    type="button"
                    className={`about-category-pill ${selectedCategory === 'tooling' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('tooling')}
                  >
                    {labels.categoryTooling}
                  </button>
                </div>
              </div>

              {/* Libraries List */}
              <div className="about-libraries-list">
                {filteredLibraries.length === 0 ? (
                  <div className="about-no-results">
                    <p>{isJa ? '該当するライブラリが見つかりませんでした。' : 'No matching libraries found.'}</p>
                  </div>
                ) : (
                  filteredLibraries.map((lib: OpenSourceLibrary) => (
                    <div key={lib.package} className="about-library-card">
                      <div className="about-library-header">
                        <div className="about-library-title-group">
                          <span className="about-library-name">{lib.name}</span>
                          <span className="about-library-version">{lib.version}</span>
                        </div>
                        <div className="about-library-badges">
                          <span className="about-license-badge">{lib.license}</span>
                          <a
                            href={lib.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="about-library-link"
                            title={`${lib.name} repository`}
                          >
                            <span>{labels.website}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                      <p className="about-library-desc">
                        {isJa ? lib.description.ja : lib.description.en}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="about-modal-footer">
          <div className="about-footer-meta">
            <span>
              {APP_INFO.name} © 2026 | {APP_INFO.license}
            </span>
          </div>
          <button type="button" className="about-close-btn" onClick={onClose}>
            {labels.close}
          </button>
        </footer>
      </div>
    </div>
  );
};
