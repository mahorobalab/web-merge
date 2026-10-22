import type { AppTab, FileState } from '../types/app';
import type { FileEntry } from '../utils/diffMatcher';

export interface PersistedFolderCompareState {
  leftFolderName: string;
  rightFolderName: string;
  leftEntries: FileEntry[];
  rightEntries: FileEntry[];
  leftDirHandle?: FileSystemDirectoryHandle | null;
  rightDirHandle?: FileSystemDirectoryHandle | null;
}

export interface PersistedSession {
  tabs: AppTab[];
  activeTabId: string | null;
  folderCompare?: PersistedFolderCompareState;
  activeLeftFile?: FileState;
  activeRightFile?: FileState;
  savedAt: number;
}

const DB_NAME = 'WebMergeDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessionStore';
const SESSION_KEY = 'current_session';

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Saves current tabs, active files, and folder comparison state into IndexedDB.
 * Supports storing native FileSystemDirectoryHandle and FileSystemFileHandle via Structured Clone.
 */
export async function saveSession(session: PersistedSession): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(session, SESSION_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Loads previously saved session from IndexedDB.
 */
export async function loadSession(): Promise<PersistedSession | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(SESSION_KEY);

      req.onsuccess = () => {
        resolve((req.result as PersistedSession) || null);
      };
      req.onerror = () => reject(req.error);
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Clears saved session from IndexedDB.
 */
export async function clearSession(): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(SESSION_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Verifies or prompts the user for read/readwrite permission on a stored FileSystemHandle.
 * Browsers require explicit user gesture to grant permission on handles restored from IndexedDB.
 */
export async function verifyHandlePermission(
  handle: FileSystemHandle,
  mode: 'read' | 'readwrite' = 'read'
): Promise<boolean> {
  if (!handle || typeof (handle as any).queryPermission !== 'function') {
    return false;
  }
  try {
    const opts = { mode };
    const current = await (handle as any).queryPermission(opts);
    if (current === 'granted') {
      return true;
    }
    const requested = await (handle as any).requestPermission(opts);
    return requested === 'granted';
  } catch (err) {
    console.warn('Failed to verify or request permission for handle:', err);
    return false;
  }
}
