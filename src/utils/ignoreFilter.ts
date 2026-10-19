/**
 * Default patterns for directories and files to exclude from comparison.
 */
export const DEFAULT_IGNORE_PATTERNS = [
  '.git',
  '.git/**',
  'node_modules',
  'node_modules/**',
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
 * Pure function that tests whether a relative path matches any exclusion patterns.
 */
export function isPathIgnored(relativePath: string, ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS): boolean {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\//, '');
  const segments = normalizedPath.split('/');

  for (const pattern of ignorePatterns) {
    const normalizedPattern = pattern.replace(/\\/g, '/').replace(/^\//, '');

    // 1. Exact directory segment match (e.g. "node_modules" or ".git")
    if (segments.includes(normalizedPattern)) {
      return true;
    }

    // 2. Directory prefix wildcard (e.g. ".git/**")
    if (normalizedPattern.endsWith('/**')) {
      const dirPrefix = normalizedPattern.slice(0, -3);
      if (normalizedPath === dirPrefix || normalizedPath.startsWith(dirPrefix + '/')) {
        return true;
      }
    }

    // 3. Extension wildcard (e.g. "*.pyc")
    if (normalizedPattern.startsWith('*.')) {
      const ext = normalizedPattern.slice(1); // ".pyc"
      if (normalizedPath.endsWith(ext)) {
        return true;
      }
    }

    // 4. Exact path match
    if (normalizedPath === normalizedPattern) {
      return true;
    }
  }

  return false;
}
