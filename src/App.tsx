import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { OpenedFile } from './core/fileStorage';
import {
  openFileWithPicker,
  readFileObject,
  saveFileWithHandle,
  downloadFileContent,
  isFileSystemAccessSupported,
} from './core/fileStorage';
import type { FileEntry } from './utils/diffMatcher';
import { generateUnifiedDiff, generateHtmlReport } from './utils/diffExporter';
import { detectLanguage } from './utils/languageDetector';
import { areTextsEqual, type NormalizeOptions } from './utils/textNormalizer';
import { useTranslation } from './i18n/I18nContext';

// Types
import type { FileState, Toast, AppTab } from './types/app';

// Hooks
import { useTabs } from './hooks/useTabs';
import { useDiffEditorMerge } from './hooks/useDiffEditorMerge';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useFolderSync } from './hooks/useFolderSync';
import { useFolderCompare } from './hooks/useFolderCompare';

// Components
import { AppHeader } from './components/AppHeader';
import { AppToolbar } from './components/AppToolbar';
import { TabBar } from './components/TabBar';
import { FolderDiffTableView } from './components/FolderDiffTableView';
import { FileDiffWorkspace } from './components/FileDiffWorkspace';
import { AppStatusBar } from './components/AppStatusBar';
import { DiffContextMenu } from './components/DiffContextMenu';
import { OpenDialog } from './components/OpenDialog';
import { EmptyWorkspace } from './components/EmptyWorkspace';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import './App.css';

const DEFAULT_LEFT_DEMO = `// WebMerge: Left file (Original)
// Drag & drop a local file here, click "Open Left", or select a folder to compare.

export function calculateTotal(price: number, taxRate: number): number {
  const tax = price * taxRate;
  return price + tax;
}

export const config = {
  appName: "WebMerge",
  version: "0.1.0",
  mode: "development",
  enableLogging: true,
};
`;

const DEFAULT_RIGHT_DEMO = `// WebMerge: Right file (Modified)
// Directly edit the text and click "Save Right" to write back to your local file.

export function calculateTotal(price: number, taxRate: number, discount: number = 0): number {
  const discountedPrice = price - discount;
  const tax = discountedPrice * taxRate;
  return discountedPrice + tax;
}

export const config = {
  appName: "WebMerge",
  version: "0.1.0",
  mode: "production",
  enableLogging: false,
};
`;

export const App: React.FC = () => {
  const { t, locale, setLocale } = useTranslation();

  // Active files displayed in Diff Editor
  const [leftFile, setLeftFile] = useState<FileState>({
    name: 'left_sample.ts',
    content: DEFAULT_LEFT_DEMO,
    encoding: 'utf-8',
    isDirty: false,
    size: DEFAULT_LEFT_DEMO.length,
  });

  const [rightFile, setRightFile] = useState<FileState>({
    name: 'right_sample.ts',
    content: DEFAULT_RIGHT_DEMO,
    encoding: 'utf-8',
    isDirty: false,
    size: DEFAULT_RIGHT_DEMO.length,
  });

  // Dialog & Notification state
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // MDI Tabs management hook
  const {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    handleSelectTab,
    handleCloseTab,
    markActiveTabDirty,
    openNewEmptyTab,
  } = useTabs({
    initialTabs: [
      {
        id: 'demo-file',
        type: 'file',
        title: 'left_sample.ts ↔ right_sample.ts',
      },
    ],
    initialActiveTabId: 'demo-file',
    leftFile,
    rightFile,
    setLeftFile,
    setRightFile,
  });

  // Fallback hidden inputs
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const leftDirInputRef = useRef<HTMLInputElement>(null);
  const rightDirInputRef = useRef<HTMLInputElement>(null);

  // Folder comparison hook (state, scanning, and table actions)
  const {
    leftFolderName,
    setLeftFolderName,
    rightFolderName,
    setRightFolderName,
    leftDirHandle,
    rightDirHandle,
    leftFallbackFiles,
    rightFallbackFiles,
    leftEntries,
    rightEntries,
    setLeftEntries,
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
  } = useFolderCompare({
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
  });

  // Folder synchronization hook (copy / delete directly between left & right folders)
  const { handleCopyFolderItem, handleDeleteFolderItem } = useFolderSync({
    leftDirHandle,
    rightDirHandle,
    leftEntries,
    rightEntries,
    setLeftEntries,
    setRightEntries,
    showToast,
    locale,
  });

  // Diff Options
  const [ignoreTrimWhitespace, setIgnoreTrimWhitespace] = useState(true);
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const [normalizeOptions, setNormalizeOptions] = useState<NormalizeOptions>({
    ignoreLineEndings: true,
    ignoreLeadingTrailingWhitespace: false,
    ignoreBlankLines: false,
  });

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('webmerge_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('webmerge_theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Editor merge and navigation operations hook
  const {
    diffEditorRef,
    contextMenu,
    setContextMenu,
    handleNextDiff,
    handlePrevDiff,
    handleMerge,
    handleCopyChunkToRight,
    handleCopyChunkToLeft,
    handleCopySelectedToRight,
    handleCopySelectedToLeft,
    handleUndo,
    handleRedo,
    handleCut,
    handleCopy,
    handlePaste,
    handleSelectAll,
    handleEditorBeforeMount,
    handleEditorDidMount,
  } = useDiffEditorMerge({
    setLeftFile: (val) => {
      setLeftFile(val);
      markActiveTabDirty(true);
    },
    setRightFile: (val) => {
      setRightFile(val);
      markActiveTabDirty(true);
    },
    showToast,
  });

  // WinMerge standard: Open empty side-by-side file comparison tab
  const handleNewEmptyCompare = useCallback(() => {
    openNewEmptyTab(locale);
    showToast(
      locale === 'ja'
        ? '新規ファイル比較を開きました'
        : 'Opened new empty file comparison',
      'info'
    );
  }, [openNewEmptyTab, locale, showToast]);

  // Global Keyboard Shortcuts hook
  useGlobalShortcuts({
    leftFile,
    rightFile,
    onNewEmptyCompare: handleNewEmptyCompare,
    onOpenCompareDialog: () => setIsOpenDialogOpen(true),
    onSaveLeft: () => handleSave('left'),
    onSaveRight: () => handleSave('right'),
    onNextDiff: handleNextDiff,
    onPrevDiff: handlePrevDiff,
    onCopyChunkToRight: handleCopyChunkToRight,
    onCopyChunkToLeft: handleCopyChunkToLeft,
    onCloseActiveTab: () => activeTabId && handleCloseTab(activeTabId),
  });

  // Automatic syntax detection
  const language = detectLanguage(rightFile.name || leftFile.name);

  // Check if texts are equal according to active normalization options
  const isMatch = areTextsEqual(leftFile.content, rightFile.content, {
    ignoreLineEndings: normalizeOptions.ignoreLineEndings,
    ignoreLeadingTrailingWhitespace: ignoreTrimWhitespace,
    ignoreBlankLines: normalizeOptions.ignoreBlankLines,
  });

  // Open single file
  const handleOpenFile = async (side: 'left' | 'right') => {
    if (isFileSystemAccessSupported()) {
      try {
        const opened = await openFileWithPicker();
        if (opened) {
          updateFileState(side, opened);
          showToast(t.toasts.openedFile(side === 'left' ? 'Left' : 'Right', opened.name));
        }
      } catch (err: any) {
        showToast(t.toasts.fileError(err.message), 'error');
      }
    } else {
      if (side === 'left') {
        leftFileInputRef.current?.click();
      } else {
        rightFileInputRef.current?.click();
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      const opened = await readFileObject(file);
      updateFileState(side, opened);
      showToast(t.toasts.openedFile(side === 'left' ? 'Left' : 'Right', opened.name));
    }
    e.target.value = '';
  };

  const updateFileState = (side: 'left' | 'right', opened: OpenedFile) => {
    const nextState: FileState = {
      name: opened.name,
      content: opened.content,
      encoding: opened.encoding,
      imageUrl: opened.imageUrl,
      handle: opened.handle,
      lastModified: opened.lastModified,
      isDirty: false,
      size: opened.size,
    };
    if (side === 'left') {
      setLeftFile(nextState);
    } else {
      setRightFile(nextState);
    }
  };



  // Open dialog compare handlers
  const handleCompareFilesFromDialog = (
    leftOpened: OpenedFile,
    rightOpened: OpenedFile,
    leftReadOnly: boolean,
    rightReadOnly: boolean
  ) => {
    const tabId = 'file-' + Date.now();
    const newLeftFile: FileState = {
      name: leftOpened.name,
      content: leftOpened.content,
      encoding: leftOpened.encoding,
      imageUrl: leftOpened.imageUrl,
      handle: leftOpened.handle,
      lastModified: leftOpened.lastModified,
      isDirty: false,
      size: leftOpened.size,
      readOnly: leftReadOnly,
    };

    const newRightFile: FileState = {
      name: rightOpened.name,
      content: rightOpened.content,
      encoding: rightOpened.encoding,
      imageUrl: rightOpened.imageUrl,
      handle: rightOpened.handle,
      lastModified: rightOpened.lastModified,
      isDirty: false,
      size: rightOpened.size,
      readOnly: rightReadOnly,
    };

    const newTab: AppTab = {
      id: tabId,
      type: 'file',
      title: `${leftOpened.name} ↔ ${rightOpened.name}`,
      canClose: true,
      leftFile: newLeftFile,
      rightFile: newRightFile,
    };

    setTabs((prev) => [...prev, newTab]);
    setLeftFile(newLeftFile);
    setRightFile(newRightFile);
    setActiveTabId(tabId);

    showToast(
      locale === 'ja'
        ? `ファイル比較を開始しました: "${leftOpened.name}" vs "${rightOpened.name}"`
        : `Started file comparison: "${leftOpened.name}" vs "${rightOpened.name}"`,
      'success'
    );
  };



  // Save handling
  const handleSave = async (side: 'left' | 'right') => {
    const file = side === 'left' ? leftFile : rightFile;
    if (file.readOnly) {
      showToast(locale === 'ja' ? '読み取り専用のため保存できません' : 'File is read-only', 'warning');
      return;
    }

    const editorValue =
      side === 'left'
        ? diffEditorRef.current?.getOriginalEditor().getValue() ?? file.content
        : diffEditorRef.current?.getModifiedEditor().getValue() ?? file.content;

    try {
      if (file.handle) {
        const { success, newLastModified } = await saveFileWithHandle(
          file.handle,
          editorValue,
          file.lastModified
        );

        if (success) {
          updateFileContentAfterSave(side, editorValue, newLastModified);
          markActiveTabDirty(false);
          showToast(t.toasts.savedSuccess(side === 'left' ? 'Left' : 'Right'));
        }
      } else {
        const downloadName = file.name.includes('.') ? file.name : `${file.name}.txt`;
        downloadFileContent(downloadName, editorValue);
        updateFileContentAfterSave(side, editorValue, Date.now());
        markActiveTabDirty(false);
        showToast(t.toasts.downloaded(downloadName));
      }
    } catch (err: any) {
      showToast(t.toasts.saveError(err.message), 'error');
    }
  };

  const updateFileContentAfterSave = (
    side: 'left' | 'right',
    newContent: string,
    newLastModified?: number
  ) => {
    if (side === 'left') {
      setLeftFile((prev) => ({
        ...prev,
        content: newContent,
        isDirty: false,
        lastModified: newLastModified ?? prev.lastModified,
      }));
    } else {
      setRightFile((prev) => ({
        ...prev,
        content: newContent,
        isDirty: false,
        lastModified: newLastModified ?? prev.lastModified,
      }));
    }
  };

  // Export handlers
  const handleExportHtmlReport = () => {
    const leftContent = diffEditorRef.current?.getOriginalEditor().getValue() ?? leftFile.content;
    const rightContent = diffEditorRef.current?.getModifiedEditor().getValue() ?? rightFile.content;

    const html = generateHtmlReport({
      leftTitle: leftFile.path || leftFile.name,
      rightTitle: rightFile.path || rightFile.name,
      leftContent,
      rightContent,
      language,
    });

    const reportName = `webmerge_report_${Date.now()}.html`;
    downloadFileContent(reportName, html);
    showToast(t.toasts.exportedReport(reportName));
  };

  const handleExportPatch = () => {
    const leftContent = diffEditorRef.current?.getOriginalEditor().getValue() ?? leftFile.content;
    const rightContent = diffEditorRef.current?.getModifiedEditor().getValue() ?? rightFile.content;

    const patch = generateUnifiedDiff(
      leftFile.path || leftFile.name,
      rightFile.path || rightFile.name,
      leftContent,
      rightContent
    );

    const patchName = `webmerge_diff_${Date.now()}.patch`;
    downloadFileContent(patchName, patch);
    showToast(t.toasts.exportedPatch(patchName));
  };

  // Drag and drop file loading
  const handleDropFile = async (file: File, handle?: FileSystemFileHandle, side: 'left' | 'right' = 'left') => {
    const opened = await readFileObject(file, handle);
    updateFileState(side, opened);
    showToast(t.toasts.openedFile(side === 'left' ? 'Left' : 'Right', opened.name));
  };

  // Dev-only helper for browser verification of folder comparison
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).__loadSampleFolderCompare = () => {
        const demoLeft: FileEntry[] = [
          { path: 'manifest.json', name: 'manifest.json', size: 1024, lastModified: 1729330000000 },
          { path: 'package.json', name: 'package.json', size: 2048, lastModified: 1729330000000 },
          { path: 'dist/index.html', name: 'index.html', size: 4096, lastModified: 1729330000000 },
          { path: 'dist/manifest.json', name: 'manifest.json', size: 850, lastModified: 1729330000000 },
          { path: 'dist/assets/app.js', name: 'app.js', size: 12048, lastModified: 1729330000000 },
          { path: 'src/App.tsx', name: 'App.tsx', size: 5000, lastModified: 1729330000000 },
        ];
        const demoRight: FileEntry[] = [
          { path: 'manifest.json', name: 'manifest.json', size: 1080, lastModified: 1729331000000 },
          { path: 'package.json', name: 'package.json', size: 2048, lastModified: 1729330000000 },
          { path: 'dist/index.html', name: 'index.html', size: 4096, lastModified: 1729330000000 },
          { path: 'dist/manifest.json', name: 'manifest.json', size: 920, lastModified: 1729332000000 },
          { path: 'dist/assets/app.js', name: 'app.js', size: 13000, lastModified: 1729331500000 },
          { path: 'dist/新規 テキスト ドキュメント.txt', name: '新規 テキスト ドキュメント.txt', size: 120, lastModified: 1729332000000 },
          { path: 'src/App.tsx', name: 'App.tsx', size: 5000, lastModified: 1729330000000 },
        ];
        setLeftFolderName('freelandre1');
        setRightFolderName('freelandre2');
        setLeftEntries(demoLeft);
        setRightEntries(demoRight);

        const folderTabId = 'folder-diff';
        const folderTab: AppTab = {
          id: folderTabId,
          type: 'folder',
          title: 'freelandre1 ↔ freelandre2',
        };
        setTabs((prev) => {
          const exists = prev.some((t) => t.id === folderTabId);
          if (exists) return prev.map((t) => (t.id === folderTabId ? folderTab : t));
          return [folderTab, ...prev];
        });
        setActiveTabId(folderTabId);
      };

      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === 'folder' || params.get('loadSample') === 'true') {
        (window as any).__loadSampleFolderCompare();
      }
    }
  }, [setTabs, setActiveTabId]);

  return (
    <div className="app-container" data-theme={theme}>
      {/* Hidden file input fallbacks */}
      <input
        type="file"
        ref={leftFileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileInputChange(e, 'left')}
      />
      <input
        type="file"
        ref={rightFileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileInputChange(e, 'right')}
      />
      <input
        type="file"
        ref={leftDirInputRef}
        style={{ display: 'none' }}
        // @ts-expect-error webkitdirectory is standard for folder upload
        webkitdirectory="true"
        onChange={(e) => handleDirInputChange(e, 'left')}
      />
      <input
        type="file"
        ref={rightDirInputRef}
        style={{ display: 'none' }}
        // @ts-expect-error webkitdirectory is standard for folder upload
        webkitdirectory="true"
        onChange={(e) => handleDirInputChange(e, 'right')}
      />

      {/* Header */}
      <AppHeader
        hasActiveTab={Boolean(activeTab)}
        isFolderTab={activeTab?.type === 'folder'}
        folderDiffCount={folderDiffCount}
        isFileMatch={isMatch}
        locale={locale}
        onToggleLocale={() => setLocale(locale === 'en' ? 'ja' : 'en')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Toolbar - Placed directly below Title/Header */}
      <AppToolbar
        hasActiveTab={Boolean(activeTab)}
        isFolderTab={activeTab?.type === 'folder'}
        onNewCompare={handleNewEmptyCompare}
        onOpenDialog={() => setIsOpenDialogOpen(true)}
        leftFolderName={leftFolderName}
        rightFolderName={rightFolderName}
        isScanning={isScanning}
        canCompareFolder={Boolean(
          (leftDirHandle || (leftFallbackFiles && leftFallbackFiles.length > 0)) &&
          (rightDirHandle || (rightFallbackFiles && rightFallbackFiles.length > 0))
        )}
        onRescanFolder={handleExecuteFolderCompare}
        onOpenLeftFolder={() => handleOpenFolder('left')}
        onOpenRightFolder={() => handleOpenFolder('right')}
        onResetFolder={handleResetFolderCompare}
        leftFile={leftFile}
        rightFile={rightFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSave}
        onMerge={handleMerge}
        onPrevDiff={handlePrevDiff}
        onNextDiff={handleNextDiff}
        ignoreTrimWhitespace={ignoreTrimWhitespace}
        onToggleIgnoreTrimWhitespace={() => setIgnoreTrimWhitespace(!ignoreTrimWhitespace)}
        normalizeOptions={normalizeOptions}
        onToggleIgnoreLineEndings={() =>
          setNormalizeOptions((prev) => ({ ...prev, ignoreLineEndings: !prev.ignoreLineEndings }))
        }
        renderSideBySide={renderSideBySide}
        onToggleRenderSideBySide={() => setRenderSideBySide(!renderSideBySide)}
        onExportHtmlReport={handleExportHtmlReport}
        onExportPatch={handleExportPatch}
      />

      {/* MDI Tab Bar - Placed below Toolbar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewCompare={handleNewEmptyCompare}
      />

      {/* Workspace Area: Folder Diff Table vs File Diff Editor vs Empty Workspace */}
      {tabs.length === 0 ? (
        <EmptyWorkspace
          onOpenCompare={() => setIsOpenDialogOpen(true)}
          onNewCompare={handleNewEmptyCompare}
          onLoadDemo={() => (window as any).__loadSampleFolderCompare?.()}
        />
      ) : activeTab?.type === 'folder' ? (
        <FolderDiffTableView
          leftFolderName={leftFolderName}
          rightFolderName={rightFolderName}
          diffItems={diffResult.items}
          summary={diffResult.summary}
          isScanning={isScanning}
          scanProgressText={scanProgressText}
          onRescan={handleExecuteFolderCompare}
          onOpenFileDiff={handleOpenFileDiffFromTable}
          onCopyItem={handleCopyFolderItem}
          onDeleteItem={handleDeleteFolderItem}
        />
      ) : (
        <FileDiffWorkspace
          leftFile={leftFile}
          rightFile={rightFile}
          language={language}
          renderSideBySide={renderSideBySide}
          ignoreTrimWhitespace={ignoreTrimWhitespace}
          onEditorBeforeMount={handleEditorBeforeMount}
          onEditorDidMount={handleEditorDidMount}
          onDropItem={handleDropFile}
          theme={theme}
        />
      )}

      {/* File Diff Status Bar */}
      {activeTab?.type === 'file' && (
        <AppStatusBar
          leftFile={leftFile}
          rightFile={rightFile}
          language={language}
        />
      )}

      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <DiffContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          side={contextMenu.side}
          hasSelection={contextMenu.hasSelection}
          hasLineChange={true}
          onCopyToRight={handleCopyChunkToRight}
          onCopyToLeft={handleCopyChunkToLeft}
          onCopySelectedToRight={handleCopySelectedToRight}
          onCopySelectedToLeft={handleCopySelectedToLeft}
          onNextDiff={handleNextDiff}
          onPrevDiff={handlePrevDiff}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onSelectAll={handleSelectAll}
          onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Floating Open & Compare Dialog */}
      <OpenDialog
        isOpen={isOpenDialogOpen}
        onClose={() => setIsOpenDialogOpen(false)}
        onCompareFiles={handleCompareFilesFromDialog}
        onCompareFolders={handleCompareFoldersFromDialog}
        currentLeftFile={leftFile}
        currentRightFile={rightFile}
      />

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'warning' && <AlertCircle size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
