import { useState, useMemo, useCallback, useRef } from 'react';
import type { AppTab, FileState } from '../types/app';
import { createEmptyCompareTab } from '../utils/emptyTabFactory';

interface UseTabsOptions {
  initialTabs: AppTab[];
  initialActiveTabId: string;
  leftFile: FileState;
  rightFile: FileState;
  setLeftFile: React.Dispatch<React.SetStateAction<FileState>>;
  setRightFile: React.Dispatch<React.SetStateAction<FileState>>;
}

export function useTabs({
  initialTabs,
  initialActiveTabId,
  leftFile,
  rightFile,
  setLeftFile,
  setRightFile,
}: UseTabsOptions) {
  const [tabs, setTabs] = useState<AppTab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>(initialActiveTabId);
  const untitledCounterRef = useRef(1);

  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // Tab switching handler that preserves modified file states across file tabs
  const handleSelectTab = useCallback(
    (nextTabId: string) => {
      if (nextTabId === activeTabId) return;

      // Save current file states to active tab if it's a file tab
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id === activeTabId && tab.type === 'file') {
            return {
              ...tab,
              leftFile: { ...leftFile },
              rightFile: { ...rightFile },
              isDirty: leftFile.isDirty || rightFile.isDirty,
            };
          }
          return tab;
        })
      );

      // If target tab is a file tab with saved files, restore them
      const targetTab = tabs.find((t) => t.id === nextTabId);
      if (targetTab && targetTab.type === 'file') {
        if (targetTab.leftFile) setLeftFile(targetTab.leftFile);
        if (targetTab.rightFile) setRightFile(targetTab.rightFile);
      }

      setActiveTabId(nextTabId);
    },
    [activeTabId, leftFile, rightFile, tabs, setLeftFile, setRightFile]
  );

  // Tab close handler
  const handleCloseTab = useCallback(
    (tabId: string) => {
      const tabToClose = tabs.find((t) => t.id === tabId);
      if (tabToClose?.isDirty) {
        const confirmMsg = `"${tabToClose.title}" には未保存の変更があります。保存せずに閉じますか？\n(There are unsaved changes. Are you sure you want to close this tab?)`;
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }

      setTabs((prev) => {
        const closedIndex = prev.findIndex((t) => t.id === tabId);
        const filtered = prev.filter((t) => t.id !== tabId);

        if (activeTabId === tabId) {
          if (filtered.length === 0) {
            setActiveTabId('');
            return filtered;
          }

          // Switch to adjacent tab (same index or previous)
          const nextIndex = Math.max(0, Math.min(closedIndex, filtered.length - 1));
          const nextTab = filtered[nextIndex];
          if (nextTab) {
            if (nextTab.type === 'file') {
              if (nextTab.leftFile) setLeftFile(nextTab.leftFile);
              if (nextTab.rightFile) setRightFile(nextTab.rightFile);
            }
            setActiveTabId(nextTab.id);
          }
        }
        return filtered;
      });
    },
    [tabs, activeTabId, setLeftFile, setRightFile]
  );

  // Mark active tab dirty when editor content changes
  const markActiveTabDirty = useCallback(
    (isDirty: boolean) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTabId ? { ...tab, isDirty } : tab))
      );
    },
    [activeTabId]
  );

  // Opens a new empty side-by-side diff editor tab (WinMerge standard)
  const openNewEmptyTab = useCallback(
    (locale: 'en' | 'ja' = 'ja') => {
      const num = untitledCounterRef.current++;
      const newTab = createEmptyCompareTab({ counter: num, locale });

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

      if (newTab.leftFile) setLeftFile(newTab.leftFile);
      if (newTab.rightFile) setRightFile(newTab.rightFile);
      setActiveTabId(newTab.id);
      return newTab.id;
    },
    [activeTabId, leftFile, rightFile, setLeftFile, setRightFile]
  );

  return {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    handleSelectTab,
    handleCloseTab,
    markActiveTabDirty,
    openNewEmptyTab,
  };
}
