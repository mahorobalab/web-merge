export const DEFAULT_TABLE_FONT_SIZE = 13;
export const MIN_TABLE_FONT_SIZE = 9;
export const MAX_TABLE_FONT_SIZE = 24;

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
 * Formats current font size as percentage relative to base size.
 */
export function formatZoomPercentage(fontSize: number, baseSize = DEFAULT_TABLE_FONT_SIZE): string {
  return `${Math.round((fontSize / baseSize) * 100)}%`;
}
