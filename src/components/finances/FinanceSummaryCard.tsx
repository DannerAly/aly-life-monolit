'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';
import type { MonthlySummary } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

export interface BudgetAlert {
  name: string;
  emoji: string | null;
  percentage: number;
}

interface FinanceSummaryCardProps {
  summary: MonthlySummary;
  formatAmount: (amount: number) => string;
  periodLabel?: string;
  className?: string;
  budgetAlerts?: BudgetAlert[];
}

export function FinanceSummaryCard({ summary, formatAmount, periodLabel = 'del mes', className, budgetAlerts = [] }: FinanceSummaryCardProps) {
  const { totalIncome, totalExpense, balance } = summary;
  const ratio = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
  const isPositive = balance >= 0;

  const getMotivation = () => {
    if (totalIncome === 0 && totalExpense === 0) return 'Registra tus movimientos para ver tu resumen';
    if (balance > 0 && ratio < 50) return 'Excelente control de gastos';
    if (balance > 0) return 'Vas bien, sigue ahorrando';
    if (balance === 0) return 'Equilibrio justo, intenta ahorrar un poco';
    return 'Ojo, gastas más de lo que ingresas';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'glass-card p-7 flex flex-col justify-between overflow-hidden relative',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(14,165,233,0.08) 50%, rgba(59,130,246,0.06) 100%)',
      }}
    >
      {/* Decorative orb */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
      />

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Resumen {periodLabel}
        </p>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
          Mis Finanzas
        </h1>
        <p className="mt-3 text-sm text-muted-foreground italic">
          {getMotivation()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <StatPill
          icon={<TrendingUp size={14} />}
          label="Ingresos"
          value={formatAmount(totalIncome)}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <StatPill
          icon={<TrendingDown size={14} />}
          label="Egresos"
          value={formatAmount(totalExpense)}
          color="text-rose-500"
          bg="bg-rose-500/10"
        />
        <StatPill
          icon={<Wallet size={14} />}
          label="Balance"
          value={formatAmount(balance)}
          color={isPositive ? 'text-blue-500' : 'text-rose-500'}
          bg={isPositive ? 'bg-blue-500/10' : 'bg-rose-500/10'}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Gastos / Ingresos</span>
          <span className="font-semibold text-foreground">{Math.round(ratio)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ratio}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{
              background: ratio > 80
                ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                : 'linear-gradient(90deg, #10b981, #0ea5e9)',
            }}
          />
        </div>
      </div>

      {budgetAlerts.length > 0 && (
        <div className="mt-3 space-y-1">
          {budgetAlerts.map(alert => (
            <div
              key={alert.name}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: alert.percentage >= 100 ? '#ef4444' : '#f97316' }}
            >
              <AlertTriangle size={12} />
              <span>
                {alert.emoji} {alert.name} al {alert.percentage}% del límite
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn('rounded-2xl p-3 text-center backdrop-blur-sm', bg)}>
      <div className={cn('flex items-center justify-center gap-1 mb-1', color)}>
        {icon}
      </div>
      <p className={cn('text-sm font-bold tabular-nums truncate', color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
