'use client';

import { Search } from 'lucide-react';
import type { TransactionType, FinanceCategory } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface TransactionFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: 'all' | TransactionType;
  setTypeFilter: (t: 'all' | TransactionType) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  categories: FinanceCategory[];
}

const TYPE_OPTIONS = [
  { value: 'all' as const, label: 'Todo' },
  { value: 'income' as const, label: 'Ingresos' },
  { value: 'expense' as const, label: 'Egresos' },
];

export function TransactionFilters({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar transacción..."
          className="w-full pl-9 pr-3 py-2 rounded-xl glass-button text-xs bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      {/* Type pills */}
      <div className="flex gap-1 glass-card rounded-2xl p-1">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={cn(
              'px-3 py-1 rounded-xl text-xs font-medium transition-all',
              typeFilter === opt.value
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category select */}
      <select
        value={categoryFilter}
        onChange={e => setCategoryFilter(e.target.value)}
        className="glass-button rounded-xl px-3 py-2 text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <option value="all">Todas las categorías</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.emoji ? `${c.emoji} ` : ''}{c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
