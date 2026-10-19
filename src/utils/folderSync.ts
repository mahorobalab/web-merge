import type { FileEntry } from './diffMatcher';

/**
 * Pure function to update target entries after copying a file or folder from source.
 */
export function updateEntriesAfterCopy(
  sourceEntries: FileEntry[],
  targetEntries: FileEntry[],
  path: string,
  isFolder: boolean = false
): FileEntry[] {
  // Find matching items from source
  const sourceMatches = isFolder
    ? sourceEntries.filter((e) => e.path === path || e.path.startsWith(`${path}/`))
    : sourceEntries.filter((e) => e.path === path);

  if (sourceMatches.length === 0) return targetEntries;

  const targetMap = new Map<string, FileEntry>();
  for (const entry of targetEntries) {
    targetMap.set(entry.path, { ...entry });
  }

  // Insert or update entries in target
  for (const match of sourceMatches) {
    targetMap.set(match.path, { ...match });
  }

  return Array.from(targetMap.values());
}

/**
 * Pure function to update entries after deleting a file or folder.
 */
export function updateEntriesAfterDelete(
  entries: FileEntry[],
  path: string,
  isFolder: boolean = false
): FileEntry[] {
  if (isFolder) {
    return entries.filter((e) => e.path !== path && !e.path.startsWith(`${path}/`));
  }
  return entries.filter((e) => e.path !== path);
}

/**
 * File System Access API helper to copy a file from source handle to target handle.
 */
export async function copyFileBetweenHandles(
  sourceDirHandle: FileSystemDirectoryHandle,
  targetDirHandle: FileSystemDirectoryHandle,
  relativePath: string
): Promise<FileSystemFileHandle> {
  const parts = relativePath.split('/').filter(Boolean);
  const fileName = parts.pop()!;

  // 1. Traverse source directory to reach file
  let currentSourceDir = sourceDirHandle;
  for (const part of parts) {
    currentSourceDir = await currentSourceDir.getDirectoryHandle(part);
  }
  const sourceFileHandle = await currentSourceDir.getFileHandle(fileName);
  const sourceFile = await sourceFileHandle.getFile();
  const buffer = await sourceFile.arrayBuffer();

  // 2. Traverse/create intermediate subdirectories in target
  let currentTargetDir = targetDirHandle;
  for (const part of parts) {
    currentTargetDir = await currentTargetDir.getDirectoryHandle(part, { create: true });
  }

  // 3. Create target file handle and write buffer
  const targetFileHandle = await currentTargetDir.getFileHandle(fileName, { create: true });
  const writable = await targetFileHandle.createWritable();
  await writable.write(buffer);
  await writable.close();

  return targetFileHandle;
}

/**
 * File System Access API helper to copy all files in a folder recursively.
 */
export async function copyFolderBetweenHandles(
  sourceDirHandle: FileSystemDirectoryHandle,
  targetDirHandle: FileSystemDirectoryHandle,
  folderRelativePath: string,
  matchingEntries: FileEntry[]
): Promise<void> {
  const filesUnderFolder = matchingEntries.filter(
    (e) => e.path === folderRelativePath || e.path.startsWith(`${folderRelativePath}/`)
  );

  for (const file of filesUnderFolder) {
    await copyFileBetweenHandles(sourceDirHandle, targetDirHandle, file.path);
  }
}

/**
 * File System Access API helper to delete an entry (file or folder) from a directory handle.
 */
export async function deleteEntryFromHandle(
  rootDirHandle: FileSystemDirectoryHandle,
  relativePath: string,
  isFolder: boolean = false
): Promise<void> {
  const parts = relativePath.split('/').filter(Boolean);
  const entryName = parts.pop()!;

  let currentDir = rootDirHandle;
  for (const part of parts) {
    currentDir = await currentDir.getDirectoryHandle(part);
  }

  await currentDir.removeEntry(entryName, { recursive: isFolder });
}
