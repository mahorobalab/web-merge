import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportFileWithPicker, downloadFileContent } from './fileStorage';

describe('fileStorage export utilities', () => {
  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;
  const originalURL = (globalThis as any).URL;
  const originalBlob = (globalThis as any).Blob;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
    (globalThis as any).URL = originalURL;
    (globalThis as any).Blob = originalBlob;
  });

  describe('exportFileWithPicker', () => {
    it('uses showSaveFilePicker when available in window', async () => {
      const mockWritable = {
        write: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const mockHandle = {
        name: 'custom_report.html',
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      };

      const mockWindow = {
        showSaveFilePicker: vi.fn().mockResolvedValue(mockHandle),
      };
      (globalThis as any).window = mockWindow;

      const result = await exportFileWithPicker('<html>test</html>', 'report.html', {
        description: 'HTML Diff Report',
        mimeType: 'text/html;charset=utf-8',
        extension: '.html',
      });

      expect(mockWindow.showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'report.html',
        types: [
          {
            description: 'HTML Diff Report',
            accept: {
              'text/html': ['.html'],
            },
          },
        ],
      });
      expect(mockWritable.write).toHaveBeenCalledWith('<html>test</html>');
      expect(mockWritable.close).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        fileName: 'custom_report.html',
        handle: mockHandle,
      });
    });

    it('handles user cancellation (AbortError) gracefully', async () => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';

      (globalThis as any).window = {
        showSaveFilePicker: vi.fn().mockRejectedValue(abortError),
      };

      const result = await exportFileWithPicker('dummy', 'test.patch');
      expect(result).toEqual({
        success: false,
        canceled: true,
        fileName: 'test.patch',
      });
    });

    it('falls back to downloadFileContent when showSaveFilePicker is not present', async () => {
      const clickSpy = vi.fn();
      const mockAnchor: any = {
        style: {},
        click: clickSpy,
      };

      (globalThis as any).window = {};
      (globalThis as any).document = {
        createElement: vi.fn().mockReturnValue(mockAnchor),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          contains: vi.fn().mockReturnValue(true),
        },
      };
      (globalThis as any).URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
        revokeObjectURL: vi.fn(),
      };
      (globalThis as any).Blob = class MockBlob {
        parts: any[];
        opts: any;
        constructor(parts: any[], opts: any) {
          this.parts = parts;
          this.opts = opts;
        }
      };

      const result = await exportFileWithPicker('patch content', 'diff.patch');
      expect(result).toEqual({
        success: true,
        fileName: 'diff.patch',
      });
      expect((globalThis as any).document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
      expect(clickSpy).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('diff.patch');
    });
  });

  describe('downloadFileContent', () => {
    it('creates an anchor tag with correct download filename and clicks it', () => {
      const clickSpy = vi.fn();
      const mockAnchor: any = {
        style: {},
        click: clickSpy,
      };

      (globalThis as any).document = {
        createElement: vi.fn().mockReturnValue(mockAnchor),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          contains: vi.fn().mockReturnValue(true),
        },
      };
      (globalThis as any).URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:mock-blob-url'),
        revokeObjectURL: vi.fn(),
      };
      (globalThis as any).Blob = class MockBlob {
        parts: any[];
        opts: any;
        constructor(parts: any[], opts: any) {
          this.parts = parts;
          this.opts = opts;
        }
      };

      downloadFileContent('webmerge_report.html', '<h1>Diff</h1>', 'text/html;charset=utf-8');

      expect(mockAnchor.download).toBe('webmerge_report.html');
      expect(mockAnchor.href).toBe('blob:mock-blob-url');
      expect(mockAnchor.style.display).toBe('none');
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
