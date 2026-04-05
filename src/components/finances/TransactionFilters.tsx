'use client';

import { Search, X } from 'lucide-react';
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
  const hasActiveFilter = typeFilter !== 'all' || categoryFilter !== 'all' || searchQuery;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Row 1: search + type pills */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar transacción..."
            className="w-full pl-9 pr-8 py-2 rounded-xl glass-button text-xs bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex gap-1 glass-card rounded-2xl p-1 shrink-0">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                typeFilter === opt.value
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: category pills (scrollable) */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0',
              categoryFilter === 'all'
                ? 'bg-foreground text-background shadow-sm'
                : 'glass-button text-muted-foreground hover:text-foreground'
            )}
          >
            Todas
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(categoryFilter === c.id ? 'all' : c.id)}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1',
                categoryFilter === c.id
                  ? 'text-white shadow-sm'
                  : 'glass-button text-muted-foreground hover:text-foreground'
              )}
              style={categoryFilter === c.id ? { backgroundColor: c.color } : { borderLeft: `2px solid ${c.color}` }}
            >
              {c.emoji && <span>{c.emoji}</span>}
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
