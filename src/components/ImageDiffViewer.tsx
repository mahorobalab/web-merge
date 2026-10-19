import React, { useState } from 'react';
import { Columns, Split, Eye, Layers } from 'lucide-react';
import './ImageDiffViewer.css';

export type ImageDiffMode = 'split' | 'swipe' | 'onion' | 'diff';

interface ImageDiffViewerProps {
  leftName: string;
  leftSrc?: string;
  leftSize?: number;
  rightName: string;
  rightSrc?: string;
  rightSize?: number;
}

export const ImageDiffViewer: React.FC<ImageDiffViewerProps> = ({
  leftName,
  leftSrc,
  leftSize = 0,
  rightName,
  rightSrc,
  rightSize = 0,
}) => {
  const [mode, setMode] = useState<ImageDiffMode>('swipe');
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [opacity, setOpacity] = useState<number>(50); // 0 to 100%

  return (
    <div className="image-diff-viewer">
      {/* Top Mode Toolbar */}
      <div className="image-diff-toolbar">
        <div className="image-diff-mode-group">
          <button
            className={`btn-mode ${mode === 'swipe' ? 'active' : ''}`}
            onClick={() => setMode('swipe')}
            title="Swipe / Slider comparison"
          >
            <Split size={14} /> Swipe
          </button>
          <button
            className={`btn-mode ${mode === 'split' ? 'active' : ''}`}
            onClick={() => setMode('split')}
            title="Side-by-side comparison"
          >
            <Columns size={14} /> Side-by-Side
          </button>
          <button
            className={`btn-mode ${mode === 'onion' ? 'active' : ''}`}
            onClick={() => setMode('onion')}
            title="Onion skin overlay"
          >
            <Eye size={14} /> Onion Skin
          </button>
          <button
            className={`btn-mode ${mode === 'diff' ? 'active' : ''}`}
            onClick={() => setMode('diff')}
            title="Difference blend mode"
          >
            <Layers size={14} /> Difference
          </button>
        </div>

        {/* Dynamic Controls based on Mode */}
        {mode === 'swipe' && (
          <div className="slider-control">
            <span>Swipe: {sliderPos}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
            />
          </div>
        )}

        {mode === 'onion' && (
          <div className="slider-control">
            <span>Opacity: {opacity}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="image-diff-canvas-container">
        {mode === 'split' && (
          <div className="image-diff-split-view">
            <div className="image-pane left">
              <div className="image-pane-header">
                <span className="image-title left">{leftName}</span>
                <span className="image-size">({(leftSize / 1024).toFixed(1)} KB)</span>
              </div>
              <div className="image-wrapper checkerboard">
                {leftSrc ? (
                  <img src={leftSrc} alt={leftName} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
            </div>

            <div className="image-pane right">
              <div className="image-pane-header">
                <span className="image-title right">{rightName}</span>
                <span className="image-size">({(rightSize / 1024).toFixed(1)} KB)</span>
              </div>
              <div className="image-wrapper checkerboard">
                {rightSrc ? (
                  <img src={rightSrc} alt={rightName} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === 'swipe' && (
          <div className="image-diff-swipe-view checkerboard">
            {/* Left Image (Base) */}
            {leftSrc && (
              <img src={leftSrc} alt={leftName} className="swipe-img left" />
            )}

            {/* Right Image (Clipped) */}
            {rightSrc && (
              <div
                className="swipe-right-container"
                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
              >
                <img src={rightSrc} alt={rightName} className="swipe-img right" />
              </div>
            )}

            {/* Divider Handle */}
            <div
              className="swipe-handle"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={(e) => {
                const container = e.currentTarget.parentElement;
                if (!container) return;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  const rect = container.getBoundingClientRect();
                  const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                  setSliderPos(Math.round((x / rect.width) * 100));
                };
                const onMouseUp = () => {
                  window.removeEventListener('mousemove', onMouseMove);
                  window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
              }}
            >
              <div className="handle-line" />
              <div className="handle-knob">⇄</div>
            </div>
          </div>
        )}

        {mode === 'onion' && (
          <div className="image-diff-onion-view checkerboard">
            {leftSrc && <img src={leftSrc} alt={leftName} className="onion-img left" />}
            {rightSrc && (
              <img
                src={rightSrc}
                alt={rightName}
                className="onion-img right"
                style={{ opacity: opacity / 100 }}
              />
            )}
          </div>
        )}

        {mode === 'diff' && (
          <div className="image-diff-blend-view checkerboard">
            {leftSrc && <img src={leftSrc} alt={leftName} className="blend-img left" />}
            {rightSrc && (
              <img
                src={rightSrc}
                alt={rightName}
                className="blend-img right"
                style={{ mixBlendMode: 'difference' }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
