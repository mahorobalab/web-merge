import { isPathIgnored } from '../utils/ignoreFilter';
import type { FileEntry } from '../utils/diffMatcher';

export interface ScanOptions {
  ignorePatterns?: string[];
  onProgress?: (scannedCount: number, currentPath: string) => void;
}

/**
 * showDirectoryPicker() を開いてディレクトリハンドルを取得する
 */
export async function openDirectoryWithPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    throw new Error('お使いのブラウザはフォルダ選択API(showDirectoryPicker)に対応していません。');
  }

  try {
    const handle = await (window as any).showDirectoryPicker();
    return handle;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // ユーザーキャンセル
    }
    throw err;
  }
}

/**
 * FileSystemDirectoryHandle を再帰走査して FileEntry[] を収集する
 * ※ メモリ防衛のため、本文(テキスト)は読み込まずメタデータとハンドルのみを保持
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

      // 除外判定
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
    options.onProgress(count, '完了');
  }

  return entries;
}

/**
 * <input type="file" webkitdirectory> 等の FileList から FileEntry[] を生成する（Safari等のフォールバック用）
 */
export function parseFileList(files: FileList, options: ScanOptions = {}): FileEntry[] {
  const entries: FileEntry[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // webkitRelativePath は "folderName/sub/file.txt" の形式
    let relativePath = file.webkitRelativePath || file.name;
    // 最初のフォルダ名を取り除く（例: "folderA/src/index.ts" -> "src/index.ts"）
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
