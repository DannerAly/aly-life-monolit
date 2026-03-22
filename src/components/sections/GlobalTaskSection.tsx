'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListTodo, Loader2 } from 'lucide-react';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskForm } from '@/components/tasks/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import type { GlobalTask, TaskWithProgress, TaskFormData } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

type TaskFilter = 'all' | 'pending' | 'completed';

const FILTER_OPTIONS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Hechas' },
];

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
  const [filter, setFilter] = useState<TaskFilter>('all');

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'completed') return tasks.filter(t => t.status === 'completed');
    // pending = active + failed (not completed)
    return tasks.filter(t => t.status !== 'completed');
  }, [tasks, filter]);

  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll({
    items: filteredTasks,
    pageSize: 15,
  });

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

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
      {/* Header + filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ListTodo size={20} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold">Mis Tareas</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10 tabular-nums">
            {filteredTasks.length}
          </span>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1 glass-card rounded-2xl p-1">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-medium transition-all tabular-nums',
                filter === opt.value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
              <span className={cn(
                'ml-1.5',
                filter === opt.value ? 'text-white/70' : 'text-muted-foreground/50'
              )}>
                {counts[opt.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={filter === 'completed' ? '🎉' : filter === 'pending' ? '✅' : '📋'}
          title={
            filter === 'completed'
              ? 'Sin tareas completadas'
              : filter === 'pending'
                ? 'Todo al día'
                : 'Sin tareas'
          }
          description={
            filter === 'completed'
              ? 'Completa tareas para verlas aquí'
              : filter === 'pending'
                ? 'No tienes tareas pendientes'
                : 'Crea tareas en tus áreas de vida para verlas aquí'
          }
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

          {/* Summary when truncated */}
          {!hasMore && filteredTasks.length > 15 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Mostrando {filteredTasks.length} tareas
            </p>
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
