import { useState, useMemo, useCallback } from 'react';
import type { AppTab, FileState } from '../types/app';

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
      setTabs((prev) => {
        const filtered = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          // Switch to folder-diff tab if available, else first remaining tab
          const folderTab = filtered.find((t) => t.id === 'folder-diff');
          const nextActive = folderTab ? folderTab.id : (filtered[0]?.id || '');
          if (nextActive) {
            const target = filtered.find((t) => t.id === nextActive);
            if (target && target.type === 'file') {
              if (target.leftFile) setLeftFile(target.leftFile);
              if (target.rightFile) setRightFile(target.rightFile);
            }
            setActiveTabId(nextActive);
          }
        }
        return filtered;
      });
    },
    [activeTabId, setLeftFile, setRightFile]
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

  return {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    handleSelectTab,
    handleCloseTab,
    markActiveTabDirty,
  };
}
