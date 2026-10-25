import { useState, useRef, useCallback } from 'react';
import type { DiffEditorProps } from '@monaco-editor/react';
import type { FileState, ContextMenuState } from '../types/app';
import {
  copyChunkLeftToRight,
  copyChunkRightToLeft,
  copySelectedLines,
  findLineChangeAtLine,
  type LineChangeInfo,
} from '../utils/diffChunkMerger';
import { useTranslation } from '../i18n/I18nContext';

interface UseDiffEditorMergeOptions {
  setLeftFile: React.Dispatch<React.SetStateAction<FileState>>;
  setRightFile: React.Dispatch<React.SetStateAction<FileState>>;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function useDiffEditorMerge({
  setLeftFile,
  setRightFile,
  showToast,
}: UseDiffEditorMergeOptions) {
  const { t } = useTranslation();
  const diffEditorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    side: 'left',
    lineNumber: 1,
    hasSelection: false,
  });

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

  // Full-file merge actions
  const handleMerge = useCallback(
    (direction: 'leftToRight' | 'rightToLeft') => {
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
    },
    [t, setLeftFile, setRightFile, showToast]
  );

  // Context menu position from Monaco event
  const handleOpenContextMenu = useCallback((side: 'left' | 'right', e: any) => {
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
  }, []);

  // Context menu position directly from DOM MouseEvent
  const handleOpenContextMenuDirect = useCallback(
    (side: 'left' | 'right', clientX: number, clientY: number) => {
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
    },
    []
  );

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
  }, [contextMenu, t, setRightFile, showToast]);

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
  }, [contextMenu, t, setLeftFile, showToast]);

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
  }, [contextMenu, t, setRightFile, showToast]);

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
  }, [contextMenu, t, setLeftFile, showToast]);

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

  // Monaco Editor beforeMount config
  const handleEditorBeforeMount: DiffEditorProps['beforeMount'] = (monaco) => {
    monacoRef.current = monaco;
    if (monaco?.languages?.typescript) {
      monaco.languages.typescript.javascriptDefaults?.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });
      monaco.languages.typescript.typescriptDefaults?.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });
      monaco.languages.typescript.typescriptDefaults?.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget?.ESNext ?? 99,
        allowNonTextFiles: true,
        isolatedModules: true,
      });
    }
  };

  // Monaco Editor mount callback
  const handleEditorDidMount: DiffEditorProps['onMount'] = (editor) => {
    diffEditorRef.current = editor;

    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    // Synchronize font size zoom (Ctrl + mouse wheel) between left and right editors
    const fontSizeOption = monacoRef.current?.editor?.EditorOption?.fontSize ?? 52;
    let isSyncingFontSize = false;

    originalEditor.onDidChangeConfiguration((e: any) => {
      if (isSyncingFontSize) return;
      if (e.hasChanged(fontSizeOption)) {
        const newSize = originalEditor.getOption(fontSizeOption);
        if (newSize && modifiedEditor.getOption(fontSizeOption) !== newSize) {
          isSyncingFontSize = true;
          modifiedEditor.updateOptions({ fontSize: newSize });
          isSyncingFontSize = false;
        }
      }
    });

    modifiedEditor.onDidChangeConfiguration((e: any) => {
      if (isSyncingFontSize) return;
      if (e.hasChanged(fontSizeOption)) {
        const newSize = modifiedEditor.getOption(fontSizeOption);
        if (newSize && originalEditor.getOption(fontSizeOption) !== newSize) {
          isSyncingFontSize = true;
          originalEditor.updateOptions({ fontSize: newSize });
          isSyncingFontSize = false;
        }
      }
    });

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

  return {
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
  };
}
