import { useState, useMemo, useCallback } from 'react';
import {
  readFileObject,
  readTextFromHandle,
  isFileSystemAccessSupported,
} from '../core/fileStorage';
import { openDirectoryWithPicker, parseFileList } from '../core/directoryScanner';
import { scanFolderAsync } from '../core/workerClient';
import {
  matchFolderEntries,
  type DiffItem,
  type DiffSummary,
  type FileEntry,
} from '../utils/diffMatcher';
import { verifyHandlePermission } from '../core/sessionStorage';
import type { SupportedEncoding } from '../utils/encodingDetector';
import type { FileState, AppTab } from '../types/app';

interface UseFolderCompareOptions {
  tabs: AppTab[];
  setTabs: React.Dispatch<React.SetStateAction<AppTab[]>>;
  activeTabId: string | null;
  setActiveTabId: (id: string) => void;
  leftFile: FileState;
  rightFile: FileState;
  setLeftFile: React.Dispatch<React.SetStateAction<FileState>>;
  setRightFile: React.Dispatch<React.SetStateAction<FileState>>;
  handleSelectTab: (tabId: string) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  locale: string;
  t: any;
  leftDirInputRef: React.RefObject<HTMLInputElement | null>;
  rightDirInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useFolderCompare({
  tabs,
  setTabs,
  activeTabId,
  setActiveTabId,
  leftFile,
  rightFile,
  setLeftFile,
  setRightFile,
  handleSelectTab,
  showToast,
  locale,
  t,
  leftDirInputRef,
  rightDirInputRef,
}: UseFolderCompareOptions) {
  const [leftFolderName, setLeftFolderName] = useState<string>('');
  const [rightFolderName, setRightFolderName] = useState<string>('');
  const [leftDirHandle, setLeftDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rightDirHandle, setRightDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [leftFallbackFiles, setLeftFallbackFiles] = useState<FileList | null>(null);
  const [rightFallbackFiles, setRightFallbackFiles] = useState<FileList | null>(null);
  const [leftEntries, setLeftEntries] = useState<FileEntry[]>([]);
  const [rightEntries, setRightEntries] = useState<FileEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState<string>('');

  // Aggregated directory diff results
  const diffResult = useMemo<{ items: DiffItem[]; summary: DiffSummary }>(() => {
    return matchFolderEntries(leftEntries, rightEntries);
  }, [leftEntries, rightEntries]);

  const folderDiffCount = useMemo(() => {
    return diffResult.summary.modified + diffResult.summary.leftOnly + diffResult.summary.rightOnly;
  }, [diffResult.summary]);

  // Select directory
  const handleOpenFolder = useCallback(
    async (side: 'left' | 'right') => {
      if (isFileSystemAccessSupported()) {
        try {
          const dirHandle = await openDirectoryWithPicker();
          if (!dirHandle) return;

          if (side === 'left') {
            setLeftDirHandle(dirHandle);
            setLeftFolderName(dirHandle.name);
            setLeftFallbackFiles(null);
          } else {
            setRightDirHandle(dirHandle);
            setRightFolderName(dirHandle.name);
            setRightFallbackFiles(null);
          }

          showToast(
            locale === 'ja'
              ? `${side === 'left' ? '左' : '右'}フォルダを選択しました: "${dirHandle.name}"`
              : `Selected ${side} folder: "${dirHandle.name}"`,
            'info'
          );
        } catch (err: any) {
          showToast(t.toasts.fileError(err.message), 'error');
        }
      } else {
        if (side === 'left') {
          leftDirInputRef.current?.click();
        } else {
          rightDirInputRef.current?.click();
        }
      }
    },
    [locale, t, showToast, leftDirInputRef, rightDirInputRef]
  );

  const handleDirInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const folderName = files[0].webkitRelativePath?.split('/')[0] || 'Selected Folder';
        if (side === 'left') {
          setLeftFallbackFiles(files);
          setLeftFolderName(folderName);
          setLeftDirHandle(null);
        } else {
          setRightFallbackFiles(files);
          setRightFolderName(folderName);
          setRightDirHandle(null);
        }
        showToast(
          locale === 'ja'
            ? `${side === 'left' ? '左' : '右'}フォルダを選択しました: "${folderName}"`
            : `Selected ${side} folder: "${folderName}"`,
          'info'
        );
      }
    },
    [locale, showToast]
  );

  // Explicit folder compare action
  const handleExecuteFolderCompare = useCallback(async () => {
    const hasLeft = leftDirHandle || (leftFallbackFiles && leftFallbackFiles.length > 0);
    const hasRight = rightDirHandle || (rightFallbackFiles && rightFallbackFiles.length > 0);

    if (!hasLeft || !hasRight) {
      showToast(t.folderPanel.selectBothPrompt, 'warning');
      return;
    }

    setIsScanning(true);
    setScanProgressText(t.folderPanel.scanning);

    try {
      if (leftDirHandle) {
        const hasLeftPerm = await verifyHandlePermission(leftDirHandle, 'read');
        if (!hasLeftPerm) {
          showToast(
            locale === 'ja'
              ? `左フォルダ「${leftDirHandle.name}」へのアクセスが許可されませんでした`
              : `Access permission denied for left folder "${leftDirHandle.name}"`,
            'warning'
          );
          setIsScanning(false);
          setScanProgressText('');
          return;
        }
      }

      if (rightDirHandle) {
        const hasRightPerm = await verifyHandlePermission(rightDirHandle, 'read');
        if (!hasRightPerm) {
          showToast(
            locale === 'ja'
              ? `右フォルダ「${rightDirHandle.name}」へのアクセスが許可されませんでした`
              : `Access permission denied for right folder "${rightDirHandle.name}"`,
            'warning'
          );
          setIsScanning(false);
          setScanProgressText('');
          return;
        }
      }

      let newLeftEntries: FileEntry[] = [];
      let newRightEntries: FileEntry[] = [];

      if (leftDirHandle) {
        setScanProgressText(`${leftDirHandle.name}...`);
        newLeftEntries = await scanFolderAsync(leftDirHandle, 'left', {
          onProgress: (count, path) => setScanProgressText(`[L] ${count} (${path})`),
        });
      } else if (leftFallbackFiles) {
        newLeftEntries = parseFileList(leftFallbackFiles);
      }

      if (rightDirHandle) {
        setScanProgressText(`${rightDirHandle.name}...`);
        newRightEntries = await scanFolderAsync(rightDirHandle, 'right', {
          onProgress: (count, path) => setScanProgressText(`[R] ${count} (${path})`),
        });
      } else if (rightFallbackFiles) {
        newRightEntries = parseFileList(rightFallbackFiles);
      }

      setLeftEntries(newLeftEntries);
      setRightEntries(newRightEntries);

      const matched = matchFolderEntries(newLeftEntries, newRightEntries);
      const diffCount = matched.summary.modified + matched.summary.leftOnly + matched.summary.rightOnly;

      const folderTabId = 'folder-diff';
      const folderTab: AppTab = {
        id: folderTabId,
        type: 'folder',
        title: `${leftFolderName || 'Left'} ↔ ${rightFolderName || 'Right'}`,
      };

      setTabs((prev) => {
        const exists = prev.some((t) => t.id === folderTabId);
        if (exists) {
          return prev.map((t) => (t.id === folderTabId ? folderTab : t));
        }
        return [folderTab, ...prev];
      });
      setActiveTabId(folderTabId);

      showToast(t.toasts.comparedSuccess(matched.summary.total, diffCount), 'success');
    } catch (err: any) {
      showToast(t.toasts.fileError(err.message), 'error');
    } finally {
      setIsScanning(false);
      setScanProgressText('');
    }
  }, [
    leftDirHandle,
    rightDirHandle,
    leftFallbackFiles,
    rightFallbackFiles,
    leftFolderName,
    rightFolderName,
    setTabs,
    setActiveTabId,
    showToast,
    t,
  ]);

  // Reset folder comparison state
  const handleResetFolderCompare = useCallback(() => {
    setLeftFolderName('');
    setRightFolderName('');
    setLeftDirHandle(null);
    setRightDirHandle(null);
    setLeftFallbackFiles(null);
    setRightFallbackFiles(null);
    setLeftEntries([]);
    setRightEntries([]);
    if (leftDirInputRef.current) leftDirInputRef.current.value = '';
    if (rightDirInputRef.current) rightDirInputRef.current.value = '';
    showToast(t.toasts.resetSuccess, 'info');
  }, [leftDirInputRef, rightDirInputRef, showToast, t]);

  // Open file diff in a tab from FolderDiffTableView double-click
  const handleOpenFileDiffFromTable = useCallback(
    async (item: DiffItem) => {
      const tabId = 'file-' + item.path;
      const existingTab = tabs.find((t) => t.id === tabId);

      if (existingTab) {
        handleSelectTab(tabId);
        return;
      }

      try {
        let leftContent = '';
        let leftEncoding: SupportedEncoding = 'utf-8';
        let leftImageUrl: string | undefined;
        let leftHandle: FileSystemFileHandle | undefined;
        let leftModified = 0;
        let leftSize = 0;

        let rightContent = '';
        let rightEncoding: SupportedEncoding = 'utf-8';
        let rightImageUrl: string | undefined;
        let rightHandle: FileSystemFileHandle | undefined;
        let rightModified = 0;
        let rightSize = 0;

        if (item.left) {
          leftHandle = item.left.handle;
          leftModified = item.left.lastModified;
          leftSize = item.left.size;
          if (item.left.handle) {
            await verifyHandlePermission(item.left.handle, 'read');
            const res = await readTextFromHandle(item.left.handle);
            leftContent = res.text;
            leftEncoding = res.encoding;
            leftImageUrl = res.imageUrl;
          } else if (leftFallbackFiles) {
            const fileObj = Array.from(leftFallbackFiles).find(
              (f) => f.webkitRelativePath.endsWith(item.path) || f.name === item.name
            );
            if (fileObj) {
              const res = await readFileObject(fileObj);
              leftContent = res.content;
              leftEncoding = res.encoding;
              leftImageUrl = res.imageUrl;
            }
          }
        }

        if (item.right) {
          rightHandle = item.right.handle;
          rightModified = item.right.lastModified;
          rightSize = item.right.size;
          if (item.right.handle) {
            await verifyHandlePermission(item.right.handle, 'read');
            const res = await readTextFromHandle(item.right.handle);
            rightContent = res.text;
            rightEncoding = res.encoding;
            rightImageUrl = res.imageUrl;
          } else if (rightFallbackFiles) {
            const fileObj = Array.from(rightFallbackFiles).find(
              (f) => f.webkitRelativePath.endsWith(item.path) || f.name === item.name
            );
            if (fileObj) {
              const res = await readFileObject(fileObj);
              rightContent = res.content;
              rightEncoding = res.encoding;
              rightImageUrl = res.imageUrl;
            }
          }
        }

        const newLeftFile: FileState = {
          name: item.left?.name || item.name,
          path: item.path,
          content: leftContent,
          encoding: leftEncoding,
          imageUrl: leftImageUrl,
          handle: leftHandle,
          lastModified: leftModified,
          isDirty: false,
          size: leftSize,
        };

        const newRightFile: FileState = {
          name: item.right?.name || item.name,
          path: item.path,
          content: rightContent,
          encoding: rightEncoding,
          imageUrl: rightImageUrl,
          handle: rightHandle,
          lastModified: rightModified,
          isDirty: false,
          size: rightSize,
        };

        const newTab: AppTab = {
          id: tabId,
          type: 'file',
          title: item.name,
          path: item.path,
          canClose: true,
          leftFile: newLeftFile,
          rightFile: newRightFile,
        };

        setTabs((prev) => {
          const updated = prev.map((tab) => {
            if (tab.id === activeTabId && tab.type === 'file') {
              return {
                ...tab,
                leftFile: { ...leftFile },
                rightFile: { ...rightFile },
                isDirty: leftFile.isDirty || rightFile.isDirty,
              };
            }
            return tab;
          });
          return [...updated, newTab];
        });

        setLeftFile(newLeftFile);
        setRightFile(newRightFile);
        setActiveTabId(tabId);
      } catch (err: any) {
        showToast(t.toasts.fileError(err.message), 'error');
      }
    },
    [
      tabs,
      activeTabId,
      leftFile,
      rightFile,
      leftFallbackFiles,
      rightFallbackFiles,
      handleSelectTab,
      setTabs,
      setLeftFile,
      setRightFile,
      setActiveTabId,
      showToast,
      t,
    ]
  );

  // Compare folders initiated from OpenDialog
  const handleCompareFoldersFromDialog = useCallback(
    async (
      left: { name: string; handle?: FileSystemDirectoryHandle; fallbackFiles?: FileList },
      right: { name: string; handle?: FileSystemDirectoryHandle; fallbackFiles?: FileList },
      _leftReadOnly: boolean,
      _rightReadOnly: boolean
    ) => {
      setLeftFolderName(left.name);
      setRightFolderName(right.name);
      setLeftDirHandle(left.handle || null);
      setRightDirHandle(right.handle || null);
      setLeftFallbackFiles(left.fallbackFiles || null);
      setRightFallbackFiles(right.fallbackFiles || null);

      const folderTabId = 'folder-diff';
      const folderTab: AppTab = {
        id: folderTabId,
        type: 'folder',
        title: `${left.name} ↔ ${right.name}`,
      };

      setTabs((prev) => {
        const exists = prev.some((t) => t.id === folderTabId);
        if (exists) {
          return prev.map((t) => (t.id === folderTabId ? folderTab : t));
        }
        return [folderTab, ...prev];
      });
      setActiveTabId(folderTabId);

      setIsScanning(true);
      setScanProgressText(t.folderPanel.scanning);

      try {
        let newLeftEntries: FileEntry[] = [];
        let newRightEntries: FileEntry[] = [];

        if (left.handle) {
          setScanProgressText(`${left.name}...`);
          newLeftEntries = await scanFolderAsync(left.handle, 'left', {
            onProgress: (count, path) => setScanProgressText(`[L] ${count} (${path})`),
          });
        } else if (left.fallbackFiles) {
          newLeftEntries = parseFileList(left.fallbackFiles);
        }

        if (right.handle) {
          setScanProgressText(`${right.name}...`);
          newRightEntries = await scanFolderAsync(right.handle, 'right', {
            onProgress: (count, path) => setScanProgressText(`[R] ${count} (${path})`),
          });
        } else if (right.fallbackFiles) {
          newRightEntries = parseFileList(right.fallbackFiles);
        }

        setLeftEntries(newLeftEntries);
        setRightEntries(newRightEntries);

        const matched = matchFolderEntries(newLeftEntries, newRightEntries);
        const diffCount = matched.summary.modified + matched.summary.leftOnly + matched.summary.rightOnly;
        showToast(t.toasts.comparedSuccess(matched.summary.total, diffCount), 'success');
      } catch (err: any) {
        showToast(t.toasts.fileError(err.message), 'error');
      } finally {
        setIsScanning(false);
        setScanProgressText('');
      }
    },
    [setTabs, setActiveTabId, showToast, t]
  );

  return {
    leftFolderName,
    setLeftFolderName,
    rightFolderName,
    setRightFolderName,
    leftDirHandle,
    setLeftDirHandle,
    rightDirHandle,
    setRightDirHandle,
    leftFallbackFiles,
    setLeftFallbackFiles,
    rightFallbackFiles,
    setRightFallbackFiles,
    leftEntries,
    setLeftEntries,
    rightEntries,
    setRightEntries,
    isScanning,
    scanProgressText,
    diffResult,
    folderDiffCount,
    handleOpenFolder,
    handleDirInputChange,
    handleExecuteFolderCompare,
    handleResetFolderCompare,
    handleOpenFileDiffFromTable,
    handleCompareFoldersFromDialog,
  };
}
