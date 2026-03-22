'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BentoGrid } from '@/components/layout/BentoGrid';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { HabitForm } from '@/components/habits/HabitForm';
import { HabitStatsModal } from '@/components/habits/HabitStatsModal';
import { GlobalTaskSection } from '@/components/sections/GlobalTaskSection';
import { useCategories } from '@/lib/hooks/useCategories';
import { useGlobalTasks } from '@/lib/hooks/useGlobalTasks';
import { useHabits } from '@/lib/hooks/useHabits';
import { useGridLayout } from '@/lib/hooks/useGridLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { HabitFormData } from '@/lib/types/database';

export default function HomePage() {
  const { categories, loading, fetchCategories, createCategory } = useCategories();
  const {
    tasks: globalTasks,
    loading: tasksLoading,
    fetchGlobalTasks,
    incrementTask,
    decrementTask,
    toggleOneTime,
    updateTask,
    deleteTask,
  } = useGlobalTasks();
  const {
    habits,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    incrementHabit,
    decrementHabit,
  } = useHabits();
  const { gridLayout, fetchLayout, saveLayout } = useGridLayout();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchGlobalTasks();
    fetchHabits();
    fetchLayout();
  }, [fetchCategories, fetchGlobalTasks, fetchHabits, fetchLayout]);

  const selectedHabit = habits.find(h => h.id === selectedHabitId) ?? null;
  const editingHabitData = habits.find(h => h.id === editingHabit);

  const handleEditHabit = () => {
    if (selectedHabitId) {
      setEditingHabit(selectedHabitId);
      setSelectedHabitId(null);
    }
  };

  const handleDeleteHabitConfirm = () => {
    if (selectedHabitId) {
      setDeletingHabitId(selectedHabitId);
      setSelectedHabitId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingHabitId) {
      await deleteHabit(deletingHabitId);
      setDeletingHabitId(null);
    }
  };

  const handleUpdateHabit = async (data: HabitFormData) => {
    if (!editingHabit) return false;
    const result = await updateHabit(editingHabit, data);
    if (result) setEditingHabit(null);
    return result;
  };

  return (
    <div className="min-h-screen mesh-bg">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {loading ? (
          <BentoGrid.Skeleton />
        ) : (
          <BentoGrid
            categories={categories}
            habits={habits}
            gridLayout={gridLayout}
            onAddCategory={() => setShowCategoryForm(true)}
            onAddHabit={() => setShowHabitForm(true)}
            onIncrementHabit={incrementHabit}
            onDecrementHabit={decrementHabit}
            onHabitClick={(id) => setSelectedHabitId(id)}
            onReorder={saveLayout}
          />
        )}

        <GlobalTaskSection
          tasks={globalTasks}
          loading={tasksLoading}
          onIncrement={incrementTask}
          onDecrement={decrementTask}
          onToggle={toggleOneTime}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      </main>

      <CategoryForm
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={createCategory}
        mode="create"
      />

      <HabitForm
        open={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSubmit={createHabit}
        mode="create"
      />

      <HabitForm
        open={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSubmit={handleUpdateHabit}
        mode="edit"
        initial={
          editingHabitData
            ? {
                name: editingHabitData.name,
                emoji: editingHabitData.emoji,
                icon_color: editingHabitData.icon_color,
                daily_goal: editingHabitData.daily_goal,
                unit_label: editingHabitData.unit_label,
              }
            : undefined
        }
      />

      <HabitStatsModal
        open={!!selectedHabitId}
        onClose={() => setSelectedHabitId(null)}
        habit={selectedHabit}
        onEdit={handleEditHabit}
        onDelete={handleDeleteHabitConfirm}
      />

      <ConfirmDialog
        open={!!deletingHabitId}
        onClose={() => setDeletingHabitId(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar hábito"
        description="Se eliminarán todos los registros asociados. Esta acción no se puede deshacer."
      />
    </div>
  );
}
