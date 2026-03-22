'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { TransactionRow } from '@/components/finances/TransactionRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import type { TransactionWithCategory } from '@/lib/types/database';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  loading: boolean;
  formatAmount: (amount: number) => string;
  onEdit: (t: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({
  transactions,
  loading,
  formatAmount,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll({ items: transactions });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="💳"
        title="Sin transacciones"
        description="Agrega tu primera transacción o importa un extracto bancario"
      />
    );
  }

  return (
    <motion.div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {visibleItems.map(t => (
          <TransactionRow
            key={t.id}
            transaction={t}
            formatAmount={formatAmount}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>

      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-4">
          <Loader2 size={18} className="animate-spin text-muted-foreground/50" />
        </div>
      )}
    </motion.div>
  );
}
