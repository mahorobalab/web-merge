import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type { DiffEditorProps } from '@monaco-editor/react';
import {
  FileText,
  Save,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Columns,
  Rows,
  ShieldCheck,
  FolderTree,
  FilePlus2,
  Languages,
  ChevronDown,
  ChevronUp,
  FileCode,
  Download,
} from 'lucide-react';

import {
  openFileWithPicker,
  readFileObject,
  readTextFromHandle,
  saveFileWithHandle,
  downloadFileContent,
  isFileSystemAccessSupported,
} from './core/fileStorage';
import type { OpenedFile } from './core/fileStorage';
import { formatEncodingLabel, type SupportedEncoding } from './utils/encodingDetector';
import { generateUnifiedDiff, generateHtmlReport } from './utils/diffExporter';
import { openDirectoryWithPicker, parseFileList } from './core/directoryScanner';
import { scanFolderAsync } from './core/workerClient';
import { matchFolderEntries, type DiffItem, type DiffSummary, type FileEntry } from './utils/diffMatcher';
import { FolderDiffPanel } from './components/FolderDiffPanel';
import { ImageDiffViewer } from './components/ImageDiffViewer';
import { DiffContextMenu } from './components/DiffContextMenu';
import { OpenDialog } from './components/OpenDialog';
import {
  copyChunkLeftToRight,
  copyChunkRightToLeft,
  copySelectedLines,
  findLineChangeAtLine,
  type LineChangeInfo,
} from './utils/diffChunkMerger';
import { isImageFileName } from './utils/imageDetector';
import { detectLanguage } from './utils/languageDetector';
import { areTextsEqual, type NormalizeOptions } from './utils/textNormalizer';
import { useTranslation } from './i18n/I18nContext';
import './App.css';

interface FileState {
  name: string;
  path?: string;
  content: string;
  encoding?: SupportedEncoding;
  imageUrl?: string;
  handle?: FileSystemFileHandle;
  lastModified?: number;
  isDirty: boolean;
  size: number;
  readOnly?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  side: 'left' | 'right';
  lineNumber: number;
  hasSelection: boolean;
  selection?: {
    startLineNumber: number;
    endLineNumber: number;
  };
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

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

  // Active files displayed in the Diff Editor
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

  // Floating Open Dialog State
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);

  // Folder comparison states
  const [showFolderPanel, setShowFolderPanel] = useState(false);
  const [leftFolderName, setLeftFolderName] = useState<string>('');
  const [rightFolderName, setRightFolderName] = useState<string>('');
  const [leftDirHandle, setLeftDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rightDirHandle, setRightDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [leftFallbackFiles, setLeftFallbackFiles] = useState<FileList | null>(null);
  const [rightFallbackFiles, setRightFallbackFiles] = useState<FileList | null>(null);
  const [leftEntries, setLeftEntries] = useState<FileEntry[]>([]);
  const [rightEntries, setRightEntries] = useState<FileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState<string>('');

  // Aggregated directory diff results
  const diffResult = React.useMemo<{ items: DiffItem[]; summary: DiffSummary }>(() => {
    return matchFolderEntries(leftEntries, rightEntries);
  }, [leftEntries, rightEntries]);

  // Diff Options
  const [ignoreTrimWhitespace, setIgnoreTrimWhitespace] = useState(true);
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const [normalizeOptions, setNormalizeOptions] = useState<NormalizeOptions>({
    ignoreLineEndings: true,
    ignoreLeadingTrailingWhitespace: false,
    ignoreBlankLines: false,
  });

  // UI States
  const [dragSide, setDragSide] = useState<'left' | 'right' | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    side: 'left',
    lineNumber: 1,
    hasSelection: false,
  });

  // Hidden inputs for fallback file and folder pickers
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const leftDirInputRef = useRef<HTMLInputElement>(null);
  const rightDirInputRef = useRef<HTMLInputElement>(null);

  // Diff Editor instance ref
  const diffEditorRef = useRef<any>(null);

  // Jump to next difference using getLineChanges()
  const handleNextDiff = useCallback(() => {
    if (!diffEditorRef.current) return;
    const editor = diffEditorRef.current;
    const lineChanges = editor.getLineChanges();
    if (!lineChanges || lineChanges.length === 0) return;

    const modifiedEditor = editor.getModifiedEditor();
    const currentLine = modifiedEditor.getPosition()?.lineNumber || 1;

    // Find the next change block
    const nextChange =
      lineChanges.find((c: any) => c.modifiedStartLineNumber > currentLine) || lineChanges[0];
    if (nextChange) {
      const targetLine = nextChange.modifiedStartLineNumber || 1;
      modifiedEditor.setPosition({ lineNumber: targetLine, column: 1 });
      modifiedEditor.revealLineInCenter(targetLine);
      modifiedEditor.focus();
    }
  }, []);

  // Jump to previous difference using getLineChanges()
  const handlePrevDiff = useCallback(() => {
    if (!diffEditorRef.current) return;
    const editor = diffEditorRef.current;
    const lineChanges = editor.getLineChanges();
    if (!lineChanges || lineChanges.length === 0) return;

    const modifiedEditor = editor.getModifiedEditor();
    const currentLine = modifiedEditor.getPosition()?.lineNumber || 1;

    // Find the previous change block
    const prevChange =
      [...lineChanges].reverse().find((c: any) => c.modifiedStartLineNumber < currentLine) ||
      lineChanges[lineChanges.length - 1];
    if (prevChange) {
      const targetLine = prevChange.modifiedStartLineNumber || 1;
      modifiedEditor.setPosition({ lineNumber: targetLine, column: 1 });
      modifiedEditor.revealLineInCenter(targetLine);
      modifiedEditor.focus();
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Global keyboard shortcut to open WinMerge compare dialog (Ctrl+O / Ctrl+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O' || e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setIsOpenDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Select directory (either via File System Access API or file input fallback)
  const handleOpenFolder = async (side: 'left' | 'right') => {
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
      // Fallback input for browsers without showDirectoryPicker
      if (side === 'left') {
        leftDirInputRef.current?.click();
      } else {
        rightDirInputRef.current?.click();
      }
    }
  };

  const handleDirInputChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
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
  };

  // Explicit folder compare action
  const handleExecuteFolderCompare = async () => {
    const hasLeft = leftDirHandle || (leftFallbackFiles && leftFallbackFiles.length > 0);
    const hasRight = rightDirHandle || (rightFallbackFiles && rightFallbackFiles.length > 0);

    if (!hasLeft || !hasRight) {
      showToast(t.folderPanel.selectBothPrompt, 'warning');
      return;
    }

    setIsScanning(true);
    setScanProgressText(t.folderPanel.scanning);

    try {
      let newLeftEntries: FileEntry[] = [];
      let newRightEntries: FileEntry[] = [];

      // Scan left folder
      if (leftDirHandle) {
        setScanProgressText(`${leftDirHandle.name}...`);
        newLeftEntries = await scanFolderAsync(leftDirHandle, 'left', {
          onProgress: (count, path) => {
            setScanProgressText(`[L] ${count} (${path})`);
          },
        });
      } else if (leftFallbackFiles) {
        newLeftEntries = parseFileList(leftFallbackFiles);
      }

      // Scan right folder
      if (rightDirHandle) {
        setScanProgressText(`${rightDirHandle.name}...`);
        newRightEntries = await scanFolderAsync(rightDirHandle, 'right', {
          onProgress: (count, path) => {
            setScanProgressText(`[R] ${count} (${path})`);
          },
        });
      } else if (rightFallbackFiles) {
        newRightEntries = parseFileList(rightFallbackFiles);
      }

      setLeftEntries(newLeftEntries);
      setRightEntries(newRightEntries);

      // Compute diff summary to show in toast
      const matched = matchFolderEntries(newLeftEntries, newRightEntries);
      const diffCount = matched.summary.modified + matched.summary.leftOnly + matched.summary.rightOnly;
      showToast(t.toasts.comparedSuccess(matched.summary.total, diffCount), 'success');
    } catch (err: any) {
      showToast(t.toasts.fileError(err.message), 'error');
    } finally {
      setIsScanning(false);
      setScanProgressText('');
    }
  };

  // Reset folder comparison state
  const handleResetFolderCompare = () => {
    setLeftFolderName('');
    setRightFolderName('');
    setLeftDirHandle(null);
    setRightDirHandle(null);
    setLeftFallbackFiles(null);
    setRightFallbackFiles(null);
    setLeftEntries([]);
    setRightEntries([]);
    setSelectedPath(undefined);
    if (leftDirInputRef.current) leftDirInputRef.current.value = '';
    if (rightDirInputRef.current) rightDirInputRef.current.value = '';
    showToast(t.toasts.resetSuccess, 'info');
  };

  // Open dialog handlers
  const handleCompareFilesFromDialog = (
    leftOpened: OpenedFile,
    rightOpened: OpenedFile,
    leftReadOnly: boolean,
    rightReadOnly: boolean
  ) => {
    setLeftFile({
      name: leftOpened.name,
      content: leftOpened.content,
      encoding: leftOpened.encoding,
      imageUrl: leftOpened.imageUrl,
      handle: leftOpened.handle,
      lastModified: leftOpened.lastModified,
      isDirty: false,
      size: leftOpened.size,
      readOnly: leftReadOnly,
    });

    setRightFile({
      name: rightOpened.name,
      content: rightOpened.content,
      encoding: rightOpened.encoding,
      imageUrl: rightOpened.imageUrl,
      handle: rightOpened.handle,
      lastModified: rightOpened.lastModified,
      isDirty: false,
      size: rightOpened.size,
      readOnly: rightReadOnly,
    });

    setShowFolderPanel(false);
    showToast(
      locale === 'ja'
        ? `ファイル比較を開始しました: "${leftOpened.name}" vs "${rightOpened.name}"`
        : `Started file comparison: "${leftOpened.name}" vs "${rightOpened.name}"`,
      'success'
    );
  };

  const handleCompareFoldersFromDialog = async (
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
    setShowFolderPanel(true);

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
  };

  // On-demand load of file contents when a diff item is clicked
  const handleSelectDiffItem = async (item: DiffItem) => {
    setSelectedPath(item.path);

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

      // Load left file content if present
      if (item.left) {
        leftHandle = item.left.handle;
        leftModified = item.left.lastModified;
        leftSize = item.left.size;
        if (item.left.handle) {
          const res = await readTextFromHandle(item.left.handle);
          leftContent = res.text;
          leftEncoding = res.encoding;
          leftImageUrl = res.imageUrl;
        }
      }

      // Load right file content if present
      if (item.right) {
        rightHandle = item.right.handle;
        rightModified = item.right.lastModified;
        rightSize = item.right.size;
        if (item.right.handle) {
          const res = await readTextFromHandle(item.right.handle);
          rightContent = res.text;
          rightEncoding = res.encoding;
          rightImageUrl = res.imageUrl;
        }
      }

      setLeftFile({
        name: item.left?.name || item.name,
        path: item.path,
        content: leftContent,
        encoding: leftEncoding,
        imageUrl: leftImageUrl,
        handle: leftHandle,
        lastModified: leftModified,
        isDirty: false,
        size: leftSize,
      });

      setRightFile({
        name: item.right?.name || item.name,
        path: item.path,
        content: rightContent,
        encoding: rightEncoding,
        imageUrl: rightImageUrl,
        handle: rightHandle,
        lastModified: rightModified,
        isDirty: false,
        size: rightSize,
      });
    } catch (err: any) {
      showToast(t.toasts.fileError(err.message), 'error');
    }
  };

  // Save handling
  const handleSave = async (side: 'left' | 'right') => {
    const target = side === 'left' ? leftFile : rightFile;

    const currentContent =
      diffEditorRef.current && (side === 'left' ? diffEditorRef.current.getOriginalEditor().getValue() : diffEditorRef.current.getModifiedEditor().getValue());
    const contentToSave = currentContent ?? target.content;

    if (target.handle) {
      try {
        const result = await saveFileWithHandle(target.handle, contentToSave, target.lastModified);
        if (result.conflict) {
          const proceed = window.confirm(t.toasts.conflictConfirm);
          if (proceed) {
            const forceResult = await saveFileWithHandle(target.handle, contentToSave);
            updateSavedState(side, contentToSave, forceResult.newLastModified);
            showToast(t.toasts.forceSaved(side === 'left' ? 'Left' : 'Right'), 'warning');
          }
        } else {
          updateSavedState(side, contentToSave, result.newLastModified);
          showToast(t.toasts.savedSuccess(side === 'left' ? 'Left' : 'Right'), 'success');
        }
      } catch (err: any) {
        showToast(t.toasts.saveError(err.message), 'error');
      }
    } else {
      downloadFileContent(target.name, contentToSave);
      updateSavedState(side, contentToSave);
      showToast(t.toasts.downloaded(target.name), 'success');
    }
  };

  const updateSavedState = (side: 'left' | 'right', newContent: string, newLastModified?: number) => {
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

  // Merge actions
  const handleMerge = (direction: 'leftToRight' | 'rightToLeft') => {
    if (!diffEditorRef.current) return;
    const originalEditor = diffEditorRef.current.getOriginalEditor();
    const modifiedEditor = diffEditorRef.current.getModifiedEditor();

    if (direction === 'leftToRight') {
      const originalValue = originalEditor.getValue();
      modifiedEditor.setValue(originalValue);
      setRightFile((prev) => ({ ...prev, content: originalValue, isDirty: true }));
      showToast(t.toasts.mergedLeftToRight);
    } else {
      const modifiedValue = modifiedEditor.getValue();
      originalEditor.setValue(modifiedValue);
      setLeftFile((prev) => ({ ...prev, content: modifiedValue, isDirty: true }));
      showToast(t.toasts.mergedRightToLeft);
    }
  };

  // Export handlers
  const handleExportHtmlReport = () => {
    const leftContent =
      diffEditorRef.current?.getOriginalEditor().getValue() ?? leftFile.content;
    const rightContent =
      diffEditorRef.current?.getModifiedEditor().getValue() ?? rightFile.content;

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
    const leftContent =
      diffEditorRef.current?.getOriginalEditor().getValue() ?? leftFile.content;
    const rightContent =
      diffEditorRef.current?.getModifiedEditor().getValue() ?? rightFile.content;

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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setDragSide(side);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragSide(null);
  };

  const handleDrop = async (e: React.DragEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setDragSide(null);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const item = items[0];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          let handle: FileSystemFileHandle | undefined;
          if ('getAsFileSystemHandle' in item) {
            handle = (await (item as any).getAsFileSystemHandle()) as FileSystemFileHandle;
          }
          const opened = await readFileObject(file, handle);
          updateFileState(side, opened);
          showToast(t.toasts.openedFile(side === 'left' ? 'Left' : 'Right', opened.name));
        }
      }
    }
  };

  // Monaco Editor configuration before mount
  const handleEditorBeforeMount: DiffEditorProps['beforeMount'] = (monaco) => {
    // Disable semantic diagnostics (duplicate identifier, unresolved import)
    // because diff viewer compares separate file snapshots rather than a single unified project.
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTextFiles: true,
      isolatedModules: true,
    });
  };

  // Monaco Editor mount callback
  const handleEditorDidMount: DiffEditorProps['onMount'] = (editor) => {
    diffEditorRef.current = editor;

    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    originalEditor.onDidChangeModelContent(() => {
      setLeftFile((prev) => ({ ...prev, isDirty: true }));
    });

    modifiedEditor.onDidChangeModelContent(() => {
      setRightFile((prev) => ({ ...prev, isDirty: true }));
    });

    originalEditor.onContextMenu((e: any) => {
      e.event?.preventDefault();
      handleOpenContextMenu('left', e);
    });

    modifiedEditor.onContextMenu((e: any) => {
      e.event?.preventDefault();
      handleOpenContextMenu('right', e);
    });

    const origDom = originalEditor.getDomNode();
    if (origDom) {
      origDom.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleOpenContextMenuDirect('left', e.clientX, e.clientY);
      });
    }

    const modDom = modifiedEditor.getDomNode();
    if (modDom) {
      modDom.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleOpenContextMenuDirect('right', e.clientX, e.clientY);
      });
    }
  };

  const handleOpenContextMenuDirect = (side: 'left' | 'right', clientX: number, clientY: number) => {
    const editor =
      side === 'left'
        ? diffEditorRef.current?.getOriginalEditor()
        : diffEditorRef.current?.getModifiedEditor();
    const pos = editor?.getTargetFromCoordinate?.(clientX, clientY)?.position;
    const lineNumber = pos?.lineNumber || editor?.getPosition()?.lineNumber || 1;
    const selection = editor?.getSelection();
    const hasSelection = !!(selection && !selection.isEmpty());

    setContextMenu({
      visible: true,
      x: clientX,
      y: clientY,
      side,
      lineNumber,
      hasSelection,
      selection: hasSelection
        ? { startLineNumber: selection.startLineNumber, endLineNumber: selection.endLineNumber }
        : undefined,
    });
  };

  const handleOpenContextMenu = (side: 'left' | 'right', e: any) => {
    const position = e.target?.position;
    const lineNumber = position?.lineNumber || 1;
    const editor =
      side === 'left'
        ? diffEditorRef.current?.getOriginalEditor()
        : diffEditorRef.current?.getModifiedEditor();
    const selection = editor?.getSelection();
    const hasSelection = !!(selection && !selection.isEmpty());

    setContextMenu({
      visible: true,
      x: e.event?.posx ?? (e.event?.clientX ?? 100),
      y: e.event?.posy ?? (e.event?.clientY ?? 100),
      side,
      lineNumber,
      hasSelection,
      selection: hasSelection
        ? { startLineNumber: selection.startLineNumber, endLineNumber: selection.endLineNumber }
        : undefined,
    });
  };

  // Copy diff chunk under cursor/line from left to right
  const handleCopyChunkToRight = useCallback(() => {
    if (!diffEditorRef.current) return;
    const editor = diffEditorRef.current;
    const lineChanges: LineChangeInfo[] = editor.getLineChanges() || [];
    const origEditor = editor.getOriginalEditor();
    const modEditor = editor.getModifiedEditor();

    const currentLine =
      contextMenu.visible && contextMenu.side === 'left'
        ? contextMenu.lineNumber
        : origEditor.getPosition()?.lineNumber || 1;

    let change = findLineChangeAtLine(lineChanges, 'left', currentLine);
    if (!change && lineChanges.length > 0) {
      change =
        lineChanges.find((c: any) => c.originalStartLineNumber >= currentLine) || lineChanges[0];
    }

    if (!change) return;

    const leftContent = origEditor.getValue();
    const rightContent = modEditor.getValue();
    const updatedRight = copyChunkLeftToRight(leftContent, rightContent, change);

    modEditor.setValue(updatedRight);
    setRightFile((prev) => ({ ...prev, content: updatedRight, isDirty: true }));
    showToast(t.toasts.copiedChunkToRight);
  }, [contextMenu, t, showToast]);

  // Copy diff chunk under cursor/line from right to left
  const handleCopyChunkToLeft = useCallback(() => {
    if (!diffEditorRef.current) return;
    const editor = diffEditorRef.current;
    const lineChanges: LineChangeInfo[] = editor.getLineChanges() || [];
    const origEditor = editor.getOriginalEditor();
    const modEditor = editor.getModifiedEditor();

    const currentLine =
      contextMenu.visible && contextMenu.side === 'right'
        ? contextMenu.lineNumber
        : modEditor.getPosition()?.lineNumber || 1;

    let change = findLineChangeAtLine(lineChanges, 'right', currentLine);
    if (!change && lineChanges.length > 0) {
      change =
        lineChanges.find((c: any) => c.modifiedStartLineNumber >= currentLine) || lineChanges[0];
    }

    if (!change) return;

    const leftContent = origEditor.getValue();
    const rightContent = modEditor.getValue();
    const updatedLeft = copyChunkRightToLeft(leftContent, rightContent, change);

    origEditor.setValue(updatedLeft);
    setLeftFile((prev) => ({ ...prev, content: updatedLeft, isDirty: true }));
    showToast(t.toasts.copiedChunkToLeft);
  }, [contextMenu, t, showToast]);

  // Copy highlighted/selected lines to opposite side
  const handleCopySelectedToRight = useCallback(() => {
    if (!diffEditorRef.current || !contextMenu.selection) return;
    const origEditor = diffEditorRef.current.getOriginalEditor();
    const modEditor = diffEditorRef.current.getModifiedEditor();

    const { startLineNumber, endLineNumber } = contextMenu.selection;
    const leftContent = origEditor.getValue();
    const rightContent = modEditor.getValue();
    const targetPos = modEditor.getPosition()?.lineNumber || startLineNumber;

    const updatedRight = copySelectedLines(
      leftContent,
      rightContent,
      startLineNumber,
      endLineNumber,
      targetPos,
      targetPos + (endLineNumber - startLineNumber)
    );

    modEditor.setValue(updatedRight);
    setRightFile((prev) => ({ ...prev, content: updatedRight, isDirty: true }));
    showToast(t.toasts.copiedSelectedToRight);
  }, [contextMenu, t, showToast]);

  const handleCopySelectedToLeft = useCallback(() => {
    if (!diffEditorRef.current || !contextMenu.selection) return;
    const origEditor = diffEditorRef.current.getOriginalEditor();
    const modEditor = diffEditorRef.current.getModifiedEditor();

    const { startLineNumber, endLineNumber } = contextMenu.selection;
    const leftContent = origEditor.getValue();
    const rightContent = modEditor.getValue();
    const targetPos = origEditor.getPosition()?.lineNumber || startLineNumber;

    const updatedLeft = copySelectedLines(
      rightContent,
      leftContent,
      startLineNumber,
      endLineNumber,
      targetPos,
      targetPos + (endLineNumber - startLineNumber)
    );

    origEditor.setValue(updatedLeft);
    setLeftFile((prev) => ({ ...prev, content: updatedLeft, isDirty: true }));
    showToast(t.toasts.copiedSelectedToLeft);
  }, [contextMenu, t, showToast]);

  const getActiveContextMenuEditor = useCallback(() => {
    if (!diffEditorRef.current) return null;
    return contextMenu.side === 'left'
      ? diffEditorRef.current.getOriginalEditor()
      : diffEditorRef.current.getModifiedEditor();
  }, [contextMenu.side]);

  const handleUndo = useCallback(() => {
    const ed = getActiveContextMenuEditor();
    ed?.trigger('contextmenu', 'undo', null);
    ed?.focus();
  }, [getActiveContextMenuEditor]);

  const handleRedo = useCallback(() => {
    const ed = getActiveContextMenuEditor();
    ed?.trigger('contextmenu', 'redo', null);
    ed?.focus();
  }, [getActiveContextMenuEditor]);

  const handleCut = useCallback(() => {
    const ed = getActiveContextMenuEditor();
    ed?.focus();
    document.execCommand('cut');
  }, [getActiveContextMenuEditor]);

  const handleCopy = useCallback(() => {
    const ed = getActiveContextMenuEditor();
    ed?.focus();
    document.execCommand('copy');
  }, [getActiveContextMenuEditor]);

  const handlePaste = useCallback(async () => {
    const ed = getActiveContextMenuEditor();
    ed?.focus();
    try {
      const text = await navigator.clipboard.readText();
      ed?.trigger('keyboard', 'type', { text });
    } catch {
      document.execCommand('paste');
    }
  }, [getActiveContextMenuEditor]);

  const handleSelectAll = useCallback(() => {
    const ed = getActiveContextMenuEditor();
    ed?.trigger('contextmenu', 'editor.action.selectAll', null);
    ed?.focus();
  }, [getActiveContextMenuEditor]);

  // Global Keyboard Shortcuts (Ctrl+S, F7 / Shift+F7, Alt+Right/Left, F4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S: Save current modified file
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (rightFile.isDirty) {
          handleSave('right');
        } else if (leftFile.isDirty) {
          handleSave('left');
        } else {
          handleSave('right');
        }
      }

      // Alt+ArrowRight: Copy chunk to right
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleCopyChunkToRight();
      }

      // Alt+ArrowLeft: Copy chunk to left
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleCopyChunkToLeft();
      }

      // F7 or F4 or Ctrl+Down: Next Diff
      if (
        (e.key === 'F7' && !e.shiftKey) ||
        (e.key === 'F4' && !e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown')
      ) {
        e.preventDefault();
        handleNextDiff();
      }

      // Shift+F7 or Shift+F4 or Ctrl+Up: Previous Diff
      if (
        (e.key === 'F7' && e.shiftKey) ||
        (e.key === 'F4' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp')
      ) {
        e.preventDefault();
        handlePrevDiff();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    leftFile,
    rightFile,
    handleNextDiff,
    handlePrevDiff,
    handleCopyChunkToRight,
    handleCopyChunkToLeft,
  ]);

  return (
    <div className="app-container">
      {/* Hidden inputs for single file selection */}
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

      {/* Hidden inputs for fallback directory upload */}
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
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">
            <ArrowRightLeft size={20} />
            <span>{t.app.title}</span>
          </div>
          <span className="brand-badge">{t.app.tagline}</span>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <ShieldCheck size={14} color="#10b981" />
            <span>{t.app.zeroServer}</span>
          </div>
          <div className="stat-item">
            {isMatch ? (
              <span className="stat-diff-tag equal">
                <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                {t.app.noDiff}
              </span>
            ) : (
              <span className="stat-diff-tag different">
                <AlertCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                {t.app.hasDiff}
              </span>
            )}
          </div>

          {/* Language Toggle */}
          <button
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')}
            title="Switch Language / 言語切り替え"
          >
            <Languages size={13} />
            <span>{locale === 'en' ? 'JA' : 'EN'}</span>
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="app-toolbar">
        {/* Left File Controls & New Comparison */}
        <div className="toolbar-group">
          <button
            className="btn-primary"
            onClick={() => setIsOpenDialogOpen(true)}
            title={`${t.toolbar.newCompare} (Ctrl+O / Ctrl+N)`}
            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FilePlus2 size={14} /> {t.toolbar.newCompare}
          </button>
          <button
            className={`btn-secondary ${showFolderPanel ? 'active' : ''}`}
            onClick={() => setShowFolderPanel(!showFolderPanel)}
            title={t.toolbar.toggleFolderPanel}
          >
            <FolderTree size={14} /> {t.toolbar.folderDiff}
          </button>
          <button className="btn-secondary" onClick={() => handleOpenFile('left')}>
            <FolderOpen size={14} /> {t.toolbar.openLeft}
          </button>
          <div className="file-pane-info" title={leftFile.path || leftFile.name}>
            <FileText size={14} color="#60a5fa" />
            <span className="file-name-text">{leftFile.name}</span>
            {leftFile.readOnly && <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: '#334155', padding: '1px 4px', borderRadius: 2 }}>RO</span>}
            {leftFile.isDirty && <span className="file-dirty-dot" title="Unsaved modifications" />}
          </div>
          <button
            className="btn-success"
            onClick={() => handleSave('left')}
            disabled={leftFile.readOnly}
            title={leftFile.readOnly ? 'Left file is read-only' : t.toolbar.saveTitle}
          >
            <Save size={14} /> {t.toolbar.saveLeft}
          </button>
        </div>

        {/* Merge Actions */}
        <div className="toolbar-group">
          <button
            className="btn-secondary"
            onClick={() => handleMerge('rightToLeft')}
            title={t.toolbar.mergeToLeftTitle}
          >
            <ArrowLeft size={14} /> {t.toolbar.mergeToLeft}
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleMerge('leftToRight')}
            title={t.toolbar.mergeToRightTitle}
          >
            {t.toolbar.mergeToRight} <ArrowRight size={14} />
          </button>
        </div>

        {/* Diff Navigation */}
        <div className="toolbar-group">
          <button
            className="btn-secondary"
            onClick={handlePrevDiff}
            title={`${t.toolbar.prevDiff} (Shift+F7 / Ctrl+Up)`}
          >
            <ChevronUp size={14} /> {t.toolbar.prevDiff}
          </button>
          <button
            className="btn-secondary"
            onClick={handleNextDiff}
            title={`${t.toolbar.nextDiff} (F7 / Ctrl+Down)`}
          >
            {t.toolbar.nextDiff} <ChevronDown size={14} />
          </button>
        </div>

        {/* Right File Controls */}
        <div className="toolbar-group">
          <button
            className="btn-success"
            onClick={() => handleSave('right')}
            disabled={rightFile.readOnly}
            title={rightFile.readOnly ? 'Right file is read-only' : t.toolbar.saveTitle}
          >
            <Save size={14} /> {t.toolbar.saveRight}
          </button>
          <div className="file-pane-info" title={rightFile.path || rightFile.name}>
            <FileText size={14} color="#38bdf8" />
            <span className="file-name-text">{rightFile.name}</span>
            {rightFile.readOnly && <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: '#334155', padding: '1px 4px', borderRadius: 2 }}>RO</span>}
            {rightFile.isDirty && <span className="file-dirty-dot" title="Unsaved modifications" />}
          </div>
          <button className="btn-secondary" onClick={() => handleOpenFile('right')}>
            <FolderOpen size={14} /> {t.toolbar.openRight}
          </button>
        </div>

        {/* Comparison Options */}
        <div className="toolbar-group">
          <button
            className={`btn-toggle ${ignoreTrimWhitespace ? 'active' : ''}`}
            onClick={() => setIgnoreTrimWhitespace(!ignoreTrimWhitespace)}
            title={t.toolbar.ignoreWhitespace}
          >
            {t.toolbar.ignoreWhitespace}: {ignoreTrimWhitespace ? t.toolbar.on : t.toolbar.off}
          </button>
          <button
            className={`btn-toggle ${normalizeOptions.ignoreLineEndings ? 'active' : ''}`}
            onClick={() =>
              setNormalizeOptions((prev) => ({ ...prev, ignoreLineEndings: !prev.ignoreLineEndings }))
            }
            title={t.toolbar.ignoreLineEndings}
          >
            {t.toolbar.ignoreLineEndings}: {normalizeOptions.ignoreLineEndings ? t.toolbar.on : t.toolbar.off}
          </button>
          <button
            className={`btn-toggle ${renderSideBySide ? 'active' : ''}`}
            onClick={() => setRenderSideBySide(!renderSideBySide)}
            title={renderSideBySide ? t.toolbar.inline : t.toolbar.sideBySide}
          >
            {renderSideBySide ? <Columns size={14} /> : <Rows size={14} />}
            {renderSideBySide ? t.toolbar.sideBySide : t.toolbar.inline}
          </button>
        </div>

        {/* Export Actions */}
        <div className="toolbar-group">
          <button
            className="btn-secondary"
            onClick={handleExportHtmlReport}
            title={t.toolbar.exportTitle}
          >
            <FileCode size={14} /> {t.toolbar.exportReport}
          </button>
          <button
            className="btn-secondary"
            onClick={handleExportPatch}
            title={t.toolbar.exportTitle}
          >
            <Download size={14} /> {t.toolbar.exportPatch}
          </button>
        </div>
      </div>

      {/* Editor & Folder Panel */}
      <main className="editor-main">
        {showFolderPanel && (
          <FolderDiffPanel
            leftFolderName={leftFolderName}
            rightFolderName={rightFolderName}
            diffItems={diffResult.items}
            summary={diffResult.summary}
            selectedPath={selectedPath}
            isScanning={isScanning}
            scanProgressText={scanProgressText}
            canCompare={Boolean(
              (leftDirHandle || (leftFallbackFiles && leftFallbackFiles.length > 0)) &&
              (rightDirHandle || (rightFallbackFiles && rightFallbackFiles.length > 0))
            )}
            onOpenLeftFolder={() => handleOpenFolder('left')}
            onOpenRightFolder={() => handleOpenFolder('right')}
            onCompareFolders={handleExecuteFolderCompare}
            onResetFolders={handleResetFolderCompare}
            onSelectFile={handleSelectDiffItem}
          />
        )}

        {/* Left Drop Zone */}
        <div
          className={`drop-side ${dragSide === 'left' ? 'dragover' : ''}`}
          style={{ display: dragSide === 'left' ? 'flex' : 'none', position: 'absolute', left: showFolderPanel ? 380 : 0, width: '40%', height: '80%', zIndex: 50 }}
          onDragOver={(e) => handleDragOver(e, 'left')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'left')}
        >
          <FolderOpen size={48} color="#60a5fa" />
          <h3>{t.dropzone.dropLeft}</h3>
        </div>

        {/* Right Drop Zone */}
        <div
          className={`drop-side ${dragSide === 'right' ? 'dragover' : ''}`}
          style={{ display: dragSide === 'right' ? 'flex' : 'none', position: 'absolute', right: 0, width: '40%', height: '80%', zIndex: 50 }}
          onDragOver={(e) => handleDragOver(e, 'right')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'right')}
        >
          <FolderOpen size={48} color="#38bdf8" />
          <h3>{t.dropzone.dropRight}</h3>
        </div>

        <div
          className="diff-wrapper"
          onDragOver={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) {
              setDragSide('left');
            } else {
              setDragSide('right');
            }
          }}
        >
          {isImageFileName(leftFile.name) || isImageFileName(rightFile.name) ? (
            <ImageDiffViewer
              leftName={leftFile.name}
              leftSrc={leftFile.imageUrl}
              leftSize={leftFile.size}
              rightName={rightFile.name}
              rightSrc={rightFile.imageUrl}
              rightSize={rightFile.size}
            />
          ) : (
            <DiffEditor
              height="100%"
              language={language}
              original={leftFile.content}
              modified={rightFile.content}
              beforeMount={handleEditorBeforeMount}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: rightFile.readOnly ?? false,
                originalEditable: !(leftFile.readOnly ?? false),
                renderSideBySide,
                ignoreTrimWhitespace,
                automaticLayout: true,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                diffCodeLens: true,
                contextmenu: false,
              }}
            />
          )}
        </div>
      </main>

      {/* Status Bar */}
      <footer className="app-statusbar">
        <div className="statusbar-group">
          <span className="statusbar-item">
            {t.statusbar.path} <strong>{leftFile.path || leftFile.name}</strong>
          </span>
          <span className="statusbar-item">
            {t.statusbar.language} <strong>{language}</strong>
          </span>
          <span className="statusbar-item">
            {t.statusbar.encoding}{' '}
            <strong>
              {leftFile.encoding && rightFile.encoding && leftFile.encoding !== rightFile.encoding
                ? `L:${formatEncodingLabel(leftFile.encoding)} | R:${formatEncodingLabel(rightFile.encoding)}`
                : formatEncodingLabel(leftFile.encoding || rightFile.encoding)}
            </strong>
          </span>
          <span className="statusbar-item">
            {t.statusbar.directSave} <strong>{isFileSystemAccessSupported() ? t.statusbar.enabled : t.statusbar.fallback}</strong>
          </span>
        </div>

        <div className="statusbar-group">
          <span className="statusbar-item">
            {t.statusbar.left} {leftFile.content.split('\n').length} {t.statusbar.lines} ({leftFile.size} {t.statusbar.bytes})
          </span>
          <span className="statusbar-item">
            {t.statusbar.right} {rightFile.content.split('\n').length} {t.statusbar.lines} ({rightFile.size} {t.statusbar.bytes})
          </span>
        </div>
      </footer>

      {/* Custom WinMerge-style Context Menu */}
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

      {/* Floating WinMerge-style Open & Compare Dialog */}
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
