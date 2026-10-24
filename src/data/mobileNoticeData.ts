/**
 * Multilingual content and labels for the mobile warning / desktop recommendation modal.
 */

export interface MobileNoticeLabels {
  badge: string;
  title: string;
  description: string;
  reasonsTitle: string;
  reasons: Array<{
    title: string;
    description: string;
  }>;
  copyUrl: string;
  copied: string;
  shareUrl: string;
  continueAnyway: string;
  warningNote: string;
}

const LABELS_EN: MobileNoticeLabels = {
  badge: 'Desktop Optimized',
  title: 'Please Visit from a Desktop Browser',
  description:
    'WebMerge is a high-performance, local-first diff & merge utility designed for desktop computers. For the best split-screen comparison and direct file editing experience, please access this app from a PC.',
  reasonsTitle: 'Why PC is recommended:',
  reasons: [
    {
      title: 'Side-by-Side Diff View',
      description: 'Split-screen side-by-side file and folder comparison requires desktop screen width.',
    },
    {
      title: 'Direct Local File Saving',
      description: 'Direct in-place local file writing (File System Access API) is only supported on desktop browsers.',
    },
    {
      title: 'Monaco Code Editor',
      description: 'High-precision keyboard navigation, shortcuts, and syntax highlighting built for desktop.',
    },
  ],
  copyUrl: 'Copy Link to Open on PC',
  copied: 'Link copied to clipboard!',
  shareUrl: 'Share Link',
  continueAnyway: 'Continue on mobile anyway (Not recommended)',
  warningNote: 'Note: Layout and file saving functions will be limited on mobile devices.',
};

const LABELS_JA: MobileNoticeLabels = {
  badge: 'PC環境向けに最適化',
  title: 'PC（デスクトップブラウザ）からのご利用をおすすめします',
  description:
    'WebMerge は左右2画面のコード差分比較や、ローカルファイルへの直接書き込みに最適化されたツールです。快適にご利用いただくため、PC環境でのアクセスをお願いいたします。',
  reasonsTitle: 'PCでのご利用を推奨する理由：',
  reasons: [
    {
      title: '左右分割（Side-by-Side）表示',
      description: '2つのファイルやフォルダの視覚的な差分比較には、PCの十分な画面幅が必要です。',
    },
    {
      title: 'ローカルファイルへの直接上書き保存',
      description: 'ブラウザから直接ローカルファイルを読み書きする機能（File System Access API）はPC向けブラウザで提供されています。',
    },
    {
      title: 'Monaco Editor（VS Code品質）',
      description: 'ショートカットキーやキーボード操作、高機能なシンタックスハイライトに最適化されています。',
    },
  ],
  copyUrl: 'URLをコピーしてPCで開く',
  copied: 'URLをクリップボードにコピーしました！',
  shareUrl: 'URLを共有する',
  continueAnyway: 'このままスマートフォンで表示する（非推奨）',
  warningNote: '※ スマートフォンでは画面レイアウトの崩れや、ファイル保存機能の制限が発生します。',
};

/**
 * Returns the localized labels for the mobile notice dialog.
 */
export function getMobileNoticeLabels(locale: string): MobileNoticeLabels {
  if (locale === 'ja' || locale.startsWith('ja-')) {
    return LABELS_JA;
  }
  return LABELS_EN;
}
