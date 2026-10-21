import { useEffect } from 'react';
import type { FileState } from '../types/app';

interface UseGlobalShortcutsOptions {
  leftFile: FileState;
  rightFile: FileState;
  onNewEmptyCompare?: () => void;
  onOpenCompareDialog: () => void;
  onSaveLeft: () => void;
  onSaveRight: () => void;
  onNextDiff: () => void;
  onPrevDiff: () => void;
  onCopyChunkToRight: () => void;
  onCopyChunkToLeft: () => void;
  onCloseActiveTab?: () => void;
}

export function useGlobalShortcuts({
  leftFile,
  rightFile,
  onNewEmptyCompare,
  onOpenCompareDialog,
  onSaveLeft,
  onSaveRight,
  onNextDiff,
  onPrevDiff,
  onCopyChunkToRight,
  onCopyChunkToLeft,
  onCloseActiveTab,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+W / Ctrl+F4: Close active tab
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W')) ||
        (e.ctrlKey && e.key === 'F4')
      ) {
        e.preventDefault();
        onCloseActiveTab?.();
        return;
      }

      // Ctrl+N: New empty file comparison (WinMerge standard)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onNewEmptyCompare?.();
        return;
      }

      // Ctrl+O: Open comparison dialog
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        onOpenCompareDialog();
        return;
      }

      // Ctrl+S / Cmd+S: Save current modified file
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (rightFile.isDirty) {
          onSaveRight();
        } else if (leftFile.isDirty) {
          onSaveLeft();
        } else {
          onSaveRight();
        }
        return;
      }

      // Alt+ArrowRight: Copy chunk to right
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        onCopyChunkToRight();
        return;
      }

      // Alt+ArrowLeft: Copy chunk to left
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        onCopyChunkToLeft();
        return;
      }

      // F7 or F4 or Ctrl+Down: Next Diff
      if (
        (e.key === 'F7' && !e.shiftKey) ||
        (e.key === 'F4' && !e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown')
      ) {
        e.preventDefault();
        onNextDiff();
        return;
      }

      // Shift+F7 or Shift+F4 or Ctrl+Up: Previous Diff
      if (
        (e.key === 'F7' && e.shiftKey) ||
        (e.key === 'F4' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp')
      ) {
        e.preventDefault();
        onPrevDiff();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    leftFile,
    rightFile,
    onNewEmptyCompare,
    onOpenCompareDialog,
    onSaveLeft,
    onSaveRight,
    onNextDiff,
    onPrevDiff,
    onCopyChunkToRight,
    onCopyChunkToLeft,
    onCloseActiveTab,
  ]);
}
