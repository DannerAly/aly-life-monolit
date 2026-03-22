'use client';

import { useState, useMemo } from 'react';
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
import type { CategoryWithTasks, HabitWithLog, GridItem } from '@/lib/types/database';
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
}

function BentoSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[180px] gap-4">
      <div className="glass-card col-span-1 sm:col-span-2 row-span-2 bg-white/30 dark:bg-white/5 animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="glass-card bg-white/30 dark:bg-white/5 animate-pulse" />
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
}: BentoGridProps) {
  const allTasks = categories.flatMap(c => c.tasks);
  const stats = getOverallStats(allTasks);
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
      // Use saved layout, filter out deleted items
      items = gridLayout.filter(item => existingIds.has(toGridItemId(item)));
      // Add new items not in layout
      const layoutIds = new Set(items.map(toGridItemId));
      const newHabits = habits
        .filter(h => !layoutIds.has(toGridItemId({ type: 'habit', id: h.id })))
        .map(h => ({ type: 'habit' as const, id: h.id }));
      const newCats = categories
        .filter(c => !layoutIds.has(toGridItemId({ type: 'category', id: c.id })))
        .map(c => ({ type: 'category' as const, id: c.id }));
      items = [...items, ...newHabits, ...newCats];
    } else {
      // Default order: habits by sort_order, then categories by sort_order
      items = [
        ...habits.map(h => ({ type: 'habit' as const, id: h.id })),
        ...categories.map(c => ({ type: 'category' as const, id: c.id })),
      ];
    }

    return items;
  }, [categories, habits, gridLayout]);

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

  const catMap = new Map(categories.map(c => [c.id, c]));
  const habitMap = new Map(habits.map(h => [h.id, h]));

  const renderItem = (item: GridItem) => {
    if (item.type === 'habit') {
      const habit = habitMap.get(item.id);
      if (!habit) return null;
      return (
        <HabitCard
          habit={habit}
          onIncrement={() => onIncrementHabit(habit.id)}
          onDecrement={() => onDecrementHabit(habit.id)}
          onClick={() => onHabitClick(habit.id)}
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
        className="col-span-1 row-span-1"
      />
    );
  };

  // Find active item for drag overlay
  const activeItem = activeId ? fromGridItemId(activeId) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[200px] gap-4">
      {/* Hero Card - always first, NOT draggable */}
      <HeroStatsCard
        totalTasks={stats.total}
        completedTasks={stats.completed}
        activeTasks={stats.active}
        failedTasks={stats.failed}
        overallProgress={stats.avgProgress}
        categoryCount={categories.length}
        className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-1 sm:row-span-2"
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
            return (
              <SortableGridItem
                key={compositeId}
                id={compositeId}
                className="col-span-1 row-span-1"
              >
                {renderItem(item)}
              </SortableGridItem>
            );
          })}
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <div className="opacity-80 pointer-events-none">
              {renderItem(activeItem)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Quick Add Cards - NOT draggable */}
      <QuickAddCard onClick={onAddHabit} label="Nuevo hábito" sublabel="Meditación, Ejercicio..." />
      <QuickAddCard onClick={onAddCategory} />
    </div>
  );
}

BentoGrid.Skeleton = BentoSkeleton;
