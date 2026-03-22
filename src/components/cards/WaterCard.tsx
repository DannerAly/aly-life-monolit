'use client';

import { motion } from 'motion/react';
import { Droplets, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WaterCardProps {
  glasses: number;
  goal: number;
  goalMet: boolean;
  progress: number;
  onAdd: () => void;
  onRemove: () => void;
  className?: string;
}

export function WaterCard({
  glasses,
  goal,
  goalMet,
  progress,
  onAdd,
  onRemove,
  className,
}: WaterCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-card p-4 flex flex-col justify-between overflow-hidden relative',
        goalMet && 'ring-1 ring-cyan-400/30',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <h3 className="text-sm font-semibold">Hidratación diaria</h3>
        </div>
        <span className={cn(
          'text-sm font-bold tabular-nums',
          goalMet ? 'text-cyan-400' : 'text-muted-foreground'
        )}>
          {glasses}/{goal}
        </span>
      </div>

      {/* Droplet grid: 4x2 */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Array.from({ length: goal }).map((_, i) => {
          const filled = i < glasses;
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={onAdd}
              className={cn(
                'flex items-center justify-center rounded-lg h-8 transition-colors',
                filled
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-white/5 text-muted-foreground/30 hover:bg-white/10'
              )}
            >
              <motion.div
                animate={filled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Droplets size={16} />
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          disabled={glasses <= 0}
          className="glass-button rounded-lg w-8 h-8 flex items-center justify-center disabled:opacity-30"
        >
          <Minus size={14} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          className="flex-1 rounded-lg h-8 flex items-center justify-center text-white text-xs font-medium bg-cyan-500/80 hover:bg-cyan-500 transition-colors"
        >
          <Plus size={14} className="mr-1" />
          Vaso
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
          }}
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
