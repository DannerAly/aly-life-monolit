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
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { ObjectivesStatsModal } from '@/components/stats/ObjectivesStatsModal';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import type { HabitFormData, CategoryFormData } from '@/lib/types/database';

export default function HomePage() {
  const { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();
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
  const {
    shouldShowOnboarding,
    isOnboardingActive,
    currentStep,
    totalSteps,
    step,
    loading: onboardingLoading,
    fetchOnboardingStatus,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [showObjectivesStats, setShowObjectivesStats] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCategories();
    fetchGlobalTasks();
    fetchHabits();
    fetchLayout();
    fetchOnboardingStatus();
  }, []);

  // Auto-start onboarding for new users
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!onboardingLoading && shouldShowOnboarding && !loading) {
      startOnboarding();
    }
  }, [shouldShowOnboarding, onboardingLoading, loading]);

  const selectedHabit = habits.find(h => h.id === selectedHabitId) ?? null;
  const editingHabitData = habits.find(h => h.id === editingHabit);
  const editingCategoryData = categories.find(c => c.id === editingCategory);

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

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!editingCategory) return false;
    const result = await updateCategory(editingCategory, data);
    if (result) setEditingCategory(null);
    return result;
  };

  const handleConfirmDeleteCategory = async () => {
    if (deletingCategoryId) {
      await deleteCategory(deletingCategoryId);
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="min-h-screen mesh-bg">
      <Header onStartTutorial={startOnboarding} />

      <main className="pt-24 pb-24 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
            onEditCategory={(id) => setEditingCategory(id)}
            onDeleteCategory={(id) => setDeletingCategoryId(id)}
            onEditHabit={(id) => setEditingHabit(id)}
            onDeleteHabit={(id) => setDeletingHabitId(id)}
            onHeroClick={() => setShowObjectivesStats(true)}
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

      <CategoryForm
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={handleUpdateCategory}
        mode="edit"
        initial={
          editingCategoryData
            ? {
                name: editingCategoryData.name,
                emoji: editingCategoryData.emoji ?? undefined,
                color: editingCategoryData.color,
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={!!deletingHabitId}
        onClose={() => setDeletingHabitId(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar hábito"
        description="Se eliminarán todos los registros asociados. Esta acción no se puede deshacer."
      />

      <ConfirmDialog
        open={!!deletingCategoryId}
        onClose={() => setDeletingCategoryId(null)}
        onConfirm={handleConfirmDeleteCategory}
        title="Eliminar área"
        description="Se eliminarán todos los objetivos asociados. Esta acción no se puede deshacer."
      />

      <ObjectivesStatsModal
        open={showObjectivesStats}
        onClose={() => setShowObjectivesStats(false)}
        categories={categories}
      />

      <OnboardingOverlay
        active={isOnboardingActive}
        step={step}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipOnboarding}
      />
    </div>
  );
}
