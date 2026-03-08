'use client';

import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import type { CategoryWithTasks } from '@/lib/types/database';

interface CategoryHeaderProps {
  category: CategoryWithTasks;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryHeader({ category, onEdit, onDelete }: CategoryHeaderProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}08 100%)`,
        borderLeft: `4px solid ${category.color}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="glass-button rounded-xl p-2 hover:scale-105 transition-transform flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-shrink-0 text-4xl">{category.emoji || '📁'}</div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{category.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>{category.task_count} objetivos</span>
              <span>·</span>
              <span className="text-emerald-500">{category.completed_count} completados</span>
              {category.task_count - category.completed_count > 0 && (
                <>
                  <span>·</span>
                  <span>{category.task_count - category.completed_count} pendientes</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <CircularProgress
            value={category.average_progress}
            size={64}
            strokeWidth={5}
            color={category.color}
            showLabel
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onEdit}
              className="glass-button rounded-xl p-2 hover:scale-105 transition-transform"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={onDelete}
              className="glass-button rounded-xl p-2 hover:bg-rose-500/20 hover:scale-105 transition-all"
            >
              <Trash2 size={15} className="text-rose-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
