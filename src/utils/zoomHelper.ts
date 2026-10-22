export const DEFAULT_TABLE_FONT_SIZE = 13;
export const MIN_TABLE_FONT_SIZE = 9;
export const MAX_TABLE_FONT_SIZE = 24;

export const DEFAULT_TABLE_ROW_PADDING = 3;
export const MIN_TABLE_ROW_PADDING = 1;
export const MAX_TABLE_ROW_PADDING = 16;

// Editor (Monaco DiffEditor) zoom & line-height constants
export const DEFAULT_EDITOR_FONT_SIZE = 13;
export const MIN_EDITOR_FONT_SIZE = 9;
export const MAX_EDITOR_FONT_SIZE = 28;

export const DEFAULT_EDITOR_LINE_HEIGHT = 18;
export const MIN_EDITOR_LINE_HEIGHT = 14;
export const MAX_EDITOR_LINE_HEIGHT = 40;

/**
 * Clamps table font size within predefined limits.
 */
export function clampTableFontSize(size: number): number {
  return Math.min(MAX_TABLE_FONT_SIZE, Math.max(MIN_TABLE_FONT_SIZE, size));
}

/**
 * Calculates next font size based on mouse wheel delta.
 * Scrolling up (negative deltaY) zooms in (+1px).
 * Scrolling down (positive deltaY) zooms out (-1px).
 */
export function calculateNextFontSize(currentSize: number, deltaY: number): number {
  const step = deltaY < 0 ? 1 : -1;
  return clampTableFontSize(currentSize + step);
}

/**
 * Clamps table row vertical padding within predefined limits (1px to 16px).
 */
export function clampTableRowPadding(padding: number): number {
  return Math.min(MAX_TABLE_ROW_PADDING, Math.max(MIN_TABLE_ROW_PADDING, padding));
}

/**
 * Calculates next row vertical padding based on mouse wheel delta.
 * Scrolling up (negative delta) expands line spacing (+1px).
 * Scrolling down (positive delta) compacts line spacing (-1px).
 */
export function calculateNextRowPadding(currentPadding: number, delta: number): number {
  const step = delta < 0 ? 1 : -1;
  return clampTableRowPadding(currentPadding + step);
}

/**
 * Clamps editor font size within predefined limits.
 */
export function clampEditorFontSize(size: number): number {
  return Math.min(MAX_EDITOR_FONT_SIZE, Math.max(MIN_EDITOR_FONT_SIZE, size));
}

/**
 * Calculates next editor font size based on mouse wheel delta.
 */
export function calculateNextEditorFontSize(currentSize: number, deltaY: number): number {
  const step = deltaY < 0 ? 1 : -1;
  return clampEditorFontSize(currentSize + step);
}

/**
 * Clamps editor line height within predefined limits.
 */
export function clampEditorLineHeight(height: number): number {
  return Math.min(MAX_EDITOR_LINE_HEIGHT, Math.max(MIN_EDITOR_LINE_HEIGHT, height));
}

/**
 * Calculates next editor line height based on mouse wheel delta.
 * Scrolling up (negative delta) expands line spacing (+1px).
 * Scrolling down (positive delta) tightens line spacing (-1px).
 */
export function calculateNextEditorLineHeight(currentHeight: number, delta: number): number {
  const step = delta < 0 ? 1 : -1;
  return clampEditorLineHeight(currentHeight + step);
}

/**
 * Formats current font size as percentage relative to base size.
 */
export function formatZoomPercentage(fontSize: number, baseSize = DEFAULT_TABLE_FONT_SIZE): string {
  return `${Math.round((fontSize / baseSize) * 100)}%`;
}


