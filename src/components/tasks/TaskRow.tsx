'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { StatusBadge } from '@/components/ui/Badge';
import { formatRelativeDate, isOverdue } from '@/lib/utils/date';
import type { TaskWithProgress } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface CategoryMeta {
  name: string;
  emoji: string | null;
  color: string;
}

interface TaskRowProps {
  task: TaskWithProgress;
  categoryColor: string;
  categoryMeta?: CategoryMeta;
  onIncrement: (id: string) => Promise<boolean>;
  onDecrement: (id: string) => Promise<boolean>;
  onToggle: (id: string) => Promise<boolean>;
  onEdit: (task: TaskWithProgress) => void;
  onDelete: (id: string) => void;
}

export function TaskRow({
  task,
  categoryColor,
  categoryMeta,
  onIncrement,
  onDecrement,
  onToggle,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const [loading, setLoading] = useState(false);

  const handleIncrement = async () => {
    if (loading || task.current_value >= task.target_value) return;
    setLoading(true);
    await onIncrement(task.id);
    setLoading(false);
  };

  const handleDecrement = async () => {
    if (loading || task.current_value <= 0) return;
    setLoading(true);
    await onDecrement(task.id);
    setLoading(false);
  };

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    await onToggle(task.id);
    setLoading(false);
  };

  const overdue = isOverdue(task.due_date) && task.status !== 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'glass-card p-4 flex items-center gap-4 group',
        task.status === 'completed' && 'opacity-70',
        task.status === 'failed' && 'opacity-60'
      )}
    >
      {/* Progress or Toggle */}
      {task.task_type === 'one_time' ? (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleToggle}
          disabled={loading}
          className="flex-shrink-0"
        >
          <AnimatePresence mode="wait">
            {task.status === 'completed' ? (
              <motion.div key="checked" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 size={28} style={{ color: categoryColor }} />
              </motion.div>
            ) : (
              <motion.div key="unchecked" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Circle size={28} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      ) : (
        <CircularProgress
          value={task.progress}
          size={44}
          strokeWidth={3.5}
          color={task.status === 'failed' ? '#f43f5e' : categoryColor}
          showLabel
          className="flex-shrink-0"
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {task.emoji && <span className="text-base">{task.emoji}</span>}
          <p
            className={cn(
              'text-sm font-medium truncate',
              task.status === 'completed' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>
          {task.sub_filter && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10">
              {task.sub_filter}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {categoryMeta && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
              style={{
                backgroundColor: `${categoryMeta.color}15`,
                borderColor: `${categoryMeta.color}30`,
                color: categoryMeta.color,
              }}
            >
              {categoryMeta.emoji && `${categoryMeta.emoji} `}{categoryMeta.name}
            </span>
          )}
          <StatusBadge status={task.status} />
          {task.due_date && (
            <span className={cn('text-xs', overdue ? 'text-rose-500' : 'text-muted-foreground')}>
              {formatRelativeDate(task.due_date)}
            </span>
          )}
          {task.task_type === 'repetition' && (
            <span className="text-xs text-muted-foreground">
              {task.current_value}/{task.target_value}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Repetition controls */}
        {task.task_type === 'repetition' && (
          <>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleDecrement}
              disabled={loading || task.current_value <= 0}
              className="glass-button rounded-lg w-8 h-8 flex items-center justify-center disabled:opacity-30 hover:scale-105"
            >
              <Minus size={13} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleIncrement}
              disabled={loading || task.current_value >= task.target_value}
              className="rounded-lg w-8 h-8 flex items-center justify-center disabled:opacity-30 hover:opacity-80 text-white transition-opacity"
              style={{ backgroundColor: categoryColor }}
            >
              <Plus size={13} />
            </motion.button>
          </>
        )}
        <button
          onClick={() => onEdit(task)}
          className="glass-button rounded-lg w-8 h-8 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="glass-button rounded-lg w-8 h-8 flex items-center justify-center hover:bg-rose-500/20 hover:scale-105 transition-all"
        >
          <Trash2 size={13} className="text-rose-400" />
        </button>
      </div>
    </motion.div>
  );
}
