'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName, prevMonth, nextMonth } from '@/lib/utils/finance';

interface MonthSelectorProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(prevMonth(month))}
        className="glass-button rounded-xl p-2 hover:scale-105 transition-transform"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold min-w-[150px] text-center capitalize">
        {getMonthName(month)}
      </span>
      <button
        onClick={() => onChange(nextMonth(month))}
        className="glass-button rounded-xl p-2 hover:scale-105 transition-transform"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
