import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_TABLE_FONT_SIZE,
  clampTableFontSize,
  calculateNextFontSize,
  formatZoomPercentage,
} from '../utils/zoomHelper';

const STORAGE_KEY = 'webmerge_folder_font_size';

export function useTableZoom() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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

  const resetFontSize = useCallback(() => {
    setFontSize(DEFAULT_TABLE_FONT_SIZE);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(fontSize));
    } catch {
      // Ignore localStorage errors
    }
  }, [fontSize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Handle Ctrl + MouseWheel zoom without triggering browser page zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        setFontSize((prev) => calculateNextFontSize(prev, e.deltaY));
      }
    };

    // Handle Ctrl+0 keyboard shortcut to reset zoom
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        resetFontSize();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetFontSize]);

  return {
    containerRef,
    fontSize,
    resetFontSize,
    zoomPercentage: formatZoomPercentage(fontSize),
  };
}
