'use client';

import { motion } from 'motion/react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { cn } from '@/lib/utils/cn';

interface HeroStatsCardProps {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  failedTasks: number;
  overallProgress: number;
  categoryCount: number;
  className?: string;
  onClick?: () => void;
}

export function HeroStatsCard({
  totalTasks,
  completedTasks,
  activeTasks,
  failedTasks,
  overallProgress,
  categoryCount,
  className,
  onClick,
}: HeroStatsCardProps) {
  const getMotivation = (progress: number) => {
    if (progress === 0) return 'El viaje de mil millas empieza con un paso 🚀';
    if (progress < 30) return 'Buen comienzo, sigue empujando 💪';
    if (progress < 60) return 'Vas por buen camino, no te detengas 🔥';
    if (progress < 85) return 'Casi llegas, el final está cerca ⭐';
    return 'Imparable. Eres una máquina 🏆';
  };

  return (
    <motion.div
      data-onboarding="hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn(
        'glass-card col-span-2 row-span-2 p-7 flex flex-col justify-between overflow-hidden relative',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(14,165,233,0.08) 50%, rgba(16,185,129,0.06) 100%)',
      }}
    >
      {/* Decorative blur orb */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      />

      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
              {categoryCount} área{categoryCount !== 1 ? 's' : ''} de vida
            </p>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
              Mis Objetivos
            </h1>
          </div>
          <CircularProgress
            value={overallProgress}
            size={72}
            strokeWidth={5}
            color="#3b82f6"
            showLabel
            labelClassName="text-xs"
          />
        </div>

        <p className="mt-3 text-sm text-muted-foreground italic">
          {getMotivation(overallProgress)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <StatPill label="Total" value={totalTasks} color="text-foreground" bg="bg-white/20 dark:bg-white/5" />
        <StatPill label="Completados" value={completedTasks} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatPill label="Fallidos" value={failedTasks} color="text-rose-500" bg="bg-rose-500/10" />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progreso general</span>
          <span className="font-semibold text-foreground">{overallProgress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #0ea5e9, #14b8a6)' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn('rounded-2xl p-3 text-center backdrop-blur-sm', bg)}>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
