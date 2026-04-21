'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import { HeroStatsCard } from '@/components/cards/HeroStatsCard';
import { CategoryCard } from '@/components/cards/CategoryCard';
import { HabitCard } from '@/components/cards/HabitCard';
import { QuickAddCard } from '@/components/cards/QuickAddCard';
import { SortableGridItem } from '@/components/layout/SortableGridItem';
import type { CategoryWithTasks, HabitWithLog, GridItem, GridItemSize } from '@/lib/types/database';
import { getOverallStats } from '@/lib/utils/progress';

interface BentoGridProps {
  categories: CategoryWithTasks[];
  habits: HabitWithLog[];
  gridLayout: GridItem[];
  onAddCategory: () => void;
  onAddHabit: () => void;
  onIncrementHabit: (id: string) => void;
  onDecrementHabit: (id: string) => void;
  onHabitClick: (id: string) => void;
  onReorder: (layout: GridItem[]) => void;
  onEditCategory?: (id: string) => void;
  onDeleteCategory?: (id: string) => void;
  onEditHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => void;
  onHeroClick?: () => void;
}

function BentoSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 auto-rows-[100px] gap-3">
      <div className="glass-card col-span-2 sm:col-span-4 row-span-4 bg-white/30 dark:bg-white/5 animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="glass-card col-span-2 row-span-2 bg-white/30 dark:bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

function toGridItemId(item: GridItem): string {
  return `${item.type}:${item.id}`;
}

function fromGridItemId(compositeId: string): GridItem {
  const [type, id] = compositeId.split(':');
  return { type: type as 'category' | 'habit', id };
}

// Grid: 2col mobile, 4col tablet, 8col desktop. Each cell = ~100px.
// A standard card (1x1) = 2col x 2row = ~200x200. Mini = 1col x 1row = ~100x100.
const SIZE_CLASSES: Record<GridItemSize, string> = {
  'mini': 'col-span-1 row-span-1',
  '1x1': 'col-span-2 row-span-2',
  '2x1': 'col-span-2 sm:col-span-4 row-span-2',
  '1x2': 'col-span-2 row-span-4',
  '2x2': 'col-span-2 sm:col-span-4 row-span-4',
};

export function BentoGrid({
  categories,
  habits,
  gridLayout,
  onAddCategory,
  onAddHabit,
  onIncrementHabit,
  onDecrementHabit,
  onHabitClick,
  onReorder,
  onEditCategory,
  onDeleteCategory,
  onEditHabit,
  onDeleteHabit,
  onHeroClick,
}: BentoGridProps) {
  const stats = useMemo(() => {
    const allTasks = categories.flatMap(c => c.tasks);
    return getOverallStats(allTasks);
  }, [categories]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Build ordered items list
  const orderedItems = useMemo(() => {
    const existingIds = new Set([
      ...habits.map(h => toGridItemId({ type: 'habit', id: h.id })),
      ...categories.map(c => toGridItemId({ type: 'category', id: c.id })),
    ]);

    let items: GridItem[];

    if (gridLayout.length > 0) {
      items = gridLayout.filter(item => existingIds.has(toGridItemId(item)));
      const layoutIds = new Set(items.map(toGridItemId));
      const newHabits = habits
        .filter(h => !layoutIds.has(toGridItemId({ type: 'habit', id: h.id })))
        .map(h => ({ type: 'habit' as const, id: h.id }));
      const newCats = categories
        .filter(c => !layoutIds.has(toGridItemId({ type: 'category', id: c.id })))
        .map(c => ({ type: 'category' as const, id: c.id }));
      items = [...items, ...newHabits, ...newCats];
    } else {
      items = [
        ...habits.map(h => ({ type: 'habit' as const, id: h.id })),
        ...categories.map(c => ({ type: 'category' as const, id: c.id })),
      ];
    }

    return items;
  }, [categories, habits, gridLayout]);

  // Size map from layout
  const sizeMap = useMemo(() => {
    const map = new Map<string, GridItemSize>();
    for (const item of gridLayout) {
      if (item.size) map.set(toGridItemId(item), item.size);
    }
    return map;
  }, [gridLayout]);

  const sortableIds = orderedItems.map(toGridItemId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortableIds.indexOf(active.id as string);
    const newIndex = sortableIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(orderedItems, oldIndex, newIndex);
    onReorder(newItems);
  };

  const handleResize = useCallback((itemType: 'category' | 'habit', itemId: string, newSize: GridItemSize) => {
    const updated = orderedItems.map(item => {
      if (item.type === itemType && item.id === itemId) {
        return { ...item, size: newSize };
      }
      return item;
    });
    onReorder(updated);
  }, [orderedItems, onReorder]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const habitMap = useMemo(() => new Map(habits.map(h => [h.id, h])), [habits]);

  const firstHabitId = orderedItems.find(i => i.type === 'habit')?.id;
  const firstCategoryId = orderedItems.find(i => i.type === 'category')?.id;

  const getItemSize = (item: GridItem): GridItemSize => {
    const compositeId = toGridItemId(item);
    return sizeMap.get(compositeId) ?? item.size ?? '1x1';
  };

  const renderItem = (item: GridItem, itemSize?: GridItemSize) => {
    const compact = itemSize === 'mini';
    if (item.type === 'habit') {
      const habit = habitMap.get(item.id);
      if (!habit) return null;
      return (
        <HabitCard
          habit={habit}
          onIncrement={() => onIncrementHabit(habit.id)}
          onDecrement={() => onDecrementHabit(habit.id)}
          onClick={() => onHabitClick(habit.id)}
          dataOnboarding={item.id === firstHabitId ? 'habit-card' : undefined}
          compact={compact}
        />
      );
    }
    const cat = catMap.get(item.id);
    if (!cat) return null;
    return (
      <CategoryCard
        category={cat}
        index={0}
        size="md"
        dataOnboarding={item.id === firstCategoryId ? 'category-card' : undefined}
        compact={compact}
      />
    );
  };

  const activeItem = activeId ? fromGridItemId(activeId) : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 auto-rows-[100px] gap-3">
      {/* Hero Card - always first, NOT draggable, 4col x 4row */}
      <HeroStatsCard
        totalTasks={stats.total}
        completedTasks={stats.completed}
        activeTasks={stats.active}
        failedTasks={stats.failed}
        overallProgress={stats.avgProgress}
        categoryCount={categories.length}
        habitsCompleted={habits.filter(h => h.goalMet).length}
        habitsTotal={habits.length}
        onClick={onHeroClick}
        className="col-span-2 sm:col-span-4 row-span-4"
      />

      {/* Sortable items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          {orderedItems.map(item => {
            const compositeId = toGridItemId(item);
            const itemSize = sizeMap.get(compositeId) ?? item.size ?? '1x1';
            return (
              <SortableGridItem
                key={compositeId}
                id={compositeId}
                className={SIZE_CLASSES[itemSize]}
                onEdit={() => {
                  if (item.type === 'category') onEditCategory?.(item.id);
                  else onEditHabit?.(item.id);
                }}
                onDelete={() => {
                  if (item.type === 'category') onDeleteCategory?.(item.id);
                  else onDeleteHabit?.(item.id);
                }}
                currentSize={itemSize}
                onResize={(newSize) => handleResize(item.type, item.id, newSize)}
              >
                {renderItem(item, itemSize)}
              </SortableGridItem>
            );
          })}
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <div className="opacity-80 pointer-events-none">
              {renderItem(activeItem, getItemSize(activeItem))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Quick Add Cards - NOT draggable, standard 1x1 size (2col x 2row) */}
      <QuickAddCard onClick={onAddHabit} label="Nuevo hábito" sublabel="Meditación, Ejercicio..." dataOnboarding="add-habit" className="col-span-2 row-span-2" />
      <QuickAddCard onClick={onAddCategory} dataOnboarding="add-category" className="col-span-2 row-span-2" />
    </div>
  );
}

BentoGrid.Skeleton = BentoSkeleton;
