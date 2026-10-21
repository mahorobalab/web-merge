import React from 'react';
import {
  FilePlus2,
  FolderTree,
  FolderOpen,
  Save,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Columns,
  Rows,
  FileCode,
  Download,
  RefreshCw,
} from 'lucide-react';
import type { FileState } from '../types/app';
import type { NormalizeOptions } from '../utils/textNormalizer';
import { useTranslation } from '../i18n/I18nContext';

export interface AppToolbarProps {
  hasActiveTab?: boolean;
  isFolderTab?: boolean;
  onNewCompare?: () => void;
  onOpenDialog?: () => void;
  onOpenNewCompare?: () => void;

  // Folder mode props
  leftFolderName?: string;
  rightFolderName?: string;
  isScanning?: boolean;
  canCompareFolder?: boolean;
  onRescanFolder?: () => void;
  onOpenLeftFolder?: () => void;
  onOpenRightFolder?: () => void;
  onResetFolder?: () => void;

  // File mode props
  leftFile?: FileState;
  rightFile?: FileState;
  onOpenFile?: (side: 'left' | 'right') => void;
  onSaveFile?: (side: 'left' | 'right') => void;
  onMerge?: (direction: 'leftToRight' | 'rightToLeft') => void;
  onPrevDiff?: () => void;
  onNextDiff?: () => void;
  ignoreTrimWhitespace?: boolean;
  onToggleIgnoreTrimWhitespace?: () => void;
  normalizeOptions?: NormalizeOptions;
  onToggleIgnoreLineEndings?: () => void;
  renderSideBySide?: boolean;
  onToggleRenderSideBySide?: () => void;
  onExportHtmlReport?: () => void;
  onExportPatch?: () => void;
}

export const AppToolbar: React.FC<AppToolbarProps> = ({
  hasActiveTab = true,
  isFolderTab = false,
  onNewCompare,
  onOpenDialog,
  onOpenNewCompare,

  leftFolderName = '',
  rightFolderName = '',
  isScanning = false,
  canCompareFolder = false,
  onRescanFolder,
  onOpenLeftFolder,
  onOpenRightFolder,
  onResetFolder,

  leftFile,
  rightFile,
  onOpenFile,
  onSaveFile,
  onMerge,
  onPrevDiff,
  onNextDiff,
  ignoreTrimWhitespace = true,
  onToggleIgnoreTrimWhitespace,
  normalizeOptions = { ignoreLineEndings: true, ignoreLeadingTrailingWhitespace: false, ignoreBlankLines: false },
  onToggleIgnoreLineEndings,
  renderSideBySide = true,
  onToggleRenderSideBySide,
  onExportHtmlReport,
  onExportPatch,
}) => {
  const { t } = useTranslation();

  if (!hasActiveTab) return null;

  return (
    <div className="app-toolbar">
      {/* 1. New - WinMerge style empty diff editor */}
      <button
        className="btn-secondary"
        onClick={onNewCompare}
        title={`${t.toolbar.newFile} (Ctrl+N)`}
        style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: '0.8rem', flexShrink: 0 }}
      >
        <FilePlus2 size={14} />
        <span>{t.toolbar.newFile}</span>
      </button>

      {/* 2. Open - Open comparison dialog (files or folders) */}
      <button
        className="btn-primary"
        onClick={onOpenDialog ?? onOpenNewCompare}
        title={`${t.toolbar.open} (Ctrl+O)`}
        style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: '0.8rem', flexShrink: 0 }}
      >
        <FolderOpen size={14} />
        <span>{t.toolbar.open}</span>
      </button>

      <span className="toolbar-divider" />

      {isFolderTab ? (
        /* Folder Comparison Toolbar Controls */
        <>
          <button
            className="btn-secondary"
            onClick={onRescanFolder}
            disabled={isScanning || !canCompareFolder}
            title={t.folderTable.rescan}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: '0.8rem', flexShrink: 0 }}
          >
            <RefreshCw size={13} className={isScanning ? 'spin' : ''} />
            <span>{t.folderTable.rescan}</span>
          </button>

          <span className="toolbar-divider" />

          <div className="file-pane-info-compact">
            <FolderTree size={13} color="#60a5fa" />
            <button
              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 500, fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onClick={onOpenLeftFolder}
              title={t.toolbar.openLeft}
            >
              {leftFolderName || 'Left Folder'}
            </button>
            <span style={{ color: '#94a3b8', margin: '0 4px' }}>↔</span>
            <button
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 500, fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onClick={onOpenRightFolder}
              title={t.toolbar.openRight}
            >
              {rightFolderName || 'Right Folder'}
            </button>
          </div>

          {onResetFolder && (
            <button
              className="btn-secondary"
              onClick={onResetFolder}
              title="Reset"
              style={{ fontSize: '0.75rem', padding: '3px 8px', marginLeft: 4, flexShrink: 0 }}
            >
              Reset
            </button>
          )}
        </>
      ) : (
        /* File Comparison Toolbar Controls */
        leftFile && rightFile && (
          <>
            {/* Left File Controls */}
            <div className="toolbar-btn-group">
              <button
                className="btn-secondary"
                onClick={() => onOpenFile?.('left')}
                title={t.toolbar.openLeft}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: '0.8rem' }}
              >
                <FolderOpen size={13} />
                <span>{t.toolbar.openLeft}</span>
              </button>
              <button
                className="btn-success"
                onClick={() => onSaveFile?.('left')}
                disabled={leftFile.readOnly}
                title={leftFile.readOnly ? 'Left file is read-only' : t.toolbar.saveTitle}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: '0.8rem' }}
              >
                <Save size={13} />
                <span>{t.toolbar.saveLeft}</span>
              </button>
            </div>

            <span className="toolbar-divider" />

            {/* Merge Actions */}
            <div className="toolbar-btn-group">
              <button
                className="btn-secondary"
                onClick={() => onMerge?.('rightToLeft')}
                title={t.toolbar.mergeToLeftTitle}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <ArrowLeft size={13} />
                <span>{t.toolbar.mergeToLeft}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => onMerge?.('leftToRight')}
                title={t.toolbar.mergeToRightTitle}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <span>{t.toolbar.mergeToRight}</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <span className="toolbar-divider" />

            {/* Diff Navigation */}
            <div className="toolbar-btn-group">
              <button
                className="btn-secondary"
                onClick={onPrevDiff}
                title={`${t.toolbar.prevDiff} (Shift+F7 / Ctrl+Up)`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <ChevronUp size={13} />
                <span>{t.toolbar.prevDiff}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={onNextDiff}
                title={`${t.toolbar.nextDiff} (F7 / Ctrl+Down)`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <span>{t.toolbar.nextDiff}</span>
                <ChevronDown size={13} />
              </button>
            </div>

            <span className="toolbar-divider" />

            {/* Right File Controls */}
            <div className="toolbar-btn-group">
              <button
                className="btn-success"
                onClick={() => onSaveFile?.('right')}
                disabled={rightFile.readOnly}
                title={rightFile.readOnly ? 'Right file is read-only' : t.toolbar.saveTitle}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: '0.8rem' }}
              >
                <Save size={13} />
                <span>{t.toolbar.saveRight}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => onOpenFile?.('right')}
                title={t.toolbar.openRight}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: '0.8rem' }}
              >
                <FolderOpen size={13} />
                <span>{t.toolbar.openRight}</span>
              </button>
            </div>

            <span className="toolbar-divider" />

            {/* Comparison Options */}
            <div className="toolbar-btn-group">
              <button
                className={`btn-toggle ${ignoreTrimWhitespace ? 'active' : ''}`}
                onClick={onToggleIgnoreTrimWhitespace}
                title={t.toolbar.ignoreWhitespace}
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              >
                {t.toolbar.ignoreWhitespace}
              </button>
              <button
                className={`btn-toggle ${normalizeOptions.ignoreLineEndings ? 'active' : ''}`}
                onClick={onToggleIgnoreLineEndings}
                title={t.toolbar.ignoreLineEndings}
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              >
                {t.toolbar.ignoreLineEndings}
              </button>
              <button
                className={`btn-toggle ${renderSideBySide ? 'active' : ''}`}
                onClick={onToggleRenderSideBySide}
                title={renderSideBySide ? t.toolbar.inline : t.toolbar.sideBySide}
                style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {renderSideBySide ? <Columns size={13} /> : <Rows size={13} />}
                <span>{renderSideBySide ? t.toolbar.sideBySide : t.toolbar.inline}</span>
              </button>
            </div>

            <span className="toolbar-divider" />

            {/* Export Actions */}
            <div className="toolbar-btn-group">
              <button
                className="btn-secondary"
                onClick={onExportHtmlReport}
                title={t.toolbar.exportTitle}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <FileCode size={13} />
                <span>{t.toolbar.exportReport}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={onExportPatch}
                title={t.toolbar.exportTitle}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <Download size={13} />
                <span>{t.toolbar.exportPatch}</span>
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
};
