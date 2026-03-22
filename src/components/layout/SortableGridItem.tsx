'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { CardActions } from '@/components/ui/CardActions';
import { ResizeHandle } from '@/components/ui/ResizeHandle';
import type { GridItemSize } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface SortableGridItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  currentSize?: GridItemSize;
  onResize?: (size: GridItemSize) => void;
}

export function SortableGridItem({ id, children, className, onEdit, onDelete, currentSize, onResize }: SortableGridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 z-50',
        className
      )}
    >
      {/* Drag handle - top right */}
      <button
        data-onboarding="drag-handle"
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-20 glass-button rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} className="text-muted-foreground" />
      </button>
      {/* Edit/Delete menu - top right (next to drag) */}
      {onEdit && onDelete && (
        <CardActions onEdit={onEdit} onDelete={onDelete} />
      )}
      {/* Resize handle - bottom left */}
      {onResize && currentSize && (
        <ResizeHandle currentSize={currentSize} onResize={onResize} />
      )}
      {children}
    </div>
  );
}
