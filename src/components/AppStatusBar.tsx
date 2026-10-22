import React from 'react';
import { Info } from 'lucide-react';
import type { FileState } from '../types/app';
import { formatEncodingLabel } from '../utils/encodingDetector';
import { isFileSystemAccessSupported } from '../core/fileStorage';
import { useTranslation } from '../i18n/I18nContext';

export interface AppStatusBarProps {
  leftFile: FileState;
  rightFile: FileState;
  language: string;
  onOpenAbout?: () => void;
  zoomPercentage?: string;
  onResetZoom?: () => void;
}

export const AppStatusBar: React.FC<AppStatusBarProps> = ({
  leftFile,
  rightFile,
  language,
  onOpenAbout,
  zoomPercentage,
  onResetZoom,
}) => {
  const { t, locale } = useTranslation();

  return (
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
        {zoomPercentage && onResetZoom && (
          <button
            type="button"
            className="table-zoom-indicator"
            onClick={onResetZoom}
            title={locale === 'ja' ? '表示リセット (Ctrl+ホイール: 文字サイズ, Shift+ホイール: 行間, Ctrl+0: リセット)' : 'Reset view (Ctrl+Wheel: Font size, Shift+Wheel: Line spacing, Ctrl+0: Reset)'}
          >
            <span>{zoomPercentage}</span>
          </button>
        )}
        {onOpenAbout && (
          <button
            type="button"
            className="statusbar-about-button"
            onClick={onOpenAbout}
            title={t.app?.title ? `About ${t.app.title}` : 'About'}
            aria-label="About"
          >
            <Info size={13} />
            <span>About</span>
          </button>
        )}
      </div>
    </footer>
  );
};
