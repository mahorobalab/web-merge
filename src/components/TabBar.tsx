import React from 'react';
import { FileText, FolderTree, X, Plus } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import './TabBar.css';

export type TabType = 'folder' | 'file';

export interface TabItem {
  id: string;
  type: TabType;
  title: string;
  isDirty?: boolean;
  canClose?: boolean;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewCompare?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewCompare,
}) => {
  const { t } = useTranslation();

  return (
    <div className="webmerge-tab-bar">
      <div className="tab-scroll-container">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isDirty = Boolean(tab.isDirty);
          return (
            <div
              key={tab.id}
              className={`webmerge-tab ${isActive ? 'active' : ''} ${isDirty ? 'is-dirty' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              onAuxClick={(e) => {
                // Middle click closes tab
                if (e.button === 1 && tab.canClose !== false) {
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }
              }}
              title={tab.title}
            >
              <span className="tab-icon">
                {tab.type === 'folder' ? (
                  <FolderTree size={14} color="#eab308" />
                ) : (
                  <FileText size={14} color="#60a5fa" />
                )}
              </span>

              <span className="tab-title">{tab.title}</span>

              <div className="tab-actions">
                {isDirty && <span className="tab-dirty-indicator" title="Unsaved changes" />}

                {tab.canClose !== false && (
                  <button
                    type="button"
                    className="tab-close-btn"
                    title={t.tabs.close}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {onNewCompare && (
          <button
            type="button"
            className="tab-new-btn"
            title={`${t.toolbar.newFile} (Ctrl+N)`}
            onClick={onNewCompare}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
