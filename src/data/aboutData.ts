export interface OpenSourceLibrary {
  name: string;
  package: string;
  version: string;
  license: string;
  category: 'core' | 'editor' | 'ui' | 'tooling';
  description: {
    en: string;
    ja: string;
  };
  url: string;
  licenseUrl?: string;
}

export interface WebMergeAppInfo {
  name: string;
  version: string;
  tagline: {
    en: string;
    ja: string;
  };
  description: {
    en: string;
    ja: string;
  };
  githubUrl: string;
  license: string;
  features: Array<{
    title: { en: string; ja: string };
    desc: { en: string; ja: string };
    iconName: string;
  }>;
}

export const APP_INFO: WebMergeAppInfo = {
  name: 'WebMerge',
  version: '0.1.0',
  tagline: {
    en: 'Browser-native, zero-server file and folder diff & merge tool',
    ja: 'ブラウザで動く、完全ローカル完結型のファイル＆フォルダー差分・マージツール',
  },
  description: {
    en: 'WebMerge is a high-performance, local-first diff & merge utility running entirely inside modern web browsers. Designed with privacy and security at its core, your files and folders never leave your device.',
    ja: 'WebMerge は、モダンブラウザ上で完全にローカル動作する高機能な差分比較・マージツールです。ファイルやフォルダーの内容は外部サーバーへ一切送信されず、安全・セキュアに作業できます。',
  },
  githubUrl: 'https://github.com/mahorobalab/web-merge',
  license: 'MIT License',
  features: [
    {
      iconName: 'ShieldCheck',
      title: {
        en: '100% Client-Side & Private',
        ja: '完全ローカル処理＆高セキュリティ',
      },
      desc: {
        en: 'Zero server communications. All diff analysis, encoding detection, and hashing happen inside your browser tab.',
        ja: 'サーバー通信ゼロ。すべての差分計算、文字コード判定、ハッシュ照合はお使いのブラウザ内部だけで安全に行われます。',
      },
    },
    {
      iconName: 'Save',
      title: {
        en: 'Direct In-Place Saving',
        ja: 'ローカルファイル直接上書き保存',
      },
      desc: {
        en: 'Seamlessly open and save edits directly back to your local files using the modern File System Access API (Ctrl+S).',
        ja: 'File System Access API を活用し、ローカルのファイルを直接開いて編集後、そのまま上書き保存が可能です。',
      },
    },
    {
      iconName: 'FolderGit2',
      title: {
        en: 'Folder Diff & Multi-Tab MDI',
        ja: 'フォルダー階層比較 ＆ マルチタブ',
      },
      desc: {
        en: 'Scan and compare entire directory trees side-by-side with SHA-256 hash detection, and open multiple file diffs in tabs.',
        ja: 'ディレクトリ全体の差分をSHA-256比較で高速スキャン。気になるファイルをマルチタブで並行して編集・比較できます。',
      },
    },
    {
      iconName: 'GitCompare',
      title: {
        en: 'Monaco-Powered Smart Merge',
        ja: 'Monaco Editor による快適マージ',
      },
      desc: {
        en: 'Rich syntax highlighting, inline/split views, whitespace ignoring, and one-click chunk/line merge controls.',
        ja: 'VS Codeと同等の構文ハイライト、左右分割/インライン表示切替、空白・改行無視、ワンクリックマージ操作をサポート。',
      },
    },
  ],
};

export const OPEN_SOURCE_LIBRARIES: OpenSourceLibrary[] = [
  {
    name: 'Monaco Editor',
    package: 'monaco-editor',
    version: '^0.57.0',
    license: 'MIT',
    category: 'editor',
    description: {
      en: 'The code editor that powers Visual Studio Code, providing rich diff view, syntax highlighting, and keybindings.',
      ja: 'Visual Studio Code を支える強力なコードエディタ。高度なシンタックスハイライト、Diffビュー、キーバインドを提供します。',
    },
    url: 'https://github.com/microsoft/monaco-editor',
    licenseUrl: 'https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt',
  },
  {
    name: '@monaco-editor/react',
    package: '@monaco-editor/react',
    version: '^4.7.0',
    license: 'MIT',
    category: 'editor',
    description: {
      en: 'React wrapper component for effortless integration of Monaco Editor in modern React applications.',
      ja: 'Monaco Editor を React アプリケーションにシームレスに統合するための公式ラッパーコンポーネント。',
    },
    url: 'https://github.com/suren-atoyan/monaco-react',
    licenseUrl: 'https://github.com/suren-atoyan/monaco-react/blob/master/LICENSE',
  },
  {
    name: 'React & React DOM',
    package: 'react',
    version: '^19.2.8',
    license: 'MIT',
    category: 'core',
    description: {
      en: 'The foundational library for building fast, declarative, and component-driven user interfaces.',
      ja: 'コンポーネントベースで高速かつ宣言的なユーザーインターフェースを構築するコアライブラリ。',
    },
    url: 'https://react.dev',
    licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
  },
  {
    name: 'Lucide React',
    package: 'lucide-react',
    version: '^1.59.0',
    license: 'ISC',
    category: 'ui',
    description: {
      en: 'An open-source, beautiful, and consistent icon library with hundreds of customizable SVG icons.',
      ja: '美しく洗練されたデザインの一貫性を持つオープンソースのSVGアイコンセット。',
    },
    url: 'https://lucide.dev',
    licenseUrl: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE',
  },
  {
    name: 'Vite',
    package: 'vite',
    version: '^8.3.0',
    license: 'MIT',
    category: 'tooling',
    description: {
      en: 'Next generation, lightning-fast frontend development server and production build tool.',
      ja: '極めて高速な開発サーバーと最適化された本番バンドルを提供する次世代フロントエンド開発ツール。',
    },
    url: 'https://vite.dev',
    licenseUrl: 'https://github.com/vitejs/vite/blob/main/LICENSE',
  },
  {
    name: 'TypeScript',
    package: 'typescript',
    version: '~6.0.2',
    license: 'Apache-2.0',
    category: 'tooling',
    description: {
      en: 'Strongly typed programming language that builds on JavaScript, ensuring reliability and maintainability.',
      ja: 'JavaScript に静的型付けを追加し、大規模開発における堅牢性と保守性を実現する言語。',
    },
    url: 'https://www.typescriptlang.org',
    licenseUrl: 'https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt',
  },
  {
    name: 'Vitest',
    package: 'vitest',
    version: '^5.0.5',
    license: 'MIT',
    category: 'tooling',
    description: {
      en: 'A fast, Vite-native unit testing framework with out-of-the-box TypeScript and ESM support.',
      ja: 'Vite のビルド基盤を活用した高速なユニットテストフレームワーク。',
    },
    url: 'https://vitest.dev',
    licenseUrl: 'https://github.com/vitest-dev/vitest/blob/main/LICENSE',
  },
];

export interface AboutModalLabels {
  title: string;
  tabOverview: string;
  tabLicenses: string;
  viewOnGitHub: string;
  featuresTitle: string;
  librariesTitle: string;
  searchLibrariesPlaceholder: string;
  categoryAll: string;
  categoryCore: string;
  categoryEditor: string;
  categoryUi: string;
  categoryTooling: string;
  version: string;
  license: string;
  website: string;
  close: string;
  privacyNotice: string;
  totalLibraries: (count: number) => string;
}

export function getAboutLabels(locale: string): AboutModalLabels {
  const isJa = locale === 'ja';

  if (isJa) {
    return {
      title: 'WebMerge について',
      tabOverview: '概要 & 特長',
      tabLicenses: 'オープンソースライブラリ',
      viewOnGitHub: 'GitHub で見る',
      featuresTitle: '主な特長 & アーキテクチャ',
      librariesTitle: '使用しているオープンソースソフトウェア (OSS)',
      searchLibrariesPlaceholder: 'ライブラリ名や用途で検索...',
      categoryAll: 'すべて',
      categoryCore: 'コア / フレームワーク',
      categoryEditor: 'エディタ / Diff',
      categoryUi: 'UI / アイコン',
      categoryTooling: 'ビルド / テスト',
      version: 'バージョン',
      license: 'ライセンス',
      website: '公式サイト / リポジトリ',
      close: '閉じる',
      privacyNotice: 'WebMerge は 100% クライアントサイド動作です。ソースコードやデータが外部サーバーへ送信されることは一切ありません。',
      totalLibraries: (count: number) => `全 ${count} 個のライブラリ`,
    };
  }

  return {
    title: 'About WebMerge',
    tabOverview: 'Overview & Features',
    tabLicenses: 'Open Source Notices',
    viewOnGitHub: 'View on GitHub',
    featuresTitle: 'Core Capabilities & Architecture',
    librariesTitle: 'Third-Party Open Source Software',
    searchLibrariesPlaceholder: 'Search libraries or keywords...',
    categoryAll: 'All',
    categoryCore: 'Core / Framework',
    categoryEditor: 'Editor & Diff',
    categoryUi: 'UI & Icons',
    categoryTooling: 'Build & Test',
    version: 'Version',
    license: 'License',
    website: 'Repository / Website',
    close: 'Close',
    privacyNotice: 'WebMerge operates 100% locally in your browser. No files, diffs, or telemetry are ever sent to external servers.',
    totalLibraries: (count: number) => `${count} libraries used`,
  };
}
