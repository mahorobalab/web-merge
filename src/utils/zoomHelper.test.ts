import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TABLE_FONT_SIZE,
  MIN_TABLE_FONT_SIZE,
  MAX_TABLE_FONT_SIZE,
  DEFAULT_TABLE_ROW_PADDING,
  MIN_TABLE_ROW_PADDING,
  MAX_TABLE_ROW_PADDING,
  clampTableFontSize,
  calculateNextFontSize,
  clampTableRowPadding,
  calculateNextRowPadding,
  DEFAULT_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  MAX_EDITOR_FONT_SIZE,
  DEFAULT_EDITOR_LINE_HEIGHT,
  MIN_EDITOR_LINE_HEIGHT,
  MAX_EDITOR_LINE_HEIGHT,
  clampEditorFontSize,
  calculateNextEditorFontSize,
  clampEditorLineHeight,
  calculateNextEditorLineHeight,
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

  describe('clampTableRowPadding', () => {
    it('keeps row padding within min and max boundaries', () => {
      expect(clampTableRowPadding(DEFAULT_TABLE_ROW_PADDING)).toBe(DEFAULT_TABLE_ROW_PADDING);
      expect(clampTableRowPadding(3)).toBe(3);
      expect(clampTableRowPadding(0)).toBe(MIN_TABLE_ROW_PADDING);
      expect(clampTableRowPadding(25)).toBe(MAX_TABLE_ROW_PADDING);
      expect(clampTableRowPadding(MIN_TABLE_ROW_PADDING)).toBe(MIN_TABLE_ROW_PADDING);
      expect(clampTableRowPadding(MAX_TABLE_ROW_PADDING)).toBe(MAX_TABLE_ROW_PADDING);
    });
  });

  describe('calculateNextRowPadding', () => {
    it('increases row padding on negative delta (scroll up / expand spacing)', () => {
      expect(calculateNextRowPadding(3, -100)).toBe(4);
      expect(calculateNextRowPadding(MAX_TABLE_ROW_PADDING, -100)).toBe(MAX_TABLE_ROW_PADDING);
    });

    it('decreases row padding on positive delta (scroll down / compact spacing)', () => {
      expect(calculateNextRowPadding(3, 100)).toBe(2);
      expect(calculateNextRowPadding(MIN_TABLE_ROW_PADDING, 100)).toBe(MIN_TABLE_ROW_PADDING);
    });
  });

  describe('clampEditorFontSize', () => {
    it('keeps editor font size within min and max boundaries', () => {
      expect(clampEditorFontSize(DEFAULT_EDITOR_FONT_SIZE)).toBe(DEFAULT_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize(5)).toBe(MIN_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize(40)).toBe(MAX_EDITOR_FONT_SIZE);
    });
  });

  describe('calculateNextEditorFontSize', () => {
    it('increases and decreases font size based on wheel delta', () => {
      expect(calculateNextEditorFontSize(13, -100)).toBe(14);
      expect(calculateNextEditorFontSize(13, 100)).toBe(12);
      expect(calculateNextEditorFontSize(MAX_EDITOR_FONT_SIZE, -100)).toBe(MAX_EDITOR_FONT_SIZE);
      expect(calculateNextEditorFontSize(MIN_EDITOR_FONT_SIZE, 100)).toBe(MIN_EDITOR_FONT_SIZE);
    });
  });

  describe('clampEditorLineHeight', () => {
    it('keeps editor line height within min and max boundaries', () => {
      expect(clampEditorLineHeight(DEFAULT_EDITOR_LINE_HEIGHT)).toBe(DEFAULT_EDITOR_LINE_HEIGHT);
      expect(clampEditorLineHeight(5)).toBe(MIN_EDITOR_LINE_HEIGHT);
      expect(clampEditorLineHeight(50)).toBe(MAX_EDITOR_LINE_HEIGHT);
    });
  });

  describe('calculateNextEditorLineHeight', () => {
    it('increases on scroll up and decreases on scroll down', () => {
      expect(calculateNextEditorLineHeight(18, -100)).toBe(19);
      expect(calculateNextEditorLineHeight(18, 100)).toBe(17);
      expect(calculateNextEditorLineHeight(MAX_EDITOR_LINE_HEIGHT, -100)).toBe(MAX_EDITOR_LINE_HEIGHT);
      expect(calculateNextEditorLineHeight(MIN_EDITOR_LINE_HEIGHT, 100)).toBe(MIN_EDITOR_LINE_HEIGHT);
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

