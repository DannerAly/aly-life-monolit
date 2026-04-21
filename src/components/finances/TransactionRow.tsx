'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2 } from 'lucide-react';
import type { TransactionWithCategory } from '@/lib/types/database';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface TransactionRowProps {
  transaction: TransactionWithCategory;
  formatAmount: (amount: number) => string;
  onEdit: (t: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
}

function TransactionRowBase({
  transaction: t,
  formatAmount,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = t.type === 'income';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-4 flex items-center gap-3 group"
    >
      {/* Category emoji */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{
          backgroundColor: t.category_color ? `${t.category_color}20` : 'rgba(107,114,128,0.15)',
        }}
      >
        {t.category_emoji || (isIncome ? '💰' : '💸')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{t.description || 'Sin descripción'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
          {t.category_name && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">{t.category_name}</span>
            </>
          )}
          {t.is_imported && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Importado
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <p className={cn(
        'text-sm font-bold tabular-nums flex-shrink-0',
        isIncome ? 'text-emerald-500' : 'text-rose-500'
      )}>
        {isIncome ? '+' : '-'}{formatAmount(t.amount)}
      </p>

      {/* Actions — always visible on mobile, hover only on desktop */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(t)}
          className="glass-button rounded-lg p-1.5 hover:scale-105 transition-transform"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onDelete(t.id)}
          className="glass-button rounded-lg p-1.5 hover:scale-105 transition-transform text-rose-400"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export const TransactionRow = memo(TransactionRowBase, (prev, next) => {
  const p = prev.transaction;
  const n = next.transaction;
  return (
    p.id === n.id &&
    p.amount === n.amount &&
    p.description === n.description &&
    p.date === n.date &&
    p.type === n.type &&
    p.category_id === n.category_id &&
    p.category_name === n.category_name &&
    p.category_color === n.category_color &&
    p.category_emoji === n.category_emoji &&
    prev.formatAmount === next.formatAmount
  );
});
