'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { CircularProgress } from '@/components/ui/CircularProgress';
import type { CategoryWithTasks } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface CategoryCardProps {
  category: CategoryWithTasks;
  index: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dataOnboarding?: string;
  compact?: boolean;
}

export function CategoryCard({ category, index, size = 'md', className, dataOnboarding, compact }: CategoryCardProps) {
  const router = useRouter();

  const progressColor = category.color;
  const alpha16 = `${category.color}28`;
  const alpha08 = `${category.color}14`;

  return (
    <motion.div
      data-onboarding={dataOnboarding}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/category/${category.id}`)}
      className={cn(
        'glass-card cursor-pointer flex flex-col justify-between overflow-hidden relative group h-full',
        compact ? 'p-3' : 'p-5',
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${alpha16} 0%, ${alpha08} 100%)`,
        borderLeft: `3px solid ${category.color}`,
      }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
        style={{ boxShadow: `inset 0 0 40px ${alpha16}` }}
      />

      {/* Decorative orb */}
      {!compact && (
        <div
          className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
          style={{ background: category.color }}
        />
      )}

      {compact ? (
        /* Mini mode: emoji + name + progress inline */
        <div className="flex items-center gap-2 relative z-10 h-full">
          <span className="text-xl flex-shrink-0">{category.emoji || '📁'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs leading-tight truncate">{category.name}</h3>
          </div>
          <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: progressColor }}>
            {category.average_progress}%
          </span>
        </div>
      ) : (
        /* Normal mode */
        <>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <div className="text-2xl mb-2">{category.emoji || '📁'}</div>
              <h3 className="font-semibold text-sm leading-tight truncate">{category.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {category.task_count} objetivo{category.task_count !== 1 ? 's' : ''}
              </p>
            </div>
            <CircularProgress
              value={category.average_progress}
              size={size === 'lg' ? 60 : 48}
              strokeWidth={4}
              color={progressColor}
              showLabel
            />
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{category.completed_count}/{category.task_count} completados</span>
            </div>
            <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${category.average_progress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: index * 0.08 + 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
