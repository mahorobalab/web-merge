import { useEffect, useRef } from 'react';
import type { AppTab, FileState } from '../types/app';
import type { FileEntry } from '../utils/diffMatcher';
import {
  saveSession,
  loadSession,
  type PersistedSession,
} from '../core/sessionStorage';

interface UseSessionPersistenceOptions {
  tabs: AppTab[];
  setTabs: React.Dispatch<React.SetStateAction<AppTab[]>>;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  leftFile: FileState;
  setLeftFile: React.Dispatch<React.SetStateAction<FileState>>;
  rightFile: FileState;
  setRightFile: React.Dispatch<React.SetStateAction<FileState>>;
  leftFolderName: string;
  setLeftFolderName: (name: string) => void;
  rightFolderName: string;
  setRightFolderName: (name: string) => void;
  leftDirHandle: FileSystemDirectoryHandle | null;
  setLeftDirHandle: (handle: FileSystemDirectoryHandle | null) => void;
  rightDirHandle: FileSystemDirectoryHandle | null;
  setRightDirHandle: (handle: FileSystemDirectoryHandle | null) => void;
  leftEntries: FileEntry[];
  setLeftEntries: (entries: FileEntry[]) => void;
  rightEntries: FileEntry[];
  setRightEntries: (entries: FileEntry[]) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  locale: 'en' | 'ja';
}

/**
 * Automatically persists and restores tab states, active comparison files,
 * folder scan caches, and native FileSystemDirectoryHandles using IndexedDB.
 */
export function useSessionPersistence({
  tabs,
  setTabs,
  activeTabId,
  setActiveTabId,
  leftFile,
  setLeftFile,
  rightFile,
  setRightFile,
  leftFolderName,
  setLeftFolderName,
  rightFolderName,
  setRightFolderName,
  leftDirHandle,
  setLeftDirHandle,
  rightDirHandle,
  setRightDirHandle,
  leftEntries,
  setLeftEntries,
  rightEntries,
  setRightEntries,
  showToast,
  locale,
}: UseSessionPersistenceOptions) {
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initial Load from IndexedDB on mount
  useEffect(() => {
    // Preserve URL demo modes (e.g. ?demo=folder)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === 'folder' || params.get('loadSample') === 'true') {
        isLoadedRef.current = true;
        return;
      }
    }

    let isCancelled = false;

    loadSession()
      .then((saved) => {
        if (isCancelled || !saved) {
          isLoadedRef.current = true;
          return;
        }

        if (saved.tabs && saved.tabs.length > 0) {
          setTabs(saved.tabs);
          if (saved.activeTabId) {
            setActiveTabId(saved.activeTabId);
          }

          if (saved.activeLeftFile) {
            setLeftFile(saved.activeLeftFile);
          }
          if (saved.activeRightFile) {
            setRightFile(saved.activeRightFile);
          }

          if (saved.folderCompare) {
            if (saved.folderCompare.leftFolderName) {
              setLeftFolderName(saved.folderCompare.leftFolderName);
            }
            if (saved.folderCompare.rightFolderName) {
              setRightFolderName(saved.folderCompare.rightFolderName);
            }
            if (saved.folderCompare.leftEntries) {
              setLeftEntries(saved.folderCompare.leftEntries);
            }
            if (saved.folderCompare.rightEntries) {
              setRightEntries(saved.folderCompare.rightEntries);
            }
            if (saved.folderCompare.leftDirHandle) {
              setLeftDirHandle(saved.folderCompare.leftDirHandle);
            }
            if (saved.folderCompare.rightDirHandle) {
              setRightDirHandle(saved.folderCompare.rightDirHandle);
            }
          }

          showToast(
            locale === 'ja'
              ? '前回のタブ・作業状態を自動復元しました'
              : 'Automatically restored previous tab session',
            'info'
          );
        }
      })
      .catch((err) => {
        console.warn('Failed to restore session:', err);
      })
      .finally(() => {
        isLoadedRef.current = true;
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Debounced auto-save on state changes
  useEffect(() => {
    if (!isLoadedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const sessionData: PersistedSession = {
        tabs,
        activeTabId,
        savedAt: Date.now(),
        activeLeftFile: leftFile,
        activeRightFile: rightFile,
        folderCompare: {
          leftFolderName,
          rightFolderName,
          leftEntries,
          rightEntries,
          leftDirHandle,
          rightDirHandle,
        },
      };

      saveSession(sessionData).catch((err) => {
        console.warn('Failed to auto-save session:', err);
      });
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    tabs,
    activeTabId,
    leftFile,
    rightFile,
    leftFolderName,
    rightFolderName,
    leftEntries,
    rightEntries,
    leftDirHandle,
    rightDirHandle,
  ]);

  // 3. Save immediately on beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isLoadedRef.current) return;
      const sessionData: PersistedSession = {
        tabs,
        activeTabId,
        savedAt: Date.now(),
        activeLeftFile: leftFile,
        activeRightFile: rightFile,
        folderCompare: {
          leftFolderName,
          rightFolderName,
          leftEntries,
          rightEntries,
          leftDirHandle,
          rightDirHandle,
        },
      };
      saveSession(sessionData).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    tabs,
    activeTabId,
    leftFile,
    rightFile,
    leftFolderName,
    rightFolderName,
    leftEntries,
    rightEntries,
    leftDirHandle,
    rightDirHandle,
  ]);
}
