'use client';

import { motion } from 'motion/react';
import type { PeriodSummary } from '@/lib/types/database';

interface BarChartProps {
  data: PeriodSummary[];
  height?: number;
  formatAmount: (amount: number) => string;
}

export function BarChart({ data, height = 160, formatAmount }: BarChartProps) {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.totalIncome, d.totalExpense)),
    1
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Sin datos suficientes
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3" style={{ height }}>
        {data.map((d, i) => {
          const incomeHeight = (d.totalIncome / maxValue) * 100;
          const expenseHeight = (d.totalExpense / maxValue) * 100;

          return (
            <div key={d.period} className="flex-1 flex flex-col items-center gap-1">
              {/* Bars container */}
              <div className="w-full flex gap-1 items-end" style={{ height: height - 24 }}>
                {/* Income bar */}
                <div className="flex-1 relative h-full">
                  <motion.div
                    className="absolute bottom-0 w-full rounded-t-md bg-emerald-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${incomeHeight}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                  />
                </div>
                {/* Expense bar */}
                <div className="flex-1 relative h-full">
                  <motion.div
                    className="absolute bottom-0 w-full rounded-t-md bg-rose-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${expenseHeight}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 + 0.04 }}
                  />
                </div>
              </div>
              {/* Label */}
              <span className="text-[10px] text-muted-foreground font-medium">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-[10px] text-muted-foreground">Egresos</span>
        </div>
      </div>
    </div>
  );
}
