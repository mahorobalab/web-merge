import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type { DiffEditorProps } from '@monaco-editor/react';
import { FolderOpen } from 'lucide-react';
import type { FileState } from '../types/app';
import { isImageFileName } from '../utils/imageDetector';
import { ImageDiffViewer } from './ImageDiffViewer';
import { useTranslation } from '../i18n/I18nContext';

export interface FileDiffWorkspaceProps {
  leftFile: FileState;
  rightFile: FileState;
  language: string;
  renderSideBySide: boolean;
  ignoreTrimWhitespace: boolean;
  onEditorBeforeMount?: DiffEditorProps['beforeMount'];
  onEditorDidMount?: DiffEditorProps['onMount'];
  onDropItem: (file: File, handle?: FileSystemFileHandle, side?: 'left' | 'right') => void;
  theme?: 'dark' | 'light';
}

export const FileDiffWorkspace: React.FC<FileDiffWorkspaceProps> = ({
  leftFile,
  rightFile,
  language,
  renderSideBySide,
  ignoreTrimWhitespace,
  onEditorBeforeMount,
  onEditorDidMount,
  onDropItem,
  theme = 'light',
}) => {
  const { t } = useTranslation();
  const [dragSide, setDragSide] = useState<'left' | 'right' | null>(null);

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
          onDropItem(file, handle, side);
        }
      }
    }
  };

  return (
    <main className="editor-main">
      {/* Left Drop Zone */}
      <div
        className={`drop-side ${dragSide === 'left' ? 'dragover' : ''}`}
        style={{ display: dragSide === 'left' ? 'flex' : 'none', position: 'absolute', left: 0, width: '50%', height: '80%', zIndex: 50 }}
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
        style={{ display: dragSide === 'right' ? 'flex' : 'none', position: 'absolute', right: 0, width: '50%', height: '80%', zIndex: 50 }}
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
            beforeMount={onEditorBeforeMount}
            onMount={onEditorDidMount}
            theme={theme === 'light' ? 'vs' : 'vs-dark'}
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
              mouseWheelZoom: true,
            }}
          />
        )}
      </div>
    </main>
  );
};
