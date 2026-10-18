import type { FileEntry } from '../utils/diffMatcher';
import { scanDirectoryHandle } from './directoryScanner';
import type { WorkerScanRequest, WorkerScanResponse } from '../workers/scanner.worker';

/**
 * Asynchronously scans a directory off the UI thread.
 * Delegates to a dedicated Web Worker when supported to prevent UI stutter.
 */
export async function scanFolderAsync(
  dirHandle: FileSystemDirectoryHandle,
  side: 'left' | 'right',
  options: {
    ignorePatterns?: string[];
    onProgress?: (count: number, currentPath: string) => void;
  } = {}
): Promise<FileEntry[]> {
  // Check if Web Workers are supported
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
          // Fall back to main thread execution if Worker handle cloning fails
          console.warn('Worker scan encountered an error, falling back to main thread execution:', err);
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
      console.warn('Failed to spawn Worker, running scan on main thread:', e);
      return scanDirectoryHandle(dirHandle, options);
    }
  }

  // Fallback for environments without Worker support
  return scanDirectoryHandle(dirHandle, options);
}
