'use client';

import { AnimatePresence, motion } from 'motion/react';
import { TaskRow } from './TaskRow';
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
    </motion.div>
  );
}
