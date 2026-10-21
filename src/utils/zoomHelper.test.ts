import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TABLE_FONT_SIZE,
  MIN_TABLE_FONT_SIZE,
  MAX_TABLE_FONT_SIZE,
  clampTableFontSize,
  calculateNextFontSize,
  formatZoomPercentage,
} from './zoomHelper';

describe('zoomHelper', () => {
  describe('clampTableFontSize', () => {
    it('keeps font size within min and max boundaries', () => {
      expect(clampTableFontSize(13)).toBe(13);
      expect(clampTableFontSize(5)).toBe(MIN_TABLE_FONT_SIZE);
      expect(clampTableFontSize(35)).toBe(MAX_TABLE_FONT_SIZE);
      expect(clampTableFontSize(MIN_TABLE_FONT_SIZE)).toBe(MIN_TABLE_FONT_SIZE);
      expect(clampTableFontSize(MAX_TABLE_FONT_SIZE)).toBe(MAX_TABLE_FONT_SIZE);
    });
  });

  describe('calculateNextFontSize', () => {
    it('increases font size on negative deltaY (scroll up / zoom in)', () => {
      expect(calculateNextFontSize(13, -100)).toBe(14);
      expect(calculateNextFontSize(MAX_TABLE_FONT_SIZE, -100)).toBe(MAX_TABLE_FONT_SIZE);
    });

    it('decreases font size on positive deltaY (scroll down / zoom out)', () => {
      expect(calculateNextFontSize(13, 100)).toBe(12);
      expect(calculateNextFontSize(MIN_TABLE_FONT_SIZE, 100)).toBe(MIN_TABLE_FONT_SIZE);
    });
  });

  describe('formatZoomPercentage', () => {
    it('calculates formatted percentage accurately', () => {
      expect(formatZoomPercentage(DEFAULT_TABLE_FONT_SIZE)).toBe('100%');
      expect(formatZoomPercentage(26, 13)).toBe('200%');
      expect(formatZoomPercentage(10, 13)).toBe('77%');
    });
  });
});
