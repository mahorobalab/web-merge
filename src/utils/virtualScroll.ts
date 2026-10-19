export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  visibleCount: number;
}

/**
 * Pure function that calculates the visible index range and scroll offsets
 * for fixed-height virtual list rendering.
 *
 * @param totalCount Total number of items in the list
 * @param itemHeight Fixed height of each item in pixels
 * @param containerHeight Viewport container height in pixels
 * @param scrollTop Current scroll top offset in pixels
 * @param overscan Number of additional items to render above and below the visible window
 */
export function calculateVirtualWindow(
  totalCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan = 5
): VirtualWindow {
  if (totalCount <= 0 || itemHeight <= 0 || containerHeight <= 0) {
    return {
      startIndex: 0,
      endIndex: -1,
      totalHeight: 0,
      offsetY: 0,
      visibleCount: 0,
    };
  }

  const safeScrollTop = Math.max(0, scrollTop);
  const totalHeight = totalCount * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const rawStartIndex = Math.floor(safeScrollTop / itemHeight);
  const startIndex = Math.max(0, rawStartIndex - overscan);

  const rawEndIndex = rawStartIndex + visibleCount;
  const endIndex = Math.min(totalCount - 1, rawEndIndex + overscan);

  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleCount,
  };
}
