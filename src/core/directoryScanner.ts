import { isPathIgnored } from '../utils/ignoreFilter';
import type { FileEntry } from '../utils/diffMatcher';

export interface ScanOptions {
  ignorePatterns?: string[];
  onProgress?: (scannedCount: number, currentPath: string) => void;
}

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
 * Note: To guard against browser tab memory limits, file contents are not loaded
 * into memory during scanning; only metadata and handles are retained.
 */
export async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  options: ScanOptions = {}
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
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

        entries.push({
          path: relativePath,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          handle: fileHandle,
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
export function parseFileList(files: FileList, options: ScanOptions = {}): FileEntry[] {
  const entries: FileEntry[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // webkitRelativePath format is "rootFolder/sub/file.txt"
    let relativePath = file.webkitRelativePath || file.name;
    // Strip root directory name to get relative project path
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
