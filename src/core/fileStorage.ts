import { decodeBuffer, type SupportedEncoding } from '../utils/encodingDetector';

export interface OpenedFile {
  name: string;
  content: string;
  encoding: SupportedEncoding;
  handle?: FileSystemFileHandle;
  lastModified: number;
  size: number;
}

/**
 * Checks whether the File System Access API is supported in the current environment.
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

/**
 * Opens the native file picker to read a local file with auto character encoding detection.
 */
export async function openFileWithPicker(): Promise<OpenedFile | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Your browser does not support the File System Access API.');
  }

  try {
    const [handle] = await (window as any).showOpenFilePicker({
      multiple: false,
    });
    const file = await handle.getFile();
    const buffer = await file.arrayBuffer();
    const { text: content, encoding } = decodeBuffer(buffer);

    return {
      name: file.name,
      content,
      encoding,
      handle,
      lastModified: file.lastModified,
      size: file.size,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

/**
 * Creates an OpenedFile object from a File instance with auto character encoding detection.
 */
export async function readFileObject(file: File, handle?: FileSystemFileHandle): Promise<OpenedFile> {
  const buffer = await file.arrayBuffer();
  const { text: content, encoding } = decodeBuffer(buffer);

  return {
    name: file.name,
    content,
    encoding,
    handle,
    lastModified: file.lastModified,
    size: file.size,
  };
}

/**
 * Reads text content and encoding from a FileSystemFileHandle.
 */
export async function readTextFromHandle(handle: FileSystemFileHandle): Promise<{ text: string; encoding: SupportedEncoding }> {
  const file = await handle.getFile();
  const buffer = await file.arrayBuffer();
  return decodeBuffer(buffer);
}

/**
 * Saves content directly back to a FileSystemFileHandle.
 * Detects conflicts if the file was modified externally.
 */
export async function saveFileWithHandle(
  handle: FileSystemFileHandle,
  content: string,
  expectedLastModified?: number
): Promise<{ success: boolean; conflict?: boolean; newLastModified?: number }> {
  try {
    const currentFile = await handle.getFile();

    // Check for external file modifications
    if (expectedLastModified && currentFile.lastModified !== expectedLastModified) {
      return { success: false, conflict: true };
    }

    const writable = await (handle as any).createWritable();
    await writable.write(content);
    await writable.close();

    const updatedFile = await handle.getFile();
    return {
      success: true,
      newLastModified: updatedFile.lastModified,
    };
  } catch (err) {
    console.error('File save error:', err);
    throw err;
  }
}

/**
 * Fallback download function for browsers without write access or for D&D files without handles.
 */
export function downloadFileContent(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
