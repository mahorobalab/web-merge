import React, { useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Trash2, FileText } from 'lucide-react';
import type { FolderTreeNode } from '../utils/folderTreeBuilder';
import { useTranslation } from '../i18n/I18nContext';
import './FolderContextMenu.css';

export interface FolderContextMenuProps {
  x: number;
  y: number;
  node: FolderTreeNode;
  onCopyToRight: () => void;
  onCopyToLeft: () => void;
  onDeleteLeft: () => void;
  onDeleteRight: () => void;
  onDeleteBoth: () => void;
  onOpenFileDiff?: () => void;
  onClose: () => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  x,
  y,
  node,
  onCopyToRight,
  onCopyToLeft,
  onDeleteLeft,
  onDeleteRight,
  onDeleteBoth,
  onOpenFileDiff,
  onClose,
}) => {
  const { t, locale } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  const hasLeft = Boolean(node.leftSize !== undefined || node.status === 'left-only' || node.status === 'modified' || node.status === 'identical');
  const hasRight = Boolean(node.rightSize !== undefined || node.status === 'right-only' || node.status === 'modified' || node.status === 'identical');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Viewport bounds checking
  const menuStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 260),
    left: Math.min(x, window.innerWidth - 230),
  };

  return (
    <div className="folder-context-menu" ref={menuRef} style={menuStyle}>
      <div className="menu-header">
        <span className="menu-node-name" title={node.path}>{node.name}</span>
      </div>

      <div className="menu-divider" />

      {/* Copy Actions */}
      <button
        type="button"
        className="menu-item"
        disabled={!hasLeft}
        onClick={() => {
          onCopyToRight();
          onClose();
        }}
      >
        <ArrowRight size={14} className="menu-icon text-blue" />
        <span>{t.folderTable.copyToRight}</span>
      </button>

      <button
        type="button"
        className="menu-item"
        disabled={!hasRight}
        onClick={() => {
          onCopyToLeft();
          onClose();
        }}
      >
        <ArrowLeft size={14} className="menu-icon text-blue" />
        <span>{t.folderTable.copyToLeft}</span>
      </button>

      {/* Open Diff Editor */}
      {!node.isFolder && onOpenFileDiff && (
        <>
          <div className="menu-divider" />
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              onOpenFileDiff();
              onClose();
            }}
          >
            <FileText size={14} className="menu-icon" />
            <span>{locale === 'ja' ? 'ファイル比較を開く' : 'Open File Diff'}</span>
          </button>
        </>
      )}

      <div className="menu-divider" />

      {/* Delete Actions */}
      {hasLeft && (
        <button
          type="button"
          className="menu-item danger"
          onClick={() => {
            onDeleteLeft();
            onClose();
          }}
        >
          <Trash2 size={14} className="menu-icon text-red" />
          <span>{t.folderTable.deleteLeft}</span>
        </button>
      )}

      {hasRight && (
        <button
          type="button"
          className="menu-item danger"
          onClick={() => {
            onDeleteRight();
            onClose();
          }}
        >
          <Trash2 size={14} className="menu-icon text-red" />
          <span>{t.folderTable.deleteRight}</span>
        </button>
      )}

      {hasLeft && hasRight && (
        <button
          type="button"
          className="menu-item danger"
          onClick={() => {
            onDeleteBoth();
            onClose();
          }}
        >
          <Trash2 size={14} className="menu-icon text-red" />
          <span>{t.folderTable.deleteBoth}</span>
        </button>
      )}
    </div>
  );
};
