'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { MoreHorizontal, Plus, Minus, Pencil, Trash2 } from 'lucide-react';
import type { Saving } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface SavingCardProps {
  saving: Saving;
  formatAmount: (n: number) => string;
  onDeposit: () => void;
  onWithdraw: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SavingCard({ saving, formatAmount, onDeposit, onWithdraw, onEdit, onDelete }: SavingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const progress = saving.target_amount && saving.target_amount > 0
    ? Math.min((saving.current_amount / saving.target_amount) * 100, 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex flex-col gap-3 relative"
      style={{ borderLeft: `3px solid ${saving.color}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{saving.emoji || '💰'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{saving.name}</p>
            {saving.target_amount && (
              <p className="text-xs text-muted-foreground">
                Meta: {formatAmount(saving.target_amount)}
              </p>
            )}
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="glass-button rounded-xl p-1.5 hover:scale-105 transition-transform"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 glass-card rounded-xl shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                >
                  <Pencil size={12} /> Editar
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-2xl font-bold tabular-nums" style={{ color: saving.color }}>
          {formatAmount(saving.current_amount)}
        </p>
        {saving.target_amount && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatAmount(saving.target_amount - saving.current_amount)} restante
          </p>
        )}
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{Math.round(progress)}%</span>
            {progress >= 100 && <span className="text-emerald-500 font-medium">¡Meta alcanzada!</span>}
          </div>
          <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: saving.color }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onDeposit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
        >
          <Plus size={12} /> Depositar
        </button>
        <button
          onClick={onWithdraw}
          disabled={saving.current_amount <= 0}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
            saving.current_amount > 0
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
              : 'opacity-40 cursor-not-allowed glass-button'
          )}
        >
          <Minus size={12} /> Retirar
        </button>
      </div>
    </motion.div>
  );
}
