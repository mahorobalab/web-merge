export interface OpenedFile {
  name: string;
  content: string;
  handle?: FileSystemFileHandle;
  lastModified: number;
  size: number;
}

/**
 * File System Access APIがサポートされているかを判定
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

/**
 * ブラウザのネイティブファイルピッカーを開いてファイルを読み込む
 */
export async function openFileWithPicker(): Promise<OpenedFile | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('お使いのブラウザはFile System Access APIに対応していません。');
  }

  try {
    const [handle] = await (window as any).showOpenFilePicker({
      multiple: false,
    });
    const file = await handle.getFile();
    const content = await file.text();

    return {
      name: file.name,
      content,
      handle,
      lastModified: file.lastModified,
      size: file.size,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // ユーザーキャンセル
    }
    throw err;
  }
}

/**
 * File オブジェクト（D&Dや<input>から取得）からOpenedFileを生成する
 */
export async function readFileObject(file: File, handle?: FileSystemFileHandle): Promise<OpenedFile> {
  const content = await file.text();
  return {
    name: file.name,
    content,
    handle,
    lastModified: file.lastModified,
    size: file.size,
  };
}

/**
 * ファイルハンドルに対して上書き保存を行う
 * 外部でファイルが変更されていた場合は競合を検知する
 */
export async function saveFileWithHandle(
  handle: FileSystemFileHandle,
  content: string,
  expectedLastModified?: number
): Promise<{ success: boolean; conflict?: boolean; newLastModified?: number }> {
  try {
    const currentFile = await handle.getFile();

    // 外部変更チェック
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
    console.error('上書き保存エラー:', err);
    throw err;
  }
}

/**
 * フォールバック用のBlobダウンロード関数
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
