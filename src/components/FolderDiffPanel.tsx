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
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // フィルタリング処理（メモ化）
  const filteredItems = useMemo(() => {
    return diffItems.filter((item) => {
      // 検索クエリ
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!item.path.toLowerCase().includes(query)) {
          return false;
        }
      }

      // ステータスフィルタ
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
        return '変更';
      case 'left-only':
        return '左のみ';
      case 'right-only':
        return '右のみ';
      case 'identical':
        return '一致';
    }
  };

  if (collapsed) {
    return (
      <div className="folder-diff-panel collapsed">
        <button
          className="btn-icon"
          onClick={() => setCollapsed(false)}
          title="フォルダ差分ツリーを展開"
          style={{ margin: '8px auto' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="folder-diff-panel">
      {/* パネルヘッダー */}
      <div className="panel-header">
        <div className="panel-title">
          <Folder size={16} color="#60a5fa" />
          <span>フォルダ比較</span>
        </div>
        <div className="panel-actions">
          <button
            className="btn-icon"
            onClick={() => setCollapsed(true)}
            title="パネルを折りたたむ"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* フォルダピッカーエリア */}
      <div className="folder-pickers">
        <div className="picker-row">
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>左:</span>
          <span className={`folder-name-tag ${leftFolderName ? 'active' : ''}`} title={leftFolderName || '未選択'}>
            {leftFolderName || '未選択'}
          </span>
          <button className="btn-secondary" style={{ padding: '3px 8px' }} onClick={onOpenLeftFolder}>
            <FolderOpen size={13} /> 選択
          </button>
        </div>

        <div className="picker-row">
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>右:</span>
          <span className={`folder-name-tag ${rightFolderName ? 'active' : ''}`} title={rightFolderName || '未選択'}>
            {rightFolderName || '未選択'}
          </span>
          <button className="btn-secondary" style={{ padding: '3px 8px' }} onClick={onOpenRightFolder}>
            <FolderOpen size={13} /> 選択
          </button>
        </div>
      </div>

      {/* スキャン中プログレス */}
      {isScanning && (
        <div className="scan-progress">
          <div className="spinner" />
          <span>{scanProgressText || 'フォルダをスキャン中...'}</span>
        </div>
      )}

      {/* 検索 & フィルタ */}
      <div className="filter-section">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="search-input"
            placeholder="ファイルを検索..."
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
            全項目 ({summary.total})
          </button>
          <button
            className={`pill-btn ${filterType === 'diffs' ? 'active' : ''}`}
            onClick={() => setFilterType('diffs')}
          >
            差分のみ ({summary.modified + summary.leftOnly + summary.rightOnly})
          </button>
          <button
            className={`pill-btn ${filterType === 'modified' ? 'active' : ''}`}
            onClick={() => setFilterType('modified')}
          >
            変更 ({summary.modified})
          </button>
          <button
            className={`pill-btn ${filterType === 'left-only' ? 'active' : ''}`}
            onClick={() => setFilterType('left-only')}
          >
            左のみ ({summary.leftOnly})
          </button>
          <button
            className={`pill-btn ${filterType === 'right-only' ? 'active' : ''}`}
            onClick={() => setFilterType('right-only')}
          >
            右のみ ({summary.rightOnly})
          </button>
        </div>
      </div>

      {/* 差分ファイル一覧 */}
      <div className="diff-list-container">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <Filter size={24} />
            <span>
              {diffItems.length === 0
                ? '左右のフォルダを選択するとファイル差分が一覧表示されます'
                : '条件に一致するファイルがありません'}
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
