import React, { useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  CheckSquare,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import './DiffContextMenu.css';

export interface DiffContextMenuProps {
  x: number;
  y: number;
  side: 'left' | 'right';
  hasSelection: boolean;
  hasLineChange: boolean;
  onCopyToRight: () => void;
  onCopyToLeft: () => void;
  onCopySelectedToRight?: () => void;
  onCopySelectedToLeft?: () => void;
  onNextDiff: () => void;
  onPrevDiff: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onClose: () => void;
}

export const DiffContextMenu: React.FC<DiffContextMenuProps> = ({
  x,
  y,
  side,
  hasSelection,
  hasLineChange,
  onCopyToRight,
  onCopyToLeft,
  onCopySelectedToRight,
  onCopySelectedToLeft,
  onNextDiff,
  onPrevDiff,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onSelectAll,
  onClose,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Defer listener to avoid immediate closing by the same click event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position so it doesn't overflow viewport
  const style: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 340),
    left: Math.min(x, window.innerWidth - 240),
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="diff-context-menu" ref={menuRef} style={style}>
      {/* Copy Diff Chunk to opposite side */}
      <button
        className={`context-item ${hasLineChange || side === 'left' ? '' : 'disabled'}`}
        onClick={() => handleAction(onCopyToRight)}
      >
        <span className="icon"><ArrowRight size={14} color="#38bdf8" /></span>
        <span className="label">{t.contextMenu.copyToRight}</span>
        <span className="shortcut">Alt+Right</span>
      </button>

      <button
        className={`context-item ${hasLineChange || side === 'right' ? '' : 'disabled'}`}
        onClick={() => handleAction(onCopyToLeft)}
      >
        <span className="icon"><ArrowLeft size={14} color="#60a5fa" /></span>
        <span className="label">{t.contextMenu.copyToLeft}</span>
        <span className="shortcut">Alt+Left</span>
      </button>

      {/* Copy Selected Lines (when text is highlighted) */}
      {hasSelection && (
        <>
          <div className="context-divider" />
          {side === 'left' && onCopySelectedToRight && (
            <button
              className="context-item"
              onClick={() => handleAction(onCopySelectedToRight)}
            >
              <span className="icon"><ArrowRight size={14} color="#38bdf8" /></span>
              <span className="label">{t.contextMenu.copySelectedToRight}</span>
            </button>
          )}
          {side === 'right' && onCopySelectedToLeft && (
            <button
              className="context-item"
              onClick={() => handleAction(onCopySelectedToLeft)}
            >
              <span className="icon"><ArrowLeft size={14} color="#60a5fa" /></span>
              <span className="label">{t.contextMenu.copySelectedToLeft}</span>
            </button>
          )}
        </>
      )}

      <div className="context-divider" />

      {/* Navigation */}
      <button className="context-item" onClick={() => handleAction(onNextDiff)}>
        <span className="icon"><ChevronDown size={14} /></span>
        <span className="label">{t.contextMenu.nextDiff}</span>
        <span className="shortcut">F7 / F4</span>
      </button>

      <button className="context-item" onClick={() => handleAction(onPrevDiff)}>
        <span className="icon"><ChevronUp size={14} /></span>
        <span className="label">{t.contextMenu.prevDiff}</span>
        <span className="shortcut">Shift+F7</span>
      </button>

      <div className="context-divider" />

      {/* Edit Operations */}
      <button className="context-item" onClick={() => handleAction(onUndo)}>
        <span className="icon"><Undo2 size={14} /></span>
        <span className="label">{t.contextMenu.undo}</span>
        <span className="shortcut">Ctrl+Z</span>
      </button>

      <button className="context-item" onClick={() => handleAction(onRedo)}>
        <span className="icon"><Redo2 size={14} /></span>
        <span className="label">{t.contextMenu.redo}</span>
        <span className="shortcut">Ctrl+Y</span>
      </button>

      <div className="context-divider" />

      {/* Standard Clipboard & Selection */}
      <button
        className={`context-item ${hasSelection ? '' : 'disabled'}`}
        onClick={() => handleAction(onCut)}
      >
        <span className="icon"><Scissors size={14} /></span>
        <span className="label">{t.contextMenu.cut}</span>
        <span className="shortcut">Ctrl+X</span>
      </button>

      <button
        className={`context-item ${hasSelection ? '' : 'disabled'}`}
        onClick={() => handleAction(onCopy)}
      >
        <span className="icon"><Copy size={14} /></span>
        <span className="label">{t.contextMenu.copy}</span>
        <span className="shortcut">Ctrl+C</span>
      </button>

      <button className="context-item" onClick={() => handleAction(onPaste)}>
        <span className="icon"><ClipboardPaste size={14} /></span>
        <span className="label">{t.contextMenu.paste}</span>
        <span className="shortcut">Ctrl+V</span>
      </button>

      <div className="context-divider" />

      <button className="context-item" onClick={() => handleAction(onSelectAll)}>
        <span className="icon"><CheckSquare size={14} /></span>
        <span className="label">{t.contextMenu.selectAll}</span>
        <span className="shortcut">Ctrl+A</span>
      </button>
    </div>
  );
};
