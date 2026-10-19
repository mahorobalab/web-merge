import { describe, it, expect } from 'vitest';
import { isImageFileName, getImageMimeType } from './imageDetector';

describe('imageDetector', () => {
  describe('isImageFileName', () => {
    it('identifies image extensions accurately', () => {
      expect(isImageFileName('logo.png')).toBe(true);
      expect(isImageFileName('photo.JPG')).toBe(true);
      expect(isImageFileName('banner.jpeg')).toBe(true);
      expect(isImageFileName('anim.gif')).toBe(true);
      expect(isImageFileName('icon.webp')).toBe(true);
      expect(isImageFileName('vector.svg')).toBe(true);
      expect(isImageFileName('favicon.ico')).toBe(true);
      expect(isImageFileName('artwork.bmp')).toBe(true);
    });

    it('rejects non-image files', () => {
      expect(isImageFileName('code.ts')).toBe(false);
      expect(isImageFileName('style.css')).toBe(false);
      expect(isImageFileName('README.md')).toBe(false);
      expect(isImageFileName('data.json')).toBe(false);
      expect(isImageFileName('script.js')).toBe(false);
      expect(isImageFileName('')).toBe(false);
    });
  });

  describe('getImageMimeType', () => {
    it('returns correct mime type for file names', () => {
      expect(getImageMimeType('test.png')).toBe('image/png');
      expect(getImageMimeType('test.jpg')).toBe('image/jpeg');
      expect(getImageMimeType('test.svg')).toBe('image/svg+xml');
      expect(getImageMimeType('test.webp')).toBe('image/webp');
      expect(getImageMimeType('test.unknown')).toBe('application/octet-stream');
    });
  });
});
