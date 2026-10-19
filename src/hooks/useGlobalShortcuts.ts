import { useEffect } from 'react';
import type { FileState } from '../types/app';

interface UseGlobalShortcutsOptions {
  leftFile: FileState;
  rightFile: FileState;
  onOpenCompareDialog: () => void;
  onSaveLeft: () => void;
  onSaveRight: () => void;
  onNextDiff: () => void;
  onPrevDiff: () => void;
  onCopyChunkToRight: () => void;
  onCopyChunkToLeft: () => void;
}

export function useGlobalShortcuts({
  leftFile,
  rightFile,
  onOpenCompareDialog,
  onSaveLeft,
  onSaveRight,
  onNextDiff,
  onPrevDiff,
  onCopyChunkToRight,
  onCopyChunkToLeft,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O / Ctrl+N: Open comparison dialog
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O' || e.key === 'n' || e.key === 'N')) {
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
    onOpenCompareDialog,
    onSaveLeft,
    onSaveRight,
    onNextDiff,
    onPrevDiff,
    onCopyChunkToRight,
    onCopyChunkToLeft,
  ]);
}
