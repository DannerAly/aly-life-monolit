'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils/cn';

interface WeeklyChartProps {
  data: { date: string; dayLabel: string; value: number }[];
  dailyGoal: number;
  color: string;
}

export function WeeklyChart({ data, dailyGoal, color }: WeeklyChartProps) {
  const maxValue = Math.max(dailyGoal, ...data.map(d => d.value));
  const goalPercent = (dailyGoal / maxValue) * 100;

  return (
    <div className="relative">
      {/* Goal line */}
      <div
        className="absolute left-0 right-0 border-t border-dashed pointer-events-none z-10"
        style={{
          bottom: `${goalPercent}%`,
          borderColor: `${color}60`,
        }}
      >
        <span
          className="absolute -top-3 right-0 text-[10px] font-medium px-1 rounded"
          style={{ color }}
        >
          Meta
        </span>
      </div>

      {/* Bars */}
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((d, i) => {
          const heightPercent = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
          const metGoal = d.value >= dailyGoal;

          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {d.value > 0 ? d.value : ''}
              </span>
              <div className="w-full relative" style={{ height: '100px' }}>
                <motion.div
                  className={cn('absolute bottom-0 w-full rounded-t-md')}
                  style={{
                    backgroundColor: metGoal ? color : `${color}40`,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                {d.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
