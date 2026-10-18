import { scanDirectoryHandle } from '../core/directoryScanner';

export type WorkerScanRequest = {
  id: string;
  side: 'left' | 'right';
  dirHandle: FileSystemDirectoryHandle;
  ignorePatterns?: string[];
};

export type WorkerScanResponse =
  | { type: 'PROGRESS'; id: string; side: 'left' | 'right'; count: number; currentPath: string }
  | { type: 'COMPLETE'; id: string; side: 'left' | 'right'; entries: any[] }
  | { type: 'ERROR'; id: string; side: 'left' | 'right'; error: string };

self.onmessage = async (e: MessageEvent<WorkerScanRequest>) => {
  const { id, side, dirHandle, ignorePatterns } = e.data;

  try {
    const entries = await scanDirectoryHandle(dirHandle, {
      ignorePatterns,
      onProgress: (count, currentPath) => {
        const msg: WorkerScanResponse = {
          type: 'PROGRESS',
          id,
          side,
          count,
          currentPath,
        };
        self.postMessage(msg);
      },
    });

    const completeMsg: WorkerScanResponse = {
      type: 'COMPLETE',
      id,
      side,
      entries,
    };
    self.postMessage(completeMsg);
  } catch (err: any) {
    const errorMsg: WorkerScanResponse = {
      type: 'ERROR',
      id,
      side,
      error: err.message || 'フォルダ走査中にエラーが発生しました',
    };
    self.postMessage(errorMsg);
  }
};
