'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Header } from '@/components/layout/Header';
import { CategoryHeader } from '@/components/categories/CategoryHeader';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskForm } from '@/components/tasks/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCategories } from '@/lib/hooks/useCategories';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTaskFilters } from '@/lib/hooks/useTaskFilters';
import type { TaskWithProgress, CategoryFormData } from '@/lib/types/database';
import { calculateCategoryAverage } from '@/lib/utils/progress';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { categories, fetchCategories, updateCategory, deleteCategory } = useCategories();
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, incrementTask, decrementTask, toggleOneTime } = useTasks(id);
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, filteredTasks } = useTaskFilters(tasks);

  const [showEditCategory, setShowEditCategory] = useState(false);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithProgress | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTasks(id);
  }, [id, fetchCategories, fetchTasks]);

  const category = categories.find(c => c.id === id);

  // Build live category with computed tasks
  const liveCategory = category
    ? {
        ...category,
        tasks,
        task_count: tasks.length,
        average_progress: calculateCategoryAverage(tasks),
        completed_count: tasks.filter(t => t.status === 'completed').length,
      }
    : null;

  const handleDeleteCategory = async () => {
    setDeletingCat(true);
    const ok = await deleteCategory(id);
    setDeletingCat(false);
    if (ok) router.push('/');
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    await deleteTask(deletingTaskId);
    setDeletingTaskId(null);
  };

  const handleEditTask = async (data: Parameters<typeof updateTask>[1]) => {
    if (!editingTask) return false;
    const ok = await updateTask(editingTask.id, data);
    if (ok) setEditingTask(null);
    return ok;
  };

  if (!loading && !liveCategory) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-sm">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="font-semibold mb-2">Categoría no encontrada</h2>
          <button onClick={() => router.push('/')} className="glass-button rounded-xl px-4 py-2 text-sm mt-4">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <Header />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {loading || !liveCategory ? (
          <div className="glass-card h-36 animate-pulse mb-6" />
        ) : (
          <CategoryHeader
            category={liveCategory}
            onEdit={() => setShowEditCategory(true)}
            onDelete={() => setShowDeleteCategory(true)}
          />
        )}

        {liveCategory && (
          <>
            <TaskFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              categoryColor={liveCategory.color}
            />

            <TaskList
              tasks={filteredTasks}
              categoryColor={liveCategory.color}
              onIncrement={incrementTask}
              onDecrement={decrementTask}
              onToggle={toggleOneTime}
              onEdit={task => setEditingTask(task)}
              onDelete={id => setDeletingTaskId(id)}
              emptyMessage={
                searchQuery || statusFilter !== 'all'
                  ? 'No hay objetivos que coincidan con el filtro'
                  : undefined
              }
            />
          </>
        )}
      </main>

      {/* FAB: Add Task */}
      {liveCategory && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTaskForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl z-30"
          style={{
            backgroundColor: liveCategory.color,
            boxShadow: `0 8px 32px ${liveCategory.color}50`,
          }}
        >
          <Plus size={24} />
        </motion.button>
      )}

      {/* Modals */}
      {liveCategory && (
        <>
          <CategoryForm
            open={showEditCategory}
            onClose={() => setShowEditCategory(false)}
            onSubmit={(data: CategoryFormData) => updateCategory(id, data)}
            initial={{ name: liveCategory.name, emoji: liveCategory.emoji ?? undefined, color: liveCategory.color }}
            mode="edit"
          />

          <TaskForm
            open={showTaskForm}
            onClose={() => setShowTaskForm(false)}
            onSubmit={data => createTask(id, data)}
            mode="create"
            categoryColor={liveCategory.color}
          />

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
              }}
              mode="edit"
              categoryColor={liveCategory.color}
            />
          )}

          <ConfirmDialog
            open={!!deletingTaskId}
            onClose={() => setDeletingTaskId(null)}
            onConfirm={handleDeleteTask}
            title="¿Eliminar objetivo?"
            description="Esta acción no se puede deshacer. El objetivo y su progreso serán eliminados permanentemente."
          />

          <ConfirmDialog
            open={showDeleteCategory}
            onClose={() => setShowDeleteCategory(false)}
            onConfirm={handleDeleteCategory}
            title="¿Eliminar área de vida?"
            description="Se eliminarán el área y todos sus objetivos. Esta acción no se puede deshacer."
            loading={deletingCat}
          />
        </>
      )}
    </div>
  );
}
