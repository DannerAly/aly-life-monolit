'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2, Flame, Trophy, TrendingUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { WeeklyChart } from '@/components/habits/WeeklyChart';
import { useHabitStats } from '@/lib/hooks/useHabitStats';
import type { HabitWithLog } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface HabitStatsModalProps {
  open: boolean;
  onClose: () => void;
  habit: HabitWithLog | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitStatsModal({
  open,
  onClose,
  habit,
  onEdit,
  onDelete,
}: HabitStatsModalProps) {
  const { stats, loading, fetchStats } = useHabitStats(habit?.id ?? null);

  useEffect(() => {
    if (open && habit) {
      fetchStats();
    }
  }, [open, habit, fetchStats]);

  if (!habit) return null;

  const completionRate =
    stats && stats.totalDaysTracked > 0
      ? Math.round((stats.totalDaysGoalMet / stats.totalDaysTracked) * 100)
      : 0;

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{habit.emoji}</span>
          <div>
            <h2 className="text-lg font-semibold">{habit.name}</h2>
            <p className="text-xs text-muted-foreground">
              Meta: {habit.daily_goal} {habit.unit_label}/día
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="glass-button rounded-xl p-2 hover:scale-105 transition-transform"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="glass-button rounded-xl p-2 hover:scale-105 transition-transform text-rose-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-3 h-16 bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="h-32 bg-white/5 animate-pulse rounded-xl" />
        </div>
      ) : stats ? (
        <div className="space-y-5">
          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-3">
            <StatPill
              icon={<Flame size={14} />}
              label="Racha actual"
              value={`${stats.currentStreak}`}
              suffix="días"
              color={habit.icon_color}
            />
            <StatPill
              icon={<Trophy size={14} />}
              label="Mejor racha"
              value={`${stats.bestStreak}`}
              suffix="días"
              color="#f59e0b"
            />
            <StatPill
              icon={<TrendingUp size={14} />}
              label="Cumplimiento"
              value={`${completionRate}%`}
              color="#10b981"
            />
          </div>

          {/* Weekly chart */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Última semana
            </h4>
            <WeeklyChart
              data={stats.weeklyData}
              dailyGoal={habit.daily_goal}
              color={habit.icon_color}
            />
          </div>

          {/* Monthly history */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Últimos 30 días
            </h4>
            <div className="grid grid-cols-10 gap-1">
              {stats.monthlyData.map(d => (
                <motion.div
                  key={d.date}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'aspect-square rounded-sm',
                    d.value === 0 && 'bg-white/5'
                  )}
                  style={
                    d.value > 0
                      ? {
                          backgroundColor: d.goalMet
                            ? habit.icon_color
                            : `${habit.icon_color}40`,
                        }
                      : undefined
                  }
                  title={`${d.date}: ${d.value}/${habit.daily_goal}`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function StatPill({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl p-3 text-center backdrop-blur-sm bg-white/5">
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
      </div>
      <p className="text-lg font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      {suffix && (
        <p className="text-[10px] text-muted-foreground">{suffix}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
