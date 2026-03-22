'use client';

import { useCallback, useRef } from 'react';
import type { GridItemSize } from '@/lib/types/database';

interface ResizeHandleProps {
  currentSize: GridItemSize;
  onResize: (size: GridItemSize) => void;
}

// Maps size to [colSpan, rowSpan] in the 8-col / 100px-row grid
const SIZE_TO_SPANS: Record<GridItemSize, [number, number]> = {
  'mini': [1, 1],  // 1 micro-col x 1 row = ~100x100
  '1x1': [2, 2],   // 2 micro-cols x 2 rows = ~200x200
  '2x1': [4, 2],   // 4 micro-cols x 2 rows = ~400x200
  '1x2': [2, 4],   // 2 micro-cols x 4 rows = ~200x400
  '2x2': [4, 4],   // 4 micro-cols x 4 rows = ~400x400
};

function spansToSize(cols: number, rows: number): GridItemSize {
  // Snap to nearest valid size based on col/row thresholds
  if (cols <= 1 && rows <= 1) return 'mini';
  if (cols <= 2 && rows <= 2) return '1x1';
  if (cols >= 3 && rows <= 2) return '2x1';
  if (cols <= 2 && rows >= 3) return '1x2';
  return '2x2';
}

export function ResizeHandle({ currentSize, onResize }: ResizeHandleProps) {
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSpans = useRef<[number, number]>([2, 2]);
  const lastEmitted = useRef(currentSize);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSpans.current = SIZE_TO_SPANS[currentSize];
    lastEmitted.current = currentSize;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const handleMove = (ev: PointerEvent) => {
      if (!dragging.current) return;
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;

      // Each micro-cell is ~100px wide + 12px gap
      const cellW = 112;
      const cellH = 112;

      const colDelta = Math.round(dx / cellW);
      const rowDelta = Math.round(dy / cellH);

      const newCols = Math.max(1, startSpans.current[0] + colDelta);
      const newRows = Math.max(1, startSpans.current[1] + rowDelta);
      const newSize = spansToSize(newCols, newRows);

      if (newSize !== lastEmitted.current) {
        lastEmitted.current = newSize;
        onResize(newSize);
      }
    };

    const handleUp = () => {
      dragging.current = false;
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  }, [currentSize, onResize]);

  return (
    <div
      onPointerDown={handlePointerDown}
      className="absolute bottom-1 right-1 z-20 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity touch-none select-none"
      title="Arrastrar para cambiar tamaño"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" className="text-muted-foreground drop-shadow-sm">
        <path
          d="M18 2 L18 18 L2 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 8 L14 14 L8 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
