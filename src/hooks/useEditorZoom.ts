import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_EDITOR_FONT_SIZE,
  DEFAULT_EDITOR_LINE_HEIGHT,
  clampEditorFontSize,
  clampEditorLineHeight,
  calculateNextEditorFontSize,
  calculateNextEditorLineHeight,
  formatZoomPercentage,
} from '../utils/zoomHelper';

export const EDITOR_FONT_SIZE_STORAGE_KEY = 'webmerge_editor_font_size';
export const EDITOR_LINE_HEIGHT_STORAGE_KEY = 'webmerge_editor_line_height';

export interface UseEditorZoomOptions {
  diffEditorRef?: React.RefObject<any>;
}

export function useEditorZoom(options: UseEditorZoomOptions = {}) {
  const { diffEditorRef } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(EDITOR_FONT_SIZE_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          return clampEditorFontSize(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_EDITOR_FONT_SIZE;
  });

  const [lineHeight, setLineHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(EDITOR_LINE_HEIGHT_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          return clampEditorLineHeight(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_EDITOR_LINE_HEIGHT;
  });

  const resetZoom = useCallback(() => {
    setFontSize(DEFAULT_EDITOR_FONT_SIZE);
    setLineHeight(DEFAULT_EDITOR_LINE_HEIGHT);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(EDITOR_FONT_SIZE_STORAGE_KEY, String(fontSize));
    } catch {
      // Ignore storage errors
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(EDITOR_LINE_HEIGHT_STORAGE_KEY, String(lineHeight));
    } catch {
      // Ignore storage errors
    }
  }, [lineHeight]);

  // Synchronize options with Monaco Editor instance if mounted
  useEffect(() => {
    if (!diffEditorRef?.current) return;
    try {
      const orig = diffEditorRef.current.getOriginalEditor?.();
      const mod = diffEditorRef.current.getModifiedEditor?.();
      orig?.updateOptions?.({ fontSize, lineHeight });
      mod?.updateOptions?.({ fontSize, lineHeight });
    } catch {
      // Ignore editor update errors
    }
  }, [fontSize, lineHeight, diffEditorRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Handle Ctrl + Wheel (font size) and Shift + Wheel (line spacing)
    // Note: We attach in the capture phase to intercept BEFORE Monaco's internal wheel listeners
    const handleWheel = (e: WheelEvent) => {
      // 1. Shift + Wheel: Line spacing (行間)
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();

        // Browser compatibility: On Chromium, Shift+Wheel often converts deltaY to deltaX.
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) && e.deltaY !== 0 ? e.deltaY : e.deltaX;
        if (delta !== 0) {
          setLineHeight((prev) => calculateNextEditorLineHeight(prev, delta));
        }
        return;
      }

      // 2. Ctrl + Wheel: Font size
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        setFontSize((prev) => calculateNextEditorFontSize(prev, e.deltaY));
        return;
      }
    };

    // Handle Ctrl+0 keyboard shortcut to reset zoom & line spacing
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        resetZoom();
      }
    };

    el.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetZoom]);

  return {
    containerRef,
    fontSize,
    lineHeight,
    resetZoom,
    zoomPercentage: formatZoomPercentage(fontSize, DEFAULT_EDITOR_FONT_SIZE),
  };
}
