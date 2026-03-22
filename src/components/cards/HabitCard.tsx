'use client';

import { motion } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { HabitWithLog } from '@/lib/types/database';

interface HabitCardProps {
  habit: HabitWithLog;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
  className?: string;
}

export function HabitCard({
  habit,
  onIncrement,
  onDecrement,
  onClick,
  className,
}: HabitCardProps) {
  const { emoji, name, todayValue, daily_goal, progress, goalMet, icon_color, unit_label } = habit;
  const showGrid = daily_goal <= 12;
  const gridCols = Math.min(4, daily_goal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-card p-4 flex flex-col justify-between overflow-hidden relative cursor-pointer',
        goalMet && 'ring-1',
        className
      )}
      style={goalMet ? { '--tw-ring-color': `${icon_color}40` } as React.CSSProperties : undefined}
    >
      {/* Clickable header area */}
      <div onClick={onClick}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <h3 className="text-sm font-semibold">{name}</h3>
          </div>
          <span
            className={cn('text-sm font-bold tabular-nums')}
            style={{ color: goalMet ? icon_color : undefined }}
          >
            {todayValue}/{daily_goal}
          </span>
        </div>

        {/* Visual grid or progress counter */}
        {showGrid ? (
          <div
            className="gap-2 mb-3"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
          >
            {Array.from({ length: daily_goal }).map((_, i) => {
              const filled = i < todayValue;
              return (
                <motion.div
                  key={i}
                  className={cn(
                    'flex items-center justify-center rounded-lg h-8 transition-colors',
                    filled ? 'text-white' : 'bg-white/5 text-muted-foreground/30'
                  )}
                  style={filled ? { backgroundColor: `${icon_color}30`, color: icon_color } : undefined}
                >
                  <motion.span
                    className="text-sm"
                    animate={filled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {emoji}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center mb-3">
            <span className="text-3xl font-bold tabular-nums" style={{ color: icon_color }}>
              {todayValue}
            </span>
            <span className="text-sm text-muted-foreground ml-1">/ {daily_goal} {unit_label}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onDecrement(); }}
          disabled={todayValue <= 0}
          className="glass-button rounded-lg w-8 h-8 flex items-center justify-center disabled:opacity-30"
        >
          <Minus size={14} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onIncrement(); }}
          className="flex-1 rounded-lg h-8 flex items-center justify-center text-white text-xs font-medium transition-colors"
          style={{ backgroundColor: `${icon_color}cc` }}
          whileHover={{ backgroundColor: icon_color }}
        >
          <Plus size={14} className="mr-1" />
          {unit_label}
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${icon_color}, ${icon_color}80)` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Celebration */}
      {goalMet && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 text-xs"
        >
          🎉
        </motion.div>
      )}
    </motion.div>
  );
}
