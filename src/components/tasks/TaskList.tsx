'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { TaskRow } from './TaskRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import type { TaskWithProgress } from '@/lib/types/database';

interface TaskListProps {
  tasks: TaskWithProgress[];
  categoryColor: string;
  onIncrement: (id: string) => Promise<boolean>;
  onDecrement: (id: string) => Promise<boolean>;
  onToggle: (id: string) => Promise<boolean>;
  onEdit: (task: TaskWithProgress) => void;
  onDelete: (id: string) => void;
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
  emptyMessage,
}: TaskListProps) {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll({ items: tasks });

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="Sin objetivos aún"
        description={emptyMessage ?? 'Agrega tu primer objetivo para empezar a trackear tu progreso'}
      />
    );
  }

  return (
    <motion.div className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {visibleItems.map(task => (
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

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-4">
          <Loader2 size={18} className="animate-spin text-muted-foreground/50" />
        </div>
      )}
    </motion.div>
  );
}
