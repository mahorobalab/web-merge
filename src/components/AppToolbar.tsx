import React from 'react';
import {
  FilePlus2,
  FolderTree,
  FolderOpen,
  FileText,
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
  isFolderTab: boolean;
  onOpenNewCompare: () => void;

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
  isFolderTab,
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

  return (
    <div className="app-toolbar">
      {/* Comparison Initiation */}
      <div className="toolbar-group">
        <button
          className="btn-primary"
          onClick={onOpenNewCompare}
          title={`${t.toolbar.newCompare} (Ctrl+O / Ctrl+N)`}
          style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FilePlus2 size={14} /> {t.toolbar.newCompare}
        </button>
      </div>

      {isFolderTab ? (
        <div className="toolbar-group" style={{ flex: 1, justifyContent: 'flex-start' }}>
          <button
            className="btn-secondary"
            onClick={onRescanFolder}
            disabled={isScanning || !canCompareFolder}
            title={t.folderTable.rescan}
          >
            <RefreshCw size={14} className={isScanning ? 'spin' : ''} /> {t.folderTable.rescan}
          </button>
          <div className="file-pane-info">
            <FolderTree size={14} color="#60a5fa" />
            <button
              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 500 }}
              onClick={onOpenLeftFolder}
              title={t.toolbar.openLeft}
            >
              {leftFolderName || 'Left Folder'}
            </button>
            <span style={{ color: '#94a3b8', margin: '0 4px' }}>↔</span>
            <button
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 500 }}
              onClick={onOpenRightFolder}
              title={t.toolbar.openRight}
            >
              {rightFolderName || 'Right Folder'}
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={onResetFolder}
            title="Reset"
            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
          >
            Reset
          </button>
        </div>
      ) : (
        leftFile &&
        rightFile && (
          <>
            {/* Left File Controls */}
            <div className="toolbar-group">
              <button className="btn-secondary" onClick={() => onOpenFile?.('left')}>
                <FolderOpen size={14} /> {t.toolbar.openLeft}
              </button>
              <div className="file-pane-info" title={leftFile.path || leftFile.name}>
                <FileText size={14} color="#60a5fa" />
                <span className="file-name-text">{leftFile.name}</span>
                {leftFile.readOnly && (
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: '#334155', padding: '1px 4px', borderRadius: 2 }}>
                    RO
                  </span>
                )}
                {leftFile.isDirty && <span className="file-dirty-dot" title="Unsaved modifications" />}
              </div>
              <button
                className="btn-success"
                onClick={() => onSaveFile?.('left')}
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
                onClick={() => onMerge?.('rightToLeft')}
                title={t.toolbar.mergeToLeftTitle}
              >
                <ArrowLeft size={14} /> {t.toolbar.mergeToLeft}
              </button>
              <button
                className="btn-secondary"
                onClick={() => onMerge?.('leftToRight')}
                title={t.toolbar.mergeToRightTitle}
              >
                {t.toolbar.mergeToRight} <ArrowRight size={14} />
              </button>
            </div>

            {/* Diff Navigation */}
            <div className="toolbar-group">
              <button
                className="btn-secondary"
                onClick={onPrevDiff}
                title={`${t.toolbar.prevDiff} (Shift+F7 / Ctrl+Up)`}
              >
                <ChevronUp size={14} /> {t.toolbar.prevDiff}
              </button>
              <button
                className="btn-secondary"
                onClick={onNextDiff}
                title={`${t.toolbar.nextDiff} (F7 / Ctrl+Down)`}
              >
                {t.toolbar.nextDiff} <ChevronDown size={14} />
              </button>
            </div>

            {/* Right File Controls */}
            <div className="toolbar-group">
              <button
                className="btn-success"
                onClick={() => onSaveFile?.('right')}
                disabled={rightFile.readOnly}
                title={rightFile.readOnly ? 'Right file is read-only' : t.toolbar.saveTitle}
              >
                <Save size={14} /> {t.toolbar.saveRight}
              </button>
              <div className="file-pane-info" title={rightFile.path || rightFile.name}>
                <FileText size={14} color="#38bdf8" />
                <span className="file-name-text">{rightFile.name}</span>
                {rightFile.readOnly && (
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: '#334155', padding: '1px 4px', borderRadius: 2 }}>
                    RO
                  </span>
                )}
                {rightFile.isDirty && <span className="file-dirty-dot" title="Unsaved modifications" />}
              </div>
              <button className="btn-secondary" onClick={() => onOpenFile?.('right')}>
                <FolderOpen size={14} /> {t.toolbar.openRight}
              </button>
            </div>

            {/* Comparison Options */}
            <div className="toolbar-group">
              <button
                className={`btn-toggle ${ignoreTrimWhitespace ? 'active' : ''}`}
                onClick={onToggleIgnoreTrimWhitespace}
                title={t.toolbar.ignoreWhitespace}
              >
                {t.toolbar.ignoreWhitespace}: {ignoreTrimWhitespace ? t.toolbar.on : t.toolbar.off}
              </button>
              <button
                className={`btn-toggle ${normalizeOptions.ignoreLineEndings ? 'active' : ''}`}
                onClick={onToggleIgnoreLineEndings}
                title={t.toolbar.ignoreLineEndings}
              >
                {t.toolbar.ignoreLineEndings}: {normalizeOptions.ignoreLineEndings ? t.toolbar.on : t.toolbar.off}
              </button>
              <button
                className={`btn-toggle ${renderSideBySide ? 'active' : ''}`}
                onClick={onToggleRenderSideBySide}
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
                onClick={onExportHtmlReport}
                title={t.toolbar.exportTitle}
              >
                <FileCode size={14} /> {t.toolbar.exportReport}
              </button>
              <button
                className="btn-secondary"
                onClick={onExportPatch}
                title={t.toolbar.exportTitle}
              >
                <Download size={14} /> {t.toolbar.exportPatch}
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
};
