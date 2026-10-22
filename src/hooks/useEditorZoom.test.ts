import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_EDITOR_FONT_SIZE,
  DEFAULT_EDITOR_LINE_HEIGHT,
  MIN_EDITOR_FONT_SIZE,
  MAX_EDITOR_FONT_SIZE,
  MIN_EDITOR_LINE_HEIGHT,
  MAX_EDITOR_LINE_HEIGHT,
  clampEditorFontSize,
  calculateNextEditorFontSize,
  clampEditorLineHeight,
  calculateNextEditorLineHeight,
} from '../utils/zoomHelper';
import {
  EDITOR_FONT_SIZE_STORAGE_KEY,
  EDITOR_LINE_HEIGHT_STORAGE_KEY,
} from './useEditorZoom';

describe('useEditorZoom logic and helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('clamps editor font size accurately within [9, 28]', () => {
    expect(clampEditorFontSize(13)).toBe(13);
    expect(clampEditorFontSize(1)).toBe(MIN_EDITOR_FONT_SIZE);
    expect(clampEditorFontSize(100)).toBe(MAX_EDITOR_FONT_SIZE);
  });

  it('calculates next editor font size on wheel delta', () => {
    // Scroll up (zoom in)
    expect(calculateNextEditorFontSize(13, -120)).toBe(14);
    // Scroll down (zoom out)
    expect(calculateNextEditorFontSize(13, 120)).toBe(12);
  });

  it('clamps editor line height accurately within [14, 40]', () => {
    expect(clampEditorLineHeight(18)).toBe(18);
    expect(clampEditorLineHeight(5)).toBe(MIN_EDITOR_LINE_HEIGHT);
    expect(clampEditorLineHeight(100)).toBe(MAX_EDITOR_LINE_HEIGHT);
  });

  it('calculates next editor line height on wheel delta', () => {
    // Scroll up (expand spacing)
    expect(calculateNextEditorLineHeight(18, -120)).toBe(19);
    // Scroll down (tighten spacing)
    expect(calculateNextEditorLineHeight(18, 120)).toBe(17);
  });

  it('uses proper storage keys for editor preferences', () => {
    expect(EDITOR_FONT_SIZE_STORAGE_KEY).toBe('webmerge_editor_font_size');
    expect(EDITOR_LINE_HEIGHT_STORAGE_KEY).toBe('webmerge_editor_line_height');
    expect(DEFAULT_EDITOR_FONT_SIZE).toBe(13);
    expect(DEFAULT_EDITOR_LINE_HEIGHT).toBe(18);
  });
});
