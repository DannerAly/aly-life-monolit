'use client';

import { HeroStatsCard } from '@/components/cards/HeroStatsCard';
import { CategoryCard } from '@/components/cards/CategoryCard';
import { QuickAddCard } from '@/components/cards/QuickAddCard';
import type { CategoryWithTasks } from '@/lib/types/database';
import { getOverallStats } from '@/lib/utils/progress';
import { cn } from '@/lib/utils/cn';

interface BentoGridProps {
  categories: CategoryWithTasks[];
  onAddCategory: () => void;
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

export function BentoGrid({ categories, onAddCategory }: BentoGridProps) {
  const allTasks = categories.flatMap(c => c.tasks);
  const stats = getOverallStats(allTasks);

  // Assign card sizes based on task count
  const getCategorySize = (cat: CategoryWithTasks, index: number): string => {
    if (index === 0 && cat.task_count >= 5) return 'col-span-1 sm:col-span-2 row-span-1 sm:row-span-2';
    if (index === 1 && cat.task_count >= 4) return 'col-span-1 sm:col-span-2';
    return 'col-span-1 row-span-1';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[200px] gap-4">
      {/* Hero Card - always first, takes 2x2 */}
      <HeroStatsCard
        totalTasks={stats.total}
        completedTasks={stats.completed}
        activeTasks={stats.active}
        failedTasks={stats.failed}
        overallProgress={stats.avgProgress}
        categoryCount={categories.length}
        className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-1 sm:row-span-2"
      />

      {/* Category Cards */}
      {categories.map((cat, i) => (
        <CategoryCard
          key={cat.id}
          category={cat}
          index={i}
          size={i === 0 ? 'lg' : 'md'}
          className={cn(getCategorySize(cat, i))}
        />
      ))}

      {/* Quick Add Card */}
      <QuickAddCard onClick={onAddCategory} />
    </div>
  );
}

BentoGrid.Skeleton = BentoSkeleton;
