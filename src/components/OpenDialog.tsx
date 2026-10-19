import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileText,
  FolderOpen,
  ArrowRightLeft,
  AlertCircle,
  Folder,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import {
  openFileWithPicker,
  readFileObject,
  isFileSystemAccessSupported,
  type OpenedFile,
} from '../core/fileStorage';
import { openDirectoryWithPicker } from '../core/directoryScanner';
import './OpenDialog.css';

export type SelectedItemType = 'file' | 'folder' | null;

export interface DialogItemSelection {
  type: SelectedItemType;
  name: string;
  path?: string;
  openedFile?: OpenedFile;
  dirHandle?: FileSystemDirectoryHandle;
  fallbackFiles?: FileList;
  readOnly: boolean;
}

export interface OpenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCompareFiles: (
    left: OpenedFile,
    right: OpenedFile,
    leftReadOnly: boolean,
    rightReadOnly: boolean
  ) => void;
  onCompareFolders: (
    left: { name: string; handle?: FileSystemDirectoryHandle; fallbackFiles?: FileList },
    right: { name: string; handle?: FileSystemDirectoryHandle; fallbackFiles?: FileList },
    leftReadOnly: boolean,
    rightReadOnly: boolean
  ) => void;
  currentLeftFile?: { name: string; content: string; readOnly?: boolean };
  currentRightFile?: { name: string; content: string; readOnly?: boolean };
}

export const OpenDialog: React.FC<OpenDialogProps> = ({
  isOpen,
  onClose,
  onCompareFiles,
  onCompareFolders,
  currentLeftFile,
  currentRightFile,
}) => {
  const { t } = useTranslation();

  const [leftSelection, setLeftSelection] = useState<DialogItemSelection>({
    type: currentLeftFile ? 'file' : null,
    name: currentLeftFile?.name || '',
    readOnly: currentLeftFile?.readOnly ?? false,
  });

  const [rightSelection, setRightSelection] = useState<DialogItemSelection>({
    type: currentRightFile ? 'file' : null,
    name: currentRightFile?.name || '',
    readOnly: currentRightFile?.readOnly ?? false,
  });

  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [dragOverSide, setDragOverSide] = useState<'left' | 'right' | null>(null);

  // Hidden file/dir inputs for browsers without File System Access API
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const leftDirInputRef = useRef<HTMLInputElement>(null);
  const rightDirInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when dialog opens
  useEffect(() => {
    if (isOpen) {
      setWarningMessage(null);
      if (currentLeftFile && !leftSelection.name) {
        setLeftSelection({
          type: 'file',
          name: currentLeftFile.name,
          readOnly: currentLeftFile.readOnly ?? false,
        });
      }
      if (currentRightFile && !rightSelection.name) {
        setRightSelection({
          type: 'file',
          name: currentRightFile.name,
          readOnly: currentRightFile.readOnly ?? false,
        });
      }
    }
  }, [isOpen, currentLeftFile, currentRightFile]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Pick single file
  const handlePickFile = async (side: 'left' | 'right') => {
    setWarningMessage(null);
    if (isFileSystemAccessSupported()) {
      try {
        const opened = await openFileWithPicker();
        if (opened) {
          if (side === 'left') {
            setLeftSelection((prev) => ({
              ...prev,
              type: 'file',
              name: opened.name,
              path: opened.name,
              openedFile: opened,
              dirHandle: undefined,
              fallbackFiles: undefined,
            }));
          } else {
            setRightSelection((prev) => ({
              ...prev,
              type: 'file',
              name: opened.name,
              path: opened.name,
              openedFile: opened,
              dirHandle: undefined,
              fallbackFiles: undefined,
            }));
          }
        }
      } catch (err: any) {
        console.error('File open error:', err);
      }
    } else {
      if (side === 'left') {
        leftFileInputRef.current?.click();
      } else {
        rightFileInputRef.current?.click();
      }
    }
  };

  // Pick directory
  const handlePickFolder = async (side: 'left' | 'right') => {
    setWarningMessage(null);
    if (isFileSystemAccessSupported()) {
      try {
        const dirHandle = await openDirectoryWithPicker();
        if (dirHandle) {
          if (side === 'left') {
            setLeftSelection((prev) => ({
              ...prev,
              type: 'folder',
              name: dirHandle.name,
              path: dirHandle.name,
              dirHandle,
              openedFile: undefined,
              fallbackFiles: undefined,
            }));
          } else {
            setRightSelection((prev) => ({
              ...prev,
              type: 'folder',
              name: dirHandle.name,
              path: dirHandle.name,
              dirHandle,
              openedFile: undefined,
              fallbackFiles: undefined,
            }));
          }
        }
      } catch (err: any) {
        console.error('Directory open error:', err);
      }
    } else {
      if (side === 'left') {
        leftDirInputRef.current?.click();
      } else {
        rightDirInputRef.current?.click();
      }
    }
  };

  // Fallback file input change
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      const opened = await readFileObject(file);
      if (side === 'left') {
        setLeftSelection((prev) => ({
          ...prev,
          type: 'file',
          name: opened.name,
          openedFile: opened,
          dirHandle: undefined,
          fallbackFiles: undefined,
        }));
      } else {
        setRightSelection((prev) => ({
          ...prev,
          type: 'file',
          name: opened.name,
          openedFile: opened,
          dirHandle: undefined,
          fallbackFiles: undefined,
        }));
      }
    }
    e.target.value = '';
  };

  // Fallback dir input change
  const handleDirInputChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const folderName = files[0].webkitRelativePath?.split('/')[0] || 'Selected Folder';
      if (side === 'left') {
        setLeftSelection((prev) => ({
          ...prev,
          type: 'folder',
          name: folderName,
          fallbackFiles: files,
          openedFile: undefined,
          dirHandle: undefined,
        }));
      } else {
        setRightSelection((prev) => ({
          ...prev,
          type: 'folder',
          name: folderName,
          fallbackFiles: files,
          openedFile: undefined,
          dirHandle: undefined,
        }));
      }
    }
    e.target.value = '';
  };

  // Handle Drag & Drop directly onto dialog input row
  const handleDrop = async (e: React.DragEvent, side: 'left' | 'right') => {
    e.preventDefault();
    setDragOverSide(null);
    setWarningMessage(null);

    try {
      // Modern File System Access API drop
      const items = Array.from(e.dataTransfer.items || []);
      for (const item of items) {
        if ('getAsFileSystemHandle' in item) {
          const handle = await (item as any).getAsFileSystemHandle();
          if (handle) {
            if (handle.kind === 'directory') {
              const dirHandle = handle as FileSystemDirectoryHandle;
              if (side === 'left') {
                setLeftSelection((prev) => ({
                  ...prev,
                  type: 'folder',
                  name: dirHandle.name,
                  dirHandle,
                  openedFile: undefined,
                  fallbackFiles: undefined,
                }));
              } else {
                setRightSelection((prev) => ({
                  ...prev,
                  type: 'folder',
                  name: dirHandle.name,
                  dirHandle,
                  openedFile: undefined,
                  fallbackFiles: undefined,
                }));
              }
              return;
            } else if (handle.kind === 'file') {
              const fileHandle = handle as FileSystemFileHandle;
              const file = await fileHandle.getFile();
              const opened = await readFileObject(file, fileHandle);
              if (side === 'left') {
                setLeftSelection((prev) => ({
                  ...prev,
                  type: 'file',
                  name: opened.name,
                  openedFile: opened,
                  dirHandle: undefined,
                  fallbackFiles: undefined,
                }));
              } else {
                setRightSelection((prev) => ({
                  ...prev,
                  type: 'file',
                  name: opened.name,
                  openedFile: opened,
                  dirHandle: undefined,
                  fallbackFiles: undefined,
                }));
              }
              return;
            }
          }
        }
      }

      // Traditional File drop fallback
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const opened = await readFileObject(file);
        if (side === 'left') {
          setLeftSelection((prev) => ({
            ...prev,
            type: 'file',
            name: opened.name,
            openedFile: opened,
            dirHandle: undefined,
            fallbackFiles: undefined,
          }));
        } else {
          setRightSelection((prev) => ({
            ...prev,
            type: 'file',
            name: opened.name,
            openedFile: opened,
            dirHandle: undefined,
            fallbackFiles: undefined,
          }));
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // Compare validation & submission
  const handleCompareSubmit = () => {
    if (!leftSelection.name || !rightSelection.name) {
      setWarningMessage(t.openDialog.selectBothPrompt);
      return;
    }

    if (leftSelection.type !== rightSelection.type) {
      setWarningMessage(t.openDialog.typeMismatchWarning);
      return;
    }

    if (leftSelection.type === 'file' && rightSelection.type === 'file') {
      // If openedFile isn't present (e.g. current files), create fallback opened file object
      const leftOpened: OpenedFile = leftSelection.openedFile || {
        name: leftSelection.name,
        content: currentLeftFile?.content || '',
        encoding: 'utf-8',
        lastModified: Date.now(),
        size: currentLeftFile?.content.length || 0,
      };
      const rightOpened: OpenedFile = rightSelection.openedFile || {
        name: rightSelection.name,
        content: currentRightFile?.content || '',
        encoding: 'utf-8',
        lastModified: Date.now(),
        size: currentRightFile?.content.length || 0,
      };

      onCompareFiles(leftOpened, rightOpened, leftSelection.readOnly, rightSelection.readOnly);
      onClose();
    } else if (leftSelection.type === 'folder' && rightSelection.type === 'folder') {
      onCompareFolders(
        {
          name: leftSelection.name,
          handle: leftSelection.dirHandle,
          fallbackFiles: leftSelection.fallbackFiles,
        },
        {
          name: rightSelection.name,
          handle: rightSelection.dirHandle,
          fallbackFiles: rightSelection.fallbackFiles,
        },
        leftSelection.readOnly,
        rightSelection.readOnly
      );
      onClose();
    }
  };

  const canCompare = Boolean(leftSelection.name && rightSelection.name);

  return (
    <div className="open-dialog-backdrop" onClick={onClose}>
      {/* Hidden Fallback Inputs */}
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

      <div className="open-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Dialog Header */}
        <div className="open-dialog-header">
          <div className="open-dialog-title">
            <ArrowRightLeft size={18} color="#60a5fa" />
            <span>{t.openDialog.title}</span>
          </div>
          <button className="btn-icon" onClick={onClose} title={t.openDialog.cancel}>
            <X size={16} />
          </button>
        </div>

        {/* Warning Banner */}
        {warningMessage && (
          <div className="open-dialog-warning">
            <AlertCircle size={15} />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Dialog Body */}
        <div className="open-dialog-body">
          {/* 1st Item (Left) */}
          <div className="selection-group">
            <label className="selection-label">
              <span className="selection-side-tag left">{t.openDialog.leftSide}</span>
              {t.openDialog.firstItem}
            </label>
            <div
              className={`selection-input-row ${dragOverSide === 'left' ? 'dragover' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverSide('left');
              }}
              onDragLeave={() => setDragOverSide(null)}
              onDrop={(e) => handleDrop(e, 'left')}
            >
              <div className="selection-input-wrapper">
                {leftSelection.type === 'folder' ? (
                  <Folder size={15} color="#eab308" className="type-icon" />
                ) : (
                  <FileText size={15} color="#60a5fa" className="type-icon" />
                )}
                <input
                  type="text"
                  className="selection-input"
                  readOnly
                  placeholder={t.openDialog.placeholder}
                  value={leftSelection.name}
                  title={leftSelection.name}
                />
                {leftSelection.type && (
                  <span className={`type-badge ${leftSelection.type}`}>
                    {leftSelection.type === 'folder' ? t.openDialog.typeFolder : t.openDialog.typeFile}
                  </span>
                )}
              </div>
              <div className="selection-btn-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handlePickFile('left')}
                  title={t.openDialog.browseFile}
                >
                  <FileText size={13} /> {t.openDialog.browseFile}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handlePickFolder('left')}
                  title={t.openDialog.browseFolder}
                >
                  <FolderOpen size={13} /> {t.openDialog.browseFolder}
                </button>
              </div>
            </div>
            <div className="selection-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={leftSelection.readOnly}
                  onChange={(e) =>
                    setLeftSelection((prev) => ({ ...prev, readOnly: e.target.checked }))
                  }
                />
                <span>{t.openDialog.readOnly}</span>
              </label>
            </div>
          </div>

          {/* 2nd Item (Right) */}
          <div className="selection-group">
            <label className="selection-label">
              <span className="selection-side-tag right">{t.openDialog.rightSide}</span>
              {t.openDialog.secondItem}
            </label>
            <div
              className={`selection-input-row ${dragOverSide === 'right' ? 'dragover' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverSide('right');
              }}
              onDragLeave={() => setDragOverSide(null)}
              onDrop={(e) => handleDrop(e, 'right')}
            >
              <div className="selection-input-wrapper">
                {rightSelection.type === 'folder' ? (
                  <Folder size={15} color="#eab308" className="type-icon" />
                ) : (
                  <FileText size={15} color="#38bdf8" className="type-icon" />
                )}
                <input
                  type="text"
                  className="selection-input"
                  readOnly
                  placeholder={t.openDialog.placeholder}
                  value={rightSelection.name}
                  title={rightSelection.name}
                />
                {rightSelection.type && (
                  <span className={`type-badge ${rightSelection.type}`}>
                    {rightSelection.type === 'folder' ? t.openDialog.typeFolder : t.openDialog.typeFile}
                  </span>
                )}
              </div>
              <div className="selection-btn-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handlePickFile('right')}
                  title={t.openDialog.browseFile}
                >
                  <FileText size={13} /> {t.openDialog.browseFile}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handlePickFolder('right')}
                  title={t.openDialog.browseFolder}
                >
                  <FolderOpen size={13} /> {t.openDialog.browseFolder}
                </button>
              </div>
            </div>
            <div className="selection-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rightSelection.readOnly}
                  onChange={(e) =>
                    setRightSelection((prev) => ({ ...prev, readOnly: e.target.checked }))
                  }
                />
                <span>{t.openDialog.readOnly}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dialog Footer Actions */}
        <div className="open-dialog-footer">
          <button
            type="button"
            className="btn-secondary dialog-cancel-btn"
            onClick={onClose}
          >
            {t.openDialog.cancel}
          </button>
          <button
            type="button"
            className="btn-primary dialog-compare-btn"
            onClick={handleCompareSubmit}
            disabled={!canCompare}
          >
            <ArrowRightLeft size={14} /> {t.openDialog.compare}
          </button>
        </div>
      </div>
    </div>
  );
};
