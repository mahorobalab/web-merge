import { isPathIgnored } from '../utils/ignoreFilter';
import type { FileEntry } from '../utils/diffMatcher';
import { computeHash } from '../utils/fileHasher';

export interface ScanOptions {
  ignorePatterns?: string[];
  computeHashes?: boolean;
  onProgress?: (scannedCount: number, currentPath: string) => void;
}

// Maximum file size for complete in-memory hashing (50 MB)
const MAX_HASH_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Prompts the user to select a directory using showDirectoryPicker().
 */
export async function openDirectoryWithPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    throw new Error('Your browser does not support the File System Access API (showDirectoryPicker).');
  }

  try {
    const handle = await (window as any).showDirectoryPicker();
    return handle;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

/**
 * Recursively scans a FileSystemDirectoryHandle and collects FileEntry items.
 * Computes SHA-256 hashes off the main thread to enable strict content comparison.
 */
export async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  options: ScanOptions = {}
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const shouldHash = options.computeHashes ?? true;
  let count = 0;

  async function traverse(currentDir: FileSystemDirectoryHandle, currentPath: string) {
    for await (const [name, handle] of (currentDir as any).entries()) {
      const relativePath = currentPath ? `${currentPath}/${name}` : name;

      // Check exclusion filter
      if (isPathIgnored(relativePath, options.ignorePatterns)) {
        continue;
      }

      if (handle.kind === 'directory') {
        await traverse(handle as FileSystemDirectoryHandle, relativePath);
      } else if (handle.kind === 'file') {
        const fileHandle = handle as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        count++;

        if (options.onProgress && count % 5 === 0) {
          options.onProgress(count, relativePath);
        }

        let hash: string | undefined;
        if (shouldHash && file.size <= MAX_HASH_SIZE_BYTES) {
          try {
            hash = await computeHash(file);
          } catch (err) {
            console.warn(`Failed to compute hash for ${relativePath}:`, err);
          }
        }

        entries.push({
          path: relativePath,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          handle: fileHandle,
          hash,
        });
      }
    }
  }

  await traverse(dirHandle, '');
  if (options.onProgress) {
    options.onProgress(count, 'Done');
  }

  return entries;
}

/**
 * Parses a FileList (e.g. from <input type="file" webkitdirectory>) into FileEntry[]
 * Used as a fallback for browsers like Safari and Firefox that do not support directory pickers.
 */
export async function parseFileListAsync(files: FileList, options: ScanOptions = {}): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const shouldHash = options.computeHashes ?? true;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let relativePath = file.webkitRelativePath || file.name;
    const firstSlash = relativePath.indexOf('/');
    if (firstSlash !== -1) {
      relativePath = relativePath.slice(firstSlash + 1);
    }

    if (isPathIgnored(relativePath, options.ignorePatterns)) {
      continue;
    }

    let hash: string | undefined;
    if (shouldHash && file.size <= MAX_HASH_SIZE_BYTES) {
      try {
        hash = await computeHash(file);
      } catch (err) {
        console.warn(`Failed to compute hash for ${relativePath}:`, err);
      }
    }

    entries.push({
      path: relativePath,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      hash,
    });
  }

  return entries;
}

/**
 * Synchronous version for backwards compatibility
 */
export function parseFileList(files: FileList, options: ScanOptions = {}): FileEntry[] {
  const entries: FileEntry[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let relativePath = file.webkitRelativePath || file.name;
    const firstSlash = relativePath.indexOf('/');
    if (firstSlash !== -1) {
      relativePath = relativePath.slice(firstSlash + 1);
    }

    if (isPathIgnored(relativePath, options.ignorePatterns)) {
      continue;
    }

    entries.push({
      path: relativePath,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    });
  }

  return entries;
}
