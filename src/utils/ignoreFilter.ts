/**
 * デフォルトで除外すべきシステムファイル・ディレクトリのパターン一覧
 */
export const DEFAULT_IGNORE_PATTERNS = [
  '.git',
  '.git/**',
  'node_modules',
  'node_modules/**',
  'dist',
  'dist/**',
  'build',
  'build/**',
  '.DS_Store',
  'Thumbs.db',
  '.idea',
  '.idea/**',
  '.vscode',
  '.vscode/**',
  '*.pyc',
  '__pycache__',
  '__pycache__/**',
];

/**
 * 簡単なglobパターン（*や**、先頭一致・完全一致）にマッチするか判定する純粋関数
 */
export function isPathIgnored(relativePath: string, ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS): boolean {
  // パス区切り文字を正規化（Windows対応）
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\//, '');
  const segments = normalizedPath.split('/');

  for (const pattern of ignorePatterns) {
    const normalizedPattern = pattern.replace(/\\/g, '/').replace(/^\//, '');

    // 1. セグメントの完全一致（例: "node_modules" や ".git"）
    if (segments.includes(normalizedPattern)) {
      return true;
    }

    // 2. ディレクトリ配下すべて（例: ".git/**"）
    if (normalizedPattern.endsWith('/**')) {
      const dirPrefix = normalizedPattern.slice(0, -3);
      if (normalizedPath === dirPrefix || normalizedPath.startsWith(dirPrefix + '/')) {
        return true;
      }
    }

    // 3. 拡張子ワイルドカード（例: "*.pyc"）
    if (normalizedPattern.startsWith('*.')) {
      const ext = normalizedPattern.slice(1); // ".pyc"
      if (normalizedPath.endsWith(ext)) {
        return true;
      }
    }

    // 4. パス完全一致
    if (normalizedPath === normalizedPattern) {
      return true;
    }
  }

  return false;
}
