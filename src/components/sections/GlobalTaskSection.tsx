'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListTodo, Loader2 } from 'lucide-react';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskForm } from '@/components/tasks/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import type { GlobalTask, TaskWithProgress, TaskFormData } from '@/lib/types/database';

interface GlobalTaskSectionProps {
  tasks: GlobalTask[];
  loading: boolean;
  onIncrement: (id: string) => Promise<boolean>;
  onDecrement: (id: string) => Promise<boolean>;
  onToggle: (id: string) => Promise<boolean>;
  onUpdate: (id: string, data: Partial<TaskFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function GlobalTaskSection({
  tasks,
  loading,
  onIncrement,
  onDecrement,
  onToggle,
  onUpdate,
  onDelete,
}: GlobalTaskSectionProps) {
  const [editingTask, setEditingTask] = useState<GlobalTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll({ items: tasks });

  const handleEditTask = async (data: TaskFormData) => {
    if (!editingTask) return false;
    const ok = await onUpdate(editingTask.id, data);
    if (ok) setEditingTask(null);
    return ok;
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    await onDelete(deletingTaskId);
    setDeletingTaskId(null);
  };

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ListTodo size={20} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold">Mis Tareas</h2>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10 tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Sin tareas"
          description="Crea tareas en tus áreas de vida para verlas aquí"
        />
      ) : (
        <motion.div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {visibleItems.map(task => (
              <TaskRow
                key={task.id}
                task={task as TaskWithProgress}
                categoryColor={task.category_color}
                categoryMeta={{
                  name: task.category_name,
                  emoji: task.category_emoji,
                  color: task.category_color,
                }}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onToggle={onToggle}
                onEdit={t => setEditingTask(tasks.find(gt => gt.id === t.id) ?? null)}
                onDelete={id => setDeletingTaskId(id)}
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
      )}

      {/* Edit modal */}
      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditTask}
          initial={{
            title: editingTask.title,
            emoji: editingTask.emoji ?? undefined,
            task_type: editingTask.task_type,
            target_value: editingTask.target_value,
            due_date: editingTask.due_date ?? undefined,
            sub_filter: editingTask.sub_filter ?? undefined,
            priority: editingTask.priority,
          }}
          mode="edit"
          categoryColor={editingTask.category_color}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDeleteTask}
        title="¿Eliminar objetivo?"
        description="Esta acción no se puede deshacer. El objetivo y su progreso serán eliminados permanentemente."
      />
    </section>
  );
}
