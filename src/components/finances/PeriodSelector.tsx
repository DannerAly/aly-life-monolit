'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PeriodView } from '@/lib/types/database';
import { getPeriodLabel, prevPeriod, nextPeriod } from '@/lib/utils/finance';
import { cn } from '@/lib/utils/cn';

interface PeriodSelectorProps {
  period: string;
  view: PeriodView;
  onPeriodChange: (period: string) => void;
  onViewChange: (view: PeriodView) => void;
}

const VIEW_OPTIONS: { value: PeriodView; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

export function PeriodSelector({
  period,
  view,
  onPeriodChange,
  onViewChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* View toggle */}
      <div className="flex gap-1 glass-card rounded-2xl p-1">
        {VIEW_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onViewChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              view === opt.value
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPeriodChange(prevPeriod(period, view))}
          className="glass-button rounded-xl p-2 hover:scale-105 transition-transform"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold min-w-[180px] text-center capitalize">
          {getPeriodLabel(period, view)}
        </span>
        <button
          onClick={() => onPeriodChange(nextPeriod(period, view))}
          className="glass-button rounded-xl p-2 hover:scale-105 transition-transform"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
