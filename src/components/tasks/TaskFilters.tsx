'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TaskStatus } from '@/lib/types/database';

type StatusFilter = 'all' | TaskStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'completed', label: 'Completados' },
  { value: 'failed', label: 'Fallidos' },
];

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  categoryColor?: string;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryColor = '#3b82f6',
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar objetivos..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 glass-card rounded-2xl p-1.5">
        {FILTERS.map(filter => (
          <button
            key={filter.value}
            onClick={() => onStatusChange(filter.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              statusFilter === filter.value
                ? 'text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            style={statusFilter === filter.value ? { backgroundColor: categoryColor } : undefined}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
