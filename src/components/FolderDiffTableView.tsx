import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import type { DiffItem, DiffSummary } from '../utils/diffMatcher';
import {
  buildFolderTree,
  flattenFolderTree,
  type FolderTreeNode,
} from '../utils/folderTreeBuilder';
import { useTranslation } from '../i18n/I18nContext';
import { FolderContextMenu } from './FolderContextMenu';
import { ConfirmModal } from './ConfirmModal';
import { useTableZoom } from '../hooks/useTableZoom';
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
  onCopyItem?: (node: FolderTreeNode, direction: 'leftToRight' | 'rightToLeft') => void;
  onDeleteItem?: (node: FolderTreeNode, side: 'left' | 'right' | 'both') => void;
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
  onCopyItem,
  onDeleteItem,
}) => {
  const { t, locale } = useTranslation();
  const { containerRef, fontSize, resetFontSize, zoomPercentage } = useTableZoom();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    node: FolderTreeNode;
    side: 'left' | 'right' | 'both';
  } | null>(null);
  const [copyTarget, setCopyTarget] = useState<{
    node: FolderTreeNode;
    direction: 'leftToRight' | 'rightToLeft';
    fileCount: number;
    isFolder: boolean;
    isOverwrite: boolean;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: FolderTreeNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  const requestCopyItem = useCallback(
    (node: FolderTreeNode, direction: 'leftToRight' | 'rightToLeft') => {
      const targetSideHasItem =
        direction === 'leftToRight'
          ? node.rightSize !== undefined || node.status === 'modified' || node.status === 'identical'
          : node.leftSize !== undefined || node.status === 'modified' || node.status === 'identical';

      if (node.isFolder) {
        // Count files under this folder on source side
        const fileCount = diffItems.filter(
          (item) =>
            (item.path === node.path || item.path.startsWith(`${node.path}/`)) &&
            (direction === 'leftToRight' ? Boolean(item.left) : Boolean(item.right))
        ).length;

        setCopyTarget({
          node,
          direction,
          fileCount: fileCount || 1,
          isFolder: true,
          isOverwrite: targetSideHasItem,
        });
        return;
      }

      // If single file and already exists in target (destructive overwrite)
      if (targetSideHasItem && (node.status === 'modified' || node.status === 'identical')) {
        setCopyTarget({
          node,
          direction,
          fileCount: 1,
          isFolder: false,
          isOverwrite: true,
        });
        return;
      }

      // Target doesn't exist (clean copy of left-only or right-only): execute immediately
      onCopyItem?.(node, direction);
    },
    [diffItems, onCopyItem]
  );


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

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return visibleNodes.find((n) => n.id === selectedNodeId) || null;
  }, [visibleNodes, selectedNodeId]);

  const selectedHasLeft = Boolean(
    selectedNode &&
      (selectedNode.leftSize !== undefined ||
        selectedNode.status === 'left-only' ||
        selectedNode.status === 'modified' ||
        selectedNode.status === 'identical')
  );
  const selectedHasRight = Boolean(
    selectedNode &&
      (selectedNode.rightSize !== undefined ||
        selectedNode.status === 'right-only' ||
        selectedNode.status === 'modified' ||
        selectedNode.status === 'identical')
  );

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
    <div
      ref={containerRef}
      className="folder-diff-table-container"
      style={{ '--table-font-size': `${fontSize}px` } as React.CSSProperties}
    >
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
              className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              <span className="filter-label">{t.folderPanel.filterAll}</span>
              <span className="filter-count">{summary.total}</span>
            </button>
            <button
              type="button"
              className={`filter-pill diffs ${filterType === 'diffs' ? 'active' : ''} ${diffCount > 0 ? 'has-diffs' : ''}`}
              onClick={() => setFilterType('diffs')}
            >
              <span className="filter-label">{t.folderPanel.filterDiffs}</span>
              <span className="filter-count diff">{diffCount}</span>
            </button>
            <button
              type="button"
              className={`filter-pill modified ${filterType === 'modified' ? 'active' : ''}`}
              onClick={() => setFilterType('modified')}
            >
              <span className="filter-label">{t.folderPanel.filterModified}</span>
              <span className="filter-count mod">{summary.modified}</span>
            </button>
            <button
              type="button"
              className={`filter-pill left-only ${filterType === 'left-only' ? 'active' : ''}`}
              onClick={() => setFilterType('left-only')}
            >
              <span className="filter-label">{t.folderPanel.filterLeftOnly}</span>
              <span className="filter-count left">{summary.leftOnly}</span>
            </button>
            <button
              type="button"
              className={`filter-pill right-only ${filterType === 'right-only' ? 'active' : ''}`}
              onClick={() => setFilterType('right-only')}
            >
              <span className="filter-label">{t.folderPanel.filterRightOnly}</span>
              <span className="filter-count right">{summary.rightOnly}</span>
            </button>
          </div>

          {selectedNode && (
            <div className="selected-sync-actions">
              <button
                type="button"
                className="sync-action-btn"
                disabled={!selectedHasLeft || !onCopyItem}
                onClick={() => requestCopyItem(selectedNode, 'leftToRight')}
                title={t.folderTable.copyToRight}
              >
                <ArrowRight size={13} color="#60a5fa" />
                <span>{t.folderTable.copyToRight}</span>
              </button>

              <button
                type="button"
                className="sync-action-btn"
                disabled={!selectedHasRight || !onCopyItem}
                onClick={() => requestCopyItem(selectedNode, 'rightToLeft')}
                title={t.folderTable.copyToLeft}
              >
                <ArrowLeft size={13} color="#60a5fa" />
                <span>{t.folderTable.copyToLeft}</span>
              </button>

              <button
                type="button"
                className="sync-action-btn danger"
                disabled={!onDeleteItem}
                onClick={() => {
                  if (selectedHasLeft && selectedHasRight) {
                    setDeleteTarget({ node: selectedNode, side: 'both' });
                  } else if (selectedHasLeft) {
                    setDeleteTarget({ node: selectedNode, side: 'left' });
                  } else if (selectedHasRight) {
                    setDeleteTarget({ node: selectedNode, side: 'right' });
                  }
                }}
                title={t.folderTable.deleteItem}
              >
                <Trash2 size={13} color="#ef4444" />
                <span>{t.folderTable.deleteItem}</span>
              </button>
            </div>
          )}

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
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedNodeId(node.id);
                      setContextMenu({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY,
                        node,
                      });
                    }}
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
          <button
            type="button"
            className="table-zoom-indicator"
            onClick={resetFontSize}
            title={locale === 'ja' ? '文字サイズリセット (Ctrl+マウスホイールで拡大縮小, Ctrl+0でリセット)' : 'Reset font size (Ctrl+MouseWheel to zoom, Ctrl+0 to reset)'}
          >
            <span>{zoomPercentage}</span>
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.node && (
        <FolderContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onCopyToRight={() => requestCopyItem(contextMenu.node!, 'leftToRight')}
          onCopyToLeft={() => requestCopyItem(contextMenu.node!, 'rightToLeft')}
          onDeleteLeft={() => setDeleteTarget({ node: contextMenu.node!, side: 'left' })}
          onDeleteRight={() => setDeleteTarget({ node: contextMenu.node!, side: 'right' })}
          onDeleteBoth={() => setDeleteTarget({ node: contextMenu.node!, side: 'both' })}
          onOpenFileDiff={contextMenu.node.item ? () => onOpenFileDiff(contextMenu.node!.item!) : undefined}
          onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={Boolean(deleteTarget)}
          title={t.confirmModal.confirmTitle}
          message={t.confirmModal.confirmDelete(
            deleteTarget.node.name,
            deleteTarget.side === 'left'
              ? (locale === 'ja' ? '左側' : 'Left')
              : deleteTarget.side === 'right'
              ? (locale === 'ja' ? '右側' : 'Right')
              : (locale === 'ja' ? '両側' : 'Both')
          )}
          warningNote={t.confirmModal.deleteWarning}
          confirmLabel={t.confirmModal.delete}
          cancelLabel={t.confirmModal.cancel}
          isDanger
          onConfirm={() => {
            if (deleteTarget && onDeleteItem) {
              onDeleteItem(deleteTarget.node, deleteTarget.side);
            }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Copy / Overwrite Confirmation Modal */}
      {copyTarget && (
        <ConfirmModal
          isOpen={Boolean(copyTarget)}
          title={
            copyTarget.isFolder
              ? t.confirmModal.confirmCopyFolderTitle
              : t.confirmModal.confirmOverwriteFileTitle
          }
          message={
            copyTarget.isFolder
              ? t.confirmModal.confirmCopyFolder(
                  copyTarget.node.name,
                  copyTarget.fileCount,
                  copyTarget.direction === 'leftToRight'
                    ? (locale === 'ja' ? '右側' : 'Right')
                    : (locale === 'ja' ? '左側' : 'Left')
                )
              : t.confirmModal.confirmOverwriteFile(
                  copyTarget.node.name,
                  copyTarget.direction === 'leftToRight'
                    ? (locale === 'ja' ? '右側' : 'Right')
                    : (locale === 'ja' ? '左側' : 'Left')
                )
          }
          warningNote={
            copyTarget.isFolder
              ? t.confirmModal.copyFolderWarning
              : t.confirmModal.overwriteFileWarning
          }
          confirmLabel={
            copyTarget.isFolder
              ? t.confirmModal.copy
              : t.confirmModal.overwriteCopy
          }
          cancelLabel={t.confirmModal.cancel}
          isDanger={copyTarget.isOverwrite}
          onConfirm={() => {
            if (copyTarget && onCopyItem) {
              onCopyItem(copyTarget.node, copyTarget.direction);
            }
            setCopyTarget(null);
          }}
          onCancel={() => setCopyTarget(null)}
        />
      )}
    </div>
  );
};
