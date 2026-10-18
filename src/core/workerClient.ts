import type { FileEntry } from '../utils/diffMatcher';
import { scanDirectoryHandle } from './directoryScanner';
import type { WorkerScanRequest, WorkerScanResponse } from '../workers/scanner.worker';

/**
 * ディレクトリを非同期走査するクライアント関数
 * Web Workerが利用可能な場合はWorkerへ委譲し、UIスレッドをブロックしない
 */
export async function scanFolderAsync(
  dirHandle: FileSystemDirectoryHandle,
  side: 'left' | 'right',
  options: {
    ignorePatterns?: string[];
    onProgress?: (count: number, currentPath: string) => void;
  } = {}
): Promise<FileEntry[]> {
  // Web Worker の利用可否を判定
  if (typeof Worker !== 'undefined') {
    try {
      return await new Promise<FileEntry[]>((resolve, reject) => {
        const worker = new Worker(new URL('../workers/scanner.worker.ts', import.meta.url), {
          type: 'module',
        });
        const id = `${side}-${Date.now()}`;

        worker.onmessage = (e: MessageEvent<WorkerScanResponse>) => {
          const res = e.data;
          if (res.id !== id) return;

          if (res.type === 'PROGRESS') {
            options.onProgress?.(res.count, res.currentPath);
          } else if (res.type === 'COMPLETE') {
            worker.terminate();
            resolve(res.entries);
          } else if (res.type === 'ERROR') {
            worker.terminate();
            reject(new Error(res.error));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          // Worker内での転送エラー等の場合はメインスレッドフォールバックへ
          console.warn('Workerスキャンでエラーが発生したため、メインスレッドでフォールバック実行します:', err);
          scanDirectoryHandle(dirHandle, options).then(resolve).catch(reject);
        };

        const req: WorkerScanRequest = {
          id,
          side,
          dirHandle,
          ignorePatterns: options.ignorePatterns,
        };

        worker.postMessage(req);
      });
    } catch (e) {
      console.warn('Workerの起動に失敗したため、メインスレッドで走査します:', e);
      return scanDirectoryHandle(dirHandle, options);
    }
  }

  // Worker非対応環境
  return scanDirectoryHandle(dirHandle, options);
}
