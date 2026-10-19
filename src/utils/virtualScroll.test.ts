import { describe, it, expect } from 'vitest';
import { calculateVirtualWindow } from './virtualScroll';

describe('virtualScroll', () => {
  it('correctly calculates initial virtual window at scrollTop = 0', () => {
    // 1000 items, each 30px high, container height 300px (10 visible), overscan 3
    const result = calculateVirtualWindow(1000, 30, 300, 0, 3);

    expect(result.totalHeight).toBe(30000);
    expect(result.visibleCount).toBe(10);
    expect(result.startIndex).toBe(0);
    // rawEndIndex = 0 + 10 = 10, plus overscan 3 = 13
    expect(result.endIndex).toBe(13);
    expect(result.offsetY).toBe(0);
  });

  it('shifts window accurately as user scrolls down', () => {
    // Scroll down to 600px (item index 20)
    const result = calculateVirtualWindow(1000, 30, 300, 600, 3);

    // rawStart = 600 / 30 = 20, startIndex = max(0, 20 - 3) = 17
    expect(result.startIndex).toBe(17);
    // rawEnd = 20 + 10 = 30, endIndex = min(999, 30 + 3) = 33
    expect(result.endIndex).toBe(33);
    // offsetY = 17 * 30 = 510
    expect(result.offsetY).toBe(510);
  });

  it('caps endIndex at the end of the list when scrolled to bottom', () => {
    // Scroll to the very bottom: 30000 - 300 = 29700px
    const result = calculateVirtualWindow(1000, 30, 300, 29700, 5);

    expect(result.endIndex).toBe(999);
    expect(result.startIndex).toBeLessThan(999);
  });

  it('handles edge cases with zero items or invalid dimensions gracefully', () => {
    const zeroItems = calculateVirtualWindow(0, 30, 300, 0);
    expect(zeroItems.startIndex).toBe(0);
    expect(zeroItems.endIndex).toBe(-1);
    expect(zeroItems.totalHeight).toBe(0);

    const zeroHeight = calculateVirtualWindow(100, 0, 300, 0);
    expect(zeroHeight.totalHeight).toBe(0);
  });
});
