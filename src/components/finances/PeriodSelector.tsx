'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PeriodView } from '@/lib/types/database';
import { getPeriodLabel, prevPeriod, nextPeriod, formatCustomRangeLabel } from '@/lib/utils/finance';
import { cn } from '@/lib/utils/cn';

interface PeriodSelectorProps {
  period: string;
  view: PeriodView;
  onPeriodChange: (period: string) => void;
  onViewChange: (view: PeriodView) => void;
  customRange?: { from: string; to: string } | null;
  onCustomRangeChange?: (range: { from: string; to: string }) => void;
}

const VIEW_OPTIONS: { value: PeriodView; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'custom', label: 'Rango' },
];

export function PeriodSelector({
  period,
  view,
  onPeriodChange,
  onViewChange,
  customRange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
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

        {/* Period navigation (hidden for custom) */}
        {view !== 'custom' && (
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
        )}

        {/* Custom range label */}
        {view === 'custom' && customRange && (
          <span className="text-sm font-semibold text-center">
            {formatCustomRangeLabel(customRange.from, customRange.to)}
          </span>
        )}
      </div>

      {/* Custom date pickers */}
      {view === 'custom' && onCustomRangeChange && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            value={customRange?.from ?? ''}
            onChange={e => {
              const from = e.target.value;
              if (from && customRange?.to) {
                onCustomRangeChange({ from, to: customRange.to });
              } else if (from) {
                onCustomRangeChange({ from, to: from });
              }
            }}
            className="px-3 py-1.5 rounded-xl glass-button text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={customRange?.to ?? ''}
            onChange={e => {
              const to = e.target.value;
              if (to && customRange?.from) {
                onCustomRangeChange({ from: customRange.from, to });
              }
            }}
            className="px-3 py-1.5 rounded-xl glass-button text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      )}
    </div>
  );
}
