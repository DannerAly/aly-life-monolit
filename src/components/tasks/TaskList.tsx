'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskRow } from './TaskRow';
import { SortableTaskItem } from './SortableTaskItem';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TaskWithProgress } from '@/lib/types/database';

interface TaskListProps {
  tasks: TaskWithProgress[];
  categoryColor: string;
  onIncrement: (id: string) => Promise<boolean>;
  onDecrement: (id: string) => Promise<boolean>;
  onToggle: (id: string) => Promise<boolean>;
  onEdit: (task: TaskWithProgress) => void;
  onDelete: (id: string) => void;
  onReorder?: (orderedIds: string[]) => Promise<boolean> | void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  categoryColor,
  onIncrement,
  onDecrement,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  onLoadMore,
  hasMore,
  loadingMore,
  emptyMessage,
}: TaskListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Server-side infinite scroll: fire onLoadMore when sentinel is visible
  // Only recreate observer when hasMore changes — ref avoids re-creating on callback identity
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) onLoadMoreRef.current?.();
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    onReorder(reordered.map(t => t.id));
  }, [tasks, onReorder]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="Sin objetivos aún"
        description={emptyMessage ?? 'Agrega tu primer objetivo para empezar a trackear tu progreso'}
      />
    );
  }

  const content = onReorder ? (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <SortableTaskItem
              key={task.id}
              task={task}
              categoryColor={categoryColor}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
    </DndContext>
  ) : (
    <AnimatePresence mode="popLayout">
      {tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          categoryColor={categoryColor}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </AnimatePresence>
  );

  return (
    <motion.div className="flex flex-col gap-3">
      {content}

      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-4">
          {loadingMore ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground/50" />
          ) : (
            <div className="h-4" />
          )}
        </div>
      )}
    </motion.div>
  );
}
