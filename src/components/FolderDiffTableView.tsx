import React, { useState, useMemo, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { DiffItem, DiffSummary } from '../utils/diffMatcher';
import {
  buildFolderTree,
  flattenFolderTree,
  type FolderTreeNode,
} from '../utils/folderTreeBuilder';
import { useTranslation } from '../i18n/I18nContext';
import './FolderDiffTableView.css';

export interface FolderDiffTableViewProps {
  leftFolderName: string;
  rightFolderName: string;
  diffItems: DiffItem[];
  summary: DiffSummary;
  isScanning: boolean;
  scanProgressText?: string;
  onRescan: () => void;
  onOpenFileDiff: (item: DiffItem) => void;
}

type FilterType = 'all' | 'diffs' | 'modified' | 'left-only' | 'right-only' | 'identical';

function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FolderDiffTableView: React.FC<FolderDiffTableViewProps> = ({
  leftFolderName,
  rightFolderName,
  diffItems,
  summary,
  isScanning,
  scanProgressText,
  onRescan,
  onOpenFileDiff,
}) => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Set of expanded folder paths
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    // By default, auto-expand folders that contain diffs or root
    const set = new Set<string>();
    for (const item of diffItems) {
      if (item.status !== 'identical') {
        const parts = item.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          set.add(parts.slice(0, i).join('/'));
        }
      }
    }
    return set;
  });

  // Build the hierarchical tree from all diffItems
  const fullTree = useMemo(() => {
    return buildFolderTree(diffItems);
  }, [diffItems]);

  // When diffItems change, ensure folders with diffs are expanded
  useEffect(() => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      for (const item of diffItems) {
        if (item.status !== 'identical') {
          const parts = item.path.split('/');
          for (let i = 1; i < parts.length; i++) {
            next.add(parts.slice(0, i).join('/'));
          }
        }
      }
      return next;
    });
  }, [diffItems]);

  // Toggle folder expansion
  const toggleFolder = (folderPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  // Flatten based on active expanded paths
  const visibleNodes = useMemo(() => {
    const flat = flattenFolderTree(fullTree, expandedPaths);

    return flat.filter((node) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!node.name.toLowerCase().includes(q) && !node.path.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Category filter
      if (filterType === 'all') return true;
      if (filterType === 'diffs') return node.status !== 'identical';
      if (filterType === 'modified') return node.status === 'modified';
      if (filterType === 'left-only') return node.status === 'left-only';
      if (filterType === 'right-only') return node.status === 'right-only';
      if (filterType === 'identical') return node.status === 'identical';
      return true;
    });
  }, [fullTree, expandedPaths, searchQuery, filterType]);

  // Row double click handler
  const handleRowDoubleClick = (node: FolderTreeNode) => {
    if (node.isFolder) {
      toggleFolder(node.path);
    } else if (node.item) {
      onOpenFileDiff(node.item);
    }
  };

  // Status text matching WinMerge exactly
  const getStatusLabel = (node: FolderTreeNode): string => {
    if (node.isFolder) {
      if (node.status === 'identical') return t.folderTable.identical;
      if (node.status === 'modified') return t.folderTable.folderDifferent;
      if (node.status === 'left-only') return t.folderTable.leftOnlyText(leftFolderName);
      if (node.status === 'right-only') return t.folderTable.rightOnlyText(rightFolderName);
    } else {
      if (node.status === 'identical') return t.folderTable.textIdentical;
      if (node.status === 'modified') return t.folderTable.textDifferent;
      if (node.status === 'left-only') return t.folderTable.leftOnlyTag;
      if (node.status === 'right-only') return t.folderTable.rightOnlyTag;
    }
    return '';
  };

  const diffCount = summary.modified + summary.leftOnly + summary.rightOnly;

  return (
    <div className="folder-diff-table-container">
      {/* Table Toolbar & Path Info */}
      <div className="folder-table-toolbar">
        {/* Left / Right Folder Indicator */}
        <div className="folder-paths-indicator">
          <div className="folder-path-box left" title={leftFolderName}>
            <span className="side-tag left">{t.openDialog.leftSide}</span>
            <FolderOpen size={14} color="#60a5fa" />
            <span className="folder-path-name">{leftFolderName || t.folderPanel.unselected}</span>
          </div>

          <span className="paths-vs-tag">VS</span>

          <div className="folder-path-box right" title={rightFolderName}>
            <span className="side-tag right">{t.openDialog.rightSide}</span>
            <FolderOpen size={14} color="#38bdf8" />
            <span className="folder-path-name">{rightFolderName || t.folderPanel.unselected}</span>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="folder-controls-row">
          <div className="filter-pills-bar">
            <button
              type="button"
              className={`pill-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              {t.folderPanel.filterAll} ({summary.total})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterType === 'diffs' ? 'active' : ''}`}
              onClick={() => setFilterType('diffs')}
            >
              {t.folderPanel.filterDiffs} ({diffCount})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterType === 'modified' ? 'active' : ''}`}
              onClick={() => setFilterType('modified')}
            >
              {t.folderPanel.filterModified} ({summary.modified})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterType === 'left-only' ? 'active' : ''}`}
              onClick={() => setFilterType('left-only')}
            >
              {t.folderPanel.filterLeftOnly} ({summary.leftOnly})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterType === 'right-only' ? 'active' : ''}`}
              onClick={() => setFilterType('right-only')}
            >
              {t.folderPanel.filterRightOnly} ({summary.rightOnly})
            </button>
          </div>

          <div className="folder-search-box">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder={t.folderTable.filterPrompt}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-secondary rescan-btn"
            onClick={onRescan}
            disabled={isScanning}
            title={t.folderTable.rescan}
          >
            <RefreshCw size={13} className={isScanning ? 'spin' : ''} />
            <span>{t.folderTable.rescan}</span>
          </button>
        </div>
      </div>

      {/* Progress banner during active scanning */}
      {isScanning && (
        <div className="table-scan-progress">
          <div className="spinner" />
          <span>{scanProgressText || t.folderPanel.scanning}</span>
        </div>
      )}

      {/* Main Hierarchical Diff Table */}
      <div className="folder-table-scroll-wrapper">
        <table className="folder-diff-table">
          <thead>
            <tr>
              <th className="col-name">{t.folderTable.name}</th>
              <th className="col-folder">{t.folderTable.folder}</th>
              <th className="col-result">{t.folderTable.comparisonResult}</th>
              <th className="col-date">{t.folderTable.leftModified}</th>
              <th className="col-date">{t.folderTable.rightModified}</th>
              <th className="col-ext">{t.folderTable.extension}</th>
              <th className="col-size">{t.folderTable.leftSize}</th>
              <th className="col-size">{t.folderTable.rightSize}</th>
            </tr>
          </thead>
          <tbody>
            {visibleNodes.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  {t.folderPanel.noMatchingFiles}
                </td>
              </tr>
            ) : (
              visibleNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isExpanded = expandedPaths.has(node.path);
                const isDiffDate =
                  Boolean(node.leftModified && node.rightModified && node.leftModified !== node.rightModified);

                return (
                  <tr
                    key={node.id}
                    className={`diff-table-row status-${node.status} ${node.isFolder ? 'folder-row' : 'file-row'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    onDoubleClick={() => handleRowDoubleClick(node)}
                    title={node.isFolder ? t.folderTable.expandFolderHint : t.folderTable.openFileHint}
                  >
                    {/* Name column with tree indent & chevron */}
                    <td className="col-name">
                      <div
                        className="tree-cell"
                        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
                      >
                        {node.isFolder ? (
                          <button
                            type="button"
                            className="chevron-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFolder(node.path);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                        ) : (
                          <span className="chevron-placeholder" />
                        )}

                        {node.isFolder ? (
                          <Folder size={15} color="#eab308" className="node-icon" />
                        ) : (
                          <FileText size={15} color="#60a5fa" className="node-icon" />
                        )}

                        <span className="node-name">{node.name}</span>
                      </div>
                    </td>

                    {/* Parent Folder */}
                    <td className="col-folder" title={node.parentPath}>
                      {node.parentPath}
                    </td>

                    {/* Comparison Result */}
                    <td className={`col-result result-${node.status}`}>
                      <span className="result-text">{getStatusLabel(node)}</span>
                    </td>

                    {/* Left Modified Date */}
                    <td className="col-date">{formatDate(node.leftModified)}</td>

                    {/* Right Modified Date */}
                    <td className="col-date">
                      {isDiffDate && <span className="diff-date-asterisk">* </span>}
                      {formatDate(node.rightModified)}
                    </td>

                    {/* Extension */}
                    <td className="col-ext">{node.extension || ''}</td>

                    {/* Left Size */}
                    <td className="col-size">{formatSize(node.leftSize)}</td>

                    {/* Right Size */}
                    <td className="col-size">{formatSize(node.rightSize)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Status Bar */}
      <div className="folder-table-statusbar">
        <div className="statusbar-left">
          <span className="status-badge full-content">
            <CheckCircle2 size={13} color="#10b981" />
            <span>SHA-256 / フルコンテンツ比較</span>
          </span>
          <span className="status-hint">{t.folderTable.openFileHint}</span>
        </div>

        <div className="statusbar-right">
          <span>{t.folderTable.itemsCount(visibleNodes.length, diffCount)}</span>
        </div>
      </div>
    </div>
  );
};
