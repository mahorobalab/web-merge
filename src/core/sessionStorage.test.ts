import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveSession,
  loadSession,
  clearSession,
  verifyHandlePermission,
  type PersistedSession,
} from './sessionStorage';

describe('sessionStorage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyHandlePermission', () => {
    it('returns false if handle is invalid or lacks permission methods', async () => {
      expect(await verifyHandlePermission(null as any)).toBe(false);
      expect(await verifyHandlePermission({} as any)).toBe(false);
    });

    it('returns true if queryPermission already returns granted', async () => {
      const mockHandle = {
        queryPermission: vi.fn().mockResolvedValue('granted'),
        requestPermission: vi.fn(),
      } as unknown as FileSystemHandle;

      const result = await verifyHandlePermission(mockHandle);
      expect(result).toBe(true);
      expect((mockHandle as any).queryPermission).toHaveBeenCalledWith({ mode: 'read' });
      expect((mockHandle as any).requestPermission).not.toHaveBeenCalled();
    });

    it('requests permission if queryPermission returns prompt, and returns true if user grants', async () => {
      const mockHandle = {
        queryPermission: vi.fn().mockResolvedValue('prompt'),
        requestPermission: vi.fn().mockResolvedValue('granted'),
      } as unknown as FileSystemHandle;

      const result = await verifyHandlePermission(mockHandle, 'read');
      expect(result).toBe(true);
      expect((mockHandle as any).requestPermission).toHaveBeenCalledWith({ mode: 'read' });
    });

    it('returns false if user denies permission request', async () => {
      const mockHandle = {
        queryPermission: vi.fn().mockResolvedValue('prompt'),
        requestPermission: vi.fn().mockResolvedValue('denied'),
      } as unknown as FileSystemHandle;

      const result = await verifyHandlePermission(mockHandle, 'read');
      expect(result).toBe(false);
    });
  });

  describe('session operations in non-indexedDB environments', () => {
    it('gracefully handles missing window/indexedDB without throwing errors', async () => {
      // In Node.js testing environment window.indexedDB may not be defined
      const mockSession: PersistedSession = {
        tabs: [],
        activeTabId: null,
        savedAt: Date.now(),
      };

      await expect(saveSession(mockSession)).resolves.toBeUndefined();
      const loaded = await loadSession();
      expect(loaded).toBeNull();
      await expect(clearSession()).resolves.toBeUndefined();
    });
  });
});
