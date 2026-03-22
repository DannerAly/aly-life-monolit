'use client';

import { motion } from 'motion/react';
import { Plus, Minus, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { HabitWithLog } from '@/lib/types/database';

interface HabitCardProps {
  habit: HabitWithLog;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
  className?: string;
  dataOnboarding?: string;
  compact?: boolean;
}

const FREQ_LABEL: Record<string, string> = {
  daily: 'hoy',
  weekly: 'esta semana',
  monthly: 'este mes',
};

export function HabitCard({
  habit,
  onIncrement,
  onDecrement,
  onClick,
  dataOnboarding,
  className,
  compact,
}: HabitCardProps) {
  const { emoji, name, todayValue, periodValue, periodGoal, progress, goalMet, icon_color, unit_label, frequency } = habit;
  const freq = frequency ?? 'daily';
  const isDaily = freq === 'daily';

  // For daily: show grid/counter of todayValue vs periodGoal
  // For weekly/monthly: show periodValue vs periodGoal (days completed)
  const displayValue = isDaily ? todayValue : periodValue;
  const displayGoal = periodGoal;
  const showGrid = isDaily && displayGoal <= 12;
  const gridCols = Math.min(4, displayGoal);
  const todayDone = !isDaily && todayValue >= 1;

  if (compact) {
    return (
      <motion.div
        data-onboarding={dataOnboarding}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className={cn(
          'glass-card p-3 flex items-center gap-2 overflow-hidden relative cursor-pointer h-full',
          goalMet && 'ring-1',
          className
        )}
        style={goalMet ? { '--tw-ring-color': `${icon_color}40` } as React.CSSProperties : undefined}
      >
        <span className="text-xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold truncate">{name}</h3>
        </div>
        <span
          className="text-xs font-bold tabular-nums flex-shrink-0"
          style={{ color: goalMet ? icon_color : undefined }}
        >
          {displayValue}/{displayGoal}
        </span>
        {isDaily ? (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); onIncrement(); }}
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-white"
            style={{ backgroundColor: `${icon_color}cc` }}
          >
            <Plus size={12} />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); todayDone ? onDecrement() : onIncrement(); }}
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors',
              todayDone ? 'text-white' : 'glass-button'
            )}
            style={todayDone ? { backgroundColor: icon_color } : undefined}
          >
            <Check size={12} />
          </motion.button>
        )}
        {goalMet && <span className="text-xs absolute top-1 right-1">🎉</span>}
      </motion.div>
    );
  }

  return (
    <motion.div
      data-onboarding={dataOnboarding}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-card p-4 flex flex-col justify-between overflow-hidden relative cursor-pointer h-full',
        goalMet && 'ring-1',
        className
      )}
      style={goalMet ? { '--tw-ring-color': `${icon_color}40` } as React.CSSProperties : undefined}
    >
      {/* Clickable header area */}
      <div onClick={onClick}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <h3 className="text-sm font-semibold">{name}</h3>
          </div>
          <span
            className={cn('text-sm font-bold tabular-nums')}
            style={{ color: goalMet ? icon_color : undefined }}
          >
            {displayValue}/{displayGoal}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          {isDaily ? unit_label : `${FREQ_LABEL[freq]} · ${unit_label}`}
        </p>

        {/* Visual grid (daily ≤12), day dots (weekly/monthly), or counter (daily >12) */}
        {isDaily && showGrid ? (
          <div
            className="gap-2 mb-3"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
          >
            {Array.from({ length: displayGoal }).map((_, i) => {
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
        ) : isDaily ? (
          <div className="flex items-center justify-center mb-3">
            <span className="text-3xl font-bold tabular-nums" style={{ color: icon_color }}>
              {todayValue}
            </span>
            <span className="text-sm text-muted-foreground ml-1">/ {displayGoal} {unit_label}</span>
          </div>
        ) : (
          /* Weekly/monthly: show day dots for the period */
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: displayGoal }).map((_, i) => {
              const filled = i < periodValue;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-5 h-5 rounded-md flex items-center justify-center transition-colors text-[10px]',
                    filled ? 'text-white' : 'bg-white/5'
                  )}
                  style={filled ? { backgroundColor: `${icon_color}80` } : undefined}
                >
                  {filled && <Check size={10} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        {isDaily ? (
          <>
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
            >
              <Plus size={14} className="mr-1" />
              {unit_label}
            </motion.button>
          </>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); todayDone ? onDecrement() : onIncrement(); }}
            className={cn(
              'flex-1 rounded-lg h-8 flex items-center justify-center text-xs font-medium transition-colors',
              todayDone ? 'glass-button' : 'text-white'
            )}
            style={!todayDone ? { backgroundColor: `${icon_color}cc` } : undefined}
          >
            <Check size={14} className="mr-1" />
            {todayDone ? 'Hecho hoy ✓' : 'Marcar hoy'}
          </motion.button>
        )}
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
