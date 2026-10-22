import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_TABLE_FONT_SIZE,
  DEFAULT_TABLE_ROW_PADDING,
  clampTableFontSize,
  clampTableRowPadding,
  calculateNextFontSize,
  calculateNextRowPadding,
  formatZoomPercentage,
} from '../utils/zoomHelper';

const FONT_SIZE_STORAGE_KEY = 'webmerge_folder_font_size';
const ROW_PADDING_STORAGE_KEY = 'webmerge_folder_row_padding';

export function useTableZoom() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          return clampTableFontSize(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_TABLE_FONT_SIZE;
  });

  const [rowPadding, setRowPadding] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ROW_PADDING_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          return clampTableRowPadding(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_TABLE_ROW_PADDING;
  });

  const resetZoom = useCallback(() => {
    setFontSize(DEFAULT_TABLE_FONT_SIZE);
    setRowPadding(DEFAULT_TABLE_ROW_PADDING);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
    } catch {
      // Ignore localStorage errors
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(ROW_PADDING_STORAGE_KEY, String(rowPadding));
    } catch {
      // Ignore localStorage errors
    }
  }, [rowPadding]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Handle Ctrl + MouseWheel (font size) and Shift + MouseWheel (row height / line spacing)
    const handleWheel = (e: WheelEvent) => {
      // 1. Font Size: Ctrl + MouseWheel
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        setFontSize((prev) => calculateNextFontSize(prev, e.deltaY));
        return;
      }

      // 2. Line Spacing / Row Padding: Shift + MouseWheel
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();

        // Browser compatibility: On Chromium, Shift+Wheel often maps deltaY to deltaX.
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) && e.deltaY !== 0 ? e.deltaY : e.deltaX;
        if (delta !== 0) {
          setRowPadding((prev) => calculateNextRowPadding(prev, delta));
        }
        return;
      }
    };

    // Handle Ctrl+0 keyboard shortcut to reset zoom and line spacing
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        resetZoom();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetZoom]);

  return {
    containerRef,
    fontSize,
    rowPadding,
    resetFontSize: resetZoom,
    resetZoom,
    zoomPercentage: formatZoomPercentage(fontSize),
  };
}

