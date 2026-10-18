import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  FilePlus,
  FileMinus,
  FileDiff,
  Check,
} from 'lucide-react';
import type { DiffItem, DiffSummary, DiffStatus } from '../utils/diffMatcher';
import { useTranslation } from '../i18n/I18nContext';
import './FolderDiffPanel.css';

interface FolderDiffPanelProps {
  leftFolderName?: string;
  rightFolderName?: string;
  diffItems: DiffItem[];
  summary: DiffSummary;
  selectedPath?: string;
  isScanning: boolean;
  scanProgressText?: string;
  onOpenLeftFolder: () => void;
  onOpenRightFolder: () => void;
  onSelectFile: (item: DiffItem) => void;
}

type FilterType = 'all' | 'diffs' | 'modified' | 'left-only' | 'right-only' | 'identical';

export const FolderDiffPanel: React.FC<FolderDiffPanelProps> = ({
  leftFolderName,
  rightFolderName,
  diffItems,
  summary,
  selectedPath,
  isScanning,
  scanProgressText,
  onOpenLeftFolder,
  onOpenRightFolder,
  onSelectFile,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter diff items based on query and selected category
  const filteredItems = useMemo(() => {
    return diffItems.filter((item) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!item.path.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (filterType === 'all') return true;
      if (filterType === 'diffs') return item.status !== 'identical';
      return item.status === filterType;
    });
  }, [diffItems, searchQuery, filterType]);

  const getStatusIcon = (status: DiffStatus) => {
    switch (status) {
      case 'modified':
        return <FileDiff size={14} color="#60a5fa" />;
      case 'left-only':
        return <FileMinus size={14} color="#f87171" />;
      case 'right-only':
        return <FilePlus size={14} color="#4ade80" />;
      case 'identical':
        return <Check size={14} color="#71717a" />;
    }
  };

  const getStatusLabel = (status: DiffStatus) => {
    switch (status) {
      case 'modified':
        return t.status.modified;
      case 'left-only':
        return t.status.leftOnly;
      case 'right-only':
        return t.status.rightOnly;
      case 'identical':
        return t.status.identical;
    }
  };

  if (collapsed) {
    return (
      <div className="folder-diff-panel collapsed">
        <button
          className="btn-icon"
          onClick={() => setCollapsed(false)}
          title={t.folderPanel.expand}
          style={{ margin: '8px auto' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="folder-diff-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <Folder size={16} color="#60a5fa" />
          <span>{t.folderPanel.title}</span>
        </div>
        <div className="panel-actions">
          <button
            className="btn-icon"
            onClick={() => setCollapsed(true)}
            title={t.folderPanel.collapse}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Directory Selector Pickers */}
      <div className="folder-pickers">
        <div className="picker-row">
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>{t.folderPanel.left}</span>
          <span className={`folder-name-tag ${leftFolderName ? 'active' : ''}`} title={leftFolderName || t.folderPanel.unselected}>
            {leftFolderName || t.folderPanel.unselected}
          </span>
          <button className="btn-secondary" style={{ padding: '3px 8px' }} onClick={onOpenLeftFolder}>
            <FolderOpen size={13} /> {t.folderPanel.select}
          </button>
        </div>

        <div className="picker-row">
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{t.folderPanel.right}</span>
          <span className={`folder-name-tag ${rightFolderName ? 'active' : ''}`} title={rightFolderName || t.folderPanel.unselected}>
            {rightFolderName || t.folderPanel.unselected}
          </span>
          <button className="btn-secondary" style={{ padding: '3px 8px' }} onClick={onOpenRightFolder}>
            <FolderOpen size={13} /> {t.folderPanel.select}
          </button>
        </div>
      </div>

      {/* Background Scanning Progress */}
      {isScanning && (
        <div className="scan-progress">
          <div className="spinner" />
          <span>{scanProgressText || t.folderPanel.scanning}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="filter-section">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="search-input"
            placeholder={t.folderPanel.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={13} style={{ position: 'absolute', right: 8, top: 7, color: 'var(--text-muted)' }} />
        </div>

        <div className="filter-pills">
          <button
            className={`pill-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            {t.folderPanel.filterAll} ({summary.total})
          </button>
          <button
            className={`pill-btn ${filterType === 'diffs' ? 'active' : ''}`}
            onClick={() => setFilterType('diffs')}
          >
            {t.folderPanel.filterDiffs} ({summary.modified + summary.leftOnly + summary.rightOnly})
          </button>
          <button
            className={`pill-btn ${filterType === 'modified' ? 'active' : ''}`}
            onClick={() => setFilterType('modified')}
          >
            {t.folderPanel.filterModified} ({summary.modified})
          </button>
          <button
            className={`pill-btn ${filterType === 'left-only' ? 'active' : ''}`}
            onClick={() => setFilterType('left-only')}
          >
            {t.folderPanel.filterLeftOnly} ({summary.leftOnly})
          </button>
          <button
            className={`pill-btn ${filterType === 'right-only' ? 'active' : ''}`}
            onClick={() => setFilterType('right-only')}
          >
            {t.folderPanel.filterRightOnly} ({summary.rightOnly})
          </button>
        </div>
      </div>

      {/* Diff File List */}
      <div className="diff-list-container">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <Filter size={24} />
            <span>
              {diffItems.length === 0
                ? t.folderPanel.emptySelectPrompt
                : t.folderPanel.noMatchingFiles}
            </span>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.path}
              className={`diff-list-item ${selectedPath === item.path ? 'selected' : ''}`}
              onClick={() => onSelectFile(item)}
              title={item.path}
            >
              <div className="item-left-info">
                {getStatusIcon(item.status)}
                <span className="item-path">{item.path}</span>
              </div>
              <span className={`status-badge ${item.status}`}>
                {getStatusLabel(item.status)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
