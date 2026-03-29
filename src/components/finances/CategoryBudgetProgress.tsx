'use client';

import { motion } from 'motion/react';
import type { CategoryBreakdown } from '@/lib/types/database';

interface CategoryBudgetProgressProps {
  breakdown: CategoryBreakdown[];
  formatAmount: (amount: number) => string;
  monthlyBudget?: number | null;
  totalExpense: number;
}

function getBarColor(pct: number): string {
  if (pct > 100) return '#ef4444'; // red
  if (pct > 80) return '#f97316'; // orange
  if (pct > 60) return '#eab308'; // yellow
  return '#10b981'; // green
}

function getBarGradient(pct: number): string {
  if (pct > 100) return 'linear-gradient(90deg, #f43f5e, #ef4444)';
  if (pct > 80) return 'linear-gradient(90deg, #f97316, #ef4444)';
  if (pct > 60) return 'linear-gradient(90deg, #eab308, #f97316)';
  return 'linear-gradient(90deg, #10b981, #0ea5e9)';
}

export function CategoryBudgetProgress({
  breakdown,
  formatAmount,
  monthlyBudget,
  totalExpense,
}: CategoryBudgetProgressProps) {
  const categoriesWithLimit = breakdown.filter(b => b.spending_limit != null && b.spending_limit > 0);
  const hasGlobalBudget = monthlyBudget != null && monthlyBudget > 0;

  if (!hasGlobalBudget && categoriesWithLimit.length === 0) return null;

  return (
    <div className="glass-card p-6 mb-6">
      <h3 className="text-sm font-semibold mb-4">Límites de gasto</h3>
      <div className="space-y-4">
        {/* Global budget bar */}
        {hasGlobalBudget && (
          <BudgetBar
            emoji="💰"
            label="Presupuesto total"
            current={totalExpense}
            limit={monthlyBudget}
            formatAmount={formatAmount}
          />
        )}

        {/* Per-category bars */}
        {categoriesWithLimit.map(cat => (
          <BudgetBar
            key={cat.category_id ?? 'none'}
            emoji={cat.category_emoji}
            label={cat.category_name}
            current={cat.total}
            limit={cat.spending_limit!}
            formatAmount={formatAmount}
            color={cat.category_color}
          />
        ))}
      </div>
    </div>
  );
}

function BudgetBar({
  emoji,
  label,
  current,
  limit,
  formatAmount,
  color,
}: {
  emoji: string | null;
  label: string;
  current: number;
  limit: number;
  formatAmount: (n: number) => string;
  color?: string;
}) {
  const pct = Math.round((current / limit) * 100);
  const barWidth = Math.min(pct, 100);
  const barColor = getBarColor(pct);

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5 font-medium">
          <span>{emoji || '📁'}</span>
          <span>{label}</span>
        </span>
        <span className="tabular-nums" style={{ color: barColor }}>
          {formatAmount(current)} / {formatAmount(limit)}{' '}
          <span className="font-semibold">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: color && pct <= 60
              ? `linear-gradient(90deg, ${color}, ${color}cc)`
              : getBarGradient(pct),
          }}
        />
      </div>
    </div>
  );
}
