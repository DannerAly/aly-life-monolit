'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TaskRow } from './TaskRow';
import type { TaskWithProgress } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface CategoryMeta {
  name: string;
  emoji: string | null;
  color: string;
}

interface SortableTaskItemProps {
  task: TaskWithProgress;
  categoryColor: string;
  categoryMeta?: CategoryMeta;
  onIncrement: (id: string) => Promise<boolean>;
  onDecrement: (id: string) => Promise<boolean>;
  onToggle: (id: string) => Promise<boolean>;
  onEdit: (task: TaskWithProgress) => void;
  onDelete: (id: string) => void;
}

export function SortableTaskItem(props: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group/sort',
        isDragging && 'opacity-60'
      )}
    >
      {/* Drag handle - visible on hover */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 sm:-translate-x-6 opacity-0 group-hover/sort:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none z-10"
        aria-label="Reordenar tarea"
      >
        <GripVertical size={14} />
      </button>
      <TaskRow {...props} />
    </div>
  );
}
