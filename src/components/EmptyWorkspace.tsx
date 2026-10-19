import React from 'react';
import { GitCompare, FolderOpen, Play } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import './EmptyWorkspace.css';

interface EmptyWorkspaceProps {
  onOpenCompare: () => void;
  onLoadDemo?: () => void;
}

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({
  onOpenCompare,
  onLoadDemo,
}) => {
  const { t, locale } = useTranslation();

  return (
    <div className="empty-workspace-container">
      <div className="empty-workspace-card">
        <div className="empty-workspace-icon-wrapper">
          <GitCompare size={44} className="empty-workspace-hero-icon" />
        </div>

        <h2 className="empty-workspace-title">
          {locale === 'ja' ? '開いている比較はありません' : 'No Active Comparison'}
        </h2>
        <p className="empty-workspace-description">
          {locale === 'ja'
            ? '上部の「新規比較」または「＋」ボタンから、ファイルやフォルダーの比較を開始できます。'
            : 'Open a new file or folder comparison to start diffing and merging.'}
        </p>

        <div className="empty-workspace-actions">
          <button
            type="button"
            className="empty-action-primary"
            onClick={onOpenCompare}
          >
            <FolderOpen size={16} />
            <span>{t.toolbar.newCompare}</span>
            <kbd>Ctrl+O</kbd>
          </button>

          {onLoadDemo && (
            <button
              type="button"
              className="empty-action-secondary"
              onClick={onLoadDemo}
            >
              <Play size={15} />
              <span>{locale === 'ja' ? 'サンプル比較を読み込む' : 'Load Sample Demo'}</span>
            </button>
          )}
        </div>

        <div className="empty-workspace-shortcuts">
          <div className="shortcut-row">
            <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>O</kbd></span>
            <span className="shortcut-desc">{locale === 'ja' ? '新規ファイル/フォルダ比較' : 'New Compare'}</span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>W</kbd></span>
            <span className="shortcut-desc">{locale === 'ja' ? '現在のタブを閉じる' : 'Close Tab'}</span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-keys"><kbd>F7</kbd> / <kbd>Shift+F7</kbd></span>
            <span className="shortcut-desc">{locale === 'ja' ? '次 / 前の差分へジャンプ' : 'Next / Prev Diff'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
