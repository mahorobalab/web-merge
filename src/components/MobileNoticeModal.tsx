import React, { useState } from 'react';
import { Monitor, Smartphone, Copy, Check, Share2, ArrowRight } from 'lucide-react';
import { getMobileNoticeLabels } from '../data/mobileNoticeData';
import { useTranslation } from '../i18n/I18nContext';
import './MobileNoticeModal.css';

export interface MobileNoticeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const MobileNoticeModal: React.FC<MobileNoticeModalProps> = ({ isOpen, onDismiss }) => {
  const { locale } = useTranslation();
  const [copied, setCopied] = useState(false);
  const labels = getMobileNoticeLabels(locale);

  if (!isOpen) {
    return null;
  }

  const handleCopyUrl = async () => {
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://webmerge.dev';
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore copy error
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'WebMerge - Local-First Diff & Merge Tool',
          text: 'Browser-native file and folder diff & merge tool',
          url: window.location.href,
        });
      }
    } catch {
      // User cancelled share dialog or not supported
    }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="mobile-notice-overlay" role="dialog" aria-modal="true" aria-labelledby="mobile-notice-title">
      <div className="mobile-notice-card">
        <div className="mobile-notice-header">
          <div className="mobile-notice-icon-wrapper">
            <Monitor size={32} />
            <div className="mobile-notice-smartphone-badge" title="Smartphone detected">
              <Smartphone size={14} />
            </div>
          </div>
          <span className="mobile-notice-badge">{labels.badge}</span>
          <h2 id="mobile-notice-title" className="mobile-notice-title">
            {labels.title}
          </h2>
          <p className="mobile-notice-desc">{labels.description}</p>
        </div>

        <div className="mobile-notice-reasons">
          <div className="mobile-notice-reasons-title">{labels.reasonsTitle}</div>
          {labels.reasons.map((reason, index) => (
            <div key={index} className="mobile-notice-reason-item">
              <ArrowRight size={14} className="mobile-notice-reason-bullet" />
              <div className="mobile-notice-reason-text">
                <span className="mobile-notice-reason-heading">{reason.title}</span>
                <span className="mobile-notice-reason-desc">{reason.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mobile-notice-actions">
          <button
            type="button"
            className="mobile-notice-btn-primary"
            onClick={handleCopyUrl}
            aria-label={labels.copyUrl}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? labels.copied : labels.copyUrl}</span>
          </button>

          {canShare && (
            <button
              type="button"
              className="mobile-notice-btn-secondary"
              onClick={handleShare}
              aria-label={labels.shareUrl}
            >
              <Share2 size={16} />
              <span>{labels.shareUrl}</span>
            </button>
          )}

          <button
            type="button"
            className="mobile-notice-btn-dismiss"
            onClick={onDismiss}
          >
            {labels.continueAnyway}
          </button>

          <p className="mobile-notice-warning-note">{labels.warningNote}</p>
        </div>
      </div>
    </div>
  );
};
