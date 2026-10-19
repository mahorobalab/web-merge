import { useCallback } from 'react';
import type { FileEntry } from '../utils/diffMatcher';
import type { FolderTreeNode } from '../utils/folderTreeBuilder';
import {
  updateEntriesAfterCopy,
  updateEntriesAfterDelete,
  copyFileBetweenHandles,
  copyFolderBetweenHandles,
  deleteEntryFromHandle,
} from '../utils/folderSync';

interface UseFolderSyncOptions {
  leftDirHandle: FileSystemDirectoryHandle | null;
  rightDirHandle: FileSystemDirectoryHandle | null;
  leftEntries: FileEntry[];
  rightEntries: FileEntry[];
  setLeftEntries: React.Dispatch<React.SetStateAction<FileEntry[]>>;
  setRightEntries: React.Dispatch<React.SetStateAction<FileEntry[]>>;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  locale: string;
}

export function useFolderSync({
  leftDirHandle,
  rightDirHandle,
  leftEntries,
  rightEntries,
  setLeftEntries,
  setRightEntries,
  showToast,
  locale,
}: UseFolderSyncOptions) {
  const handleCopyFolderItem = useCallback(
    async (node: FolderTreeNode, direction: 'leftToRight' | 'rightToLeft') => {
      try {
        const sourceDirHandle = direction === 'leftToRight' ? leftDirHandle : rightDirHandle;
        const targetDirHandle = direction === 'leftToRight' ? rightDirHandle : leftDirHandle;
        const sourceEntries = direction === 'leftToRight' ? leftEntries : rightEntries;

        let targetHandleMap: Map<string, FileSystemFileHandle> | undefined;

        if (sourceDirHandle && targetDirHandle) {
          if (node.isFolder) {
            targetHandleMap = await copyFolderBetweenHandles(sourceDirHandle, targetDirHandle, node.path, sourceEntries);
          } else {
            const handle = await copyFileBetweenHandles(sourceDirHandle, targetDirHandle, node.path);
            targetHandleMap = new Map([[node.path, handle]]);
          }
        }

        // Update in-memory entries reactively
        if (direction === 'leftToRight') {
          setRightEntries((prev) => updateEntriesAfterCopy(leftEntries, prev, node.path, node.isFolder, targetHandleMap));
        } else {
          setLeftEntries((prev) => updateEntriesAfterCopy(rightEntries, prev, node.path, node.isFolder, targetHandleMap));
        }

        showToast(
          locale === 'ja'
            ? `「${node.name}」を${direction === 'leftToRight' ? '右側' : '左側'}へコピーしました`
            : `Copied "${node.name}" to ${direction === 'leftToRight' ? 'Right' : 'Left'}`,
          'success'
        );
      } catch (err: any) {
        showToast(
          locale === 'ja' ? `コピーに失敗しました: ${err.message}` : `Copy failed: ${err.message}`,
          'error'
        );
      }
    },
    [leftDirHandle, rightDirHandle, leftEntries, rightEntries, setLeftEntries, setRightEntries, showToast, locale]
  );

  const handleDeleteFolderItem = useCallback(
    async (node: FolderTreeNode, side: 'left' | 'right' | 'both') => {
      const sideLabel = side === 'left' ? '左側' : side === 'right' ? '右側' : '両側';
      try {
        if (side === 'left' || side === 'both') {
          if (leftDirHandle) {
            await deleteEntryFromHandle(leftDirHandle, node.path, node.isFolder);
          }
          setLeftEntries((prev) => updateEntriesAfterDelete(prev, node.path, node.isFolder));
        }

        if (side === 'right' || side === 'both') {
          if (rightDirHandle) {
            await deleteEntryFromHandle(rightDirHandle, node.path, node.isFolder);
          }
          setRightEntries((prev) => updateEntriesAfterDelete(prev, node.path, node.isFolder));
        }

        showToast(
          locale === 'ja'
            ? `「${node.name}」(${sideLabel}) を削除しました`
            : `Deleted "${node.name}" (${side})`,
          'info'
        );
      } catch (err: any) {
        showToast(
          locale === 'ja' ? `削除に失敗しました: ${err.message}` : `Delete failed: ${err.message}`,
          'error'
        );
      }
    },
    [leftDirHandle, rightDirHandle, setLeftEntries, setRightEntries, showToast, locale]
  );

  return {
    handleCopyFolderItem,
    handleDeleteFolderItem,
  };
}
