import React from 'react';
import type { FileState } from '../types/app';
import { formatEncodingLabel } from '../utils/encodingDetector';
import { isFileSystemAccessSupported } from '../core/fileStorage';
import { useTranslation } from '../i18n/I18nContext';

export interface AppStatusBarProps {
  leftFile: FileState;
  rightFile: FileState;
  language: string;
}

export const AppStatusBar: React.FC<AppStatusBarProps> = ({
  leftFile,
  rightFile,
  language,
}) => {
  const { t } = useTranslation();

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
      </div>
    </footer>
  );
};
