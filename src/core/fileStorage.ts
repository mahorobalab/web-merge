import { decodeBuffer, type SupportedEncoding } from '../utils/encodingDetector';
import { isImageFileName } from '../utils/imageDetector';

export interface OpenedFile {
  name: string;
  content: string;
  encoding: SupportedEncoding;
  imageUrl?: string;
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
    const isImg = isImageFileName(file.name);
    let content = '';
    let encoding: SupportedEncoding = 'utf-8';
    let imageUrl: string | undefined;

    if (isImg) {
      imageUrl = URL.createObjectURL(file);
    } else {
      const buffer = await file.arrayBuffer();
      const decoded = decodeBuffer(buffer);
      content = decoded.text;
      encoding = decoded.encoding;
    }

    return {
      name: file.name,
      content,
      encoding,
      imageUrl,
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
  const isImg = isImageFileName(file.name);
  let content = '';
  let encoding: SupportedEncoding = 'utf-8';
  let imageUrl: string | undefined;

  if (isImg) {
    imageUrl = URL.createObjectURL(file);
  } else {
    const buffer = await file.arrayBuffer();
    const decoded = decodeBuffer(buffer);
    content = decoded.text;
    encoding = decoded.encoding;
  }

  return {
    name: file.name,
    content,
    encoding,
    imageUrl,
    handle,
    lastModified: file.lastModified,
    size: file.size,
  };
}

/**
 * Reads text content, encoding, or image URL from a FileSystemFileHandle.
 */
export async function readTextFromHandle(
  handle: FileSystemFileHandle
): Promise<{ text: string; encoding: SupportedEncoding; imageUrl?: string }> {
  const file = await handle.getFile();
  if (isImageFileName(file.name)) {
    return {
      text: '',
      encoding: 'utf-8',
      imageUrl: URL.createObjectURL(file),
    };
  }
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
