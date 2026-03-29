'use client';

import { motion } from 'motion/react';
import type { CategoryBreakdown } from '@/lib/types/database';

interface DonutChartProps {
  data: CategoryBreakdown[];
  total: string;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({ data, total, size = 180, strokeWidth = 28 }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Group small slices into "Otros"
  const threshold = 5;
  const mainSlices: CategoryBreakdown[] = [];
  let othersTotal = 0;
  let othersCount = 0;

  for (const d of data) {
    if (d.percentage < threshold) {
      othersTotal += d.total;
      othersCount += d.count;
    } else {
      mainSlices.push(d);
    }
  }

  const totalAmount = data.reduce((s, d) => s + d.total, 0);

  if (othersTotal > 0) {
    mainSlices.push({
      category_id: null,
      category_name: 'Otros',
      category_emoji: null,
      category_color: '#6b7280',
      total: othersTotal,
      percentage: totalAmount > 0 ? Math.round((othersTotal / totalAmount) * 100) : 0,
      count: othersCount,
      spending_limit: null,
    });
  }

  // Compute offsets
  let accumulated = 0;
  const slices = mainSlices.map(s => {
    const fraction = totalAmount > 0 ? s.total / totalAmount : 0;
    const offset = accumulated;
    accumulated += fraction;
    return { ...s, fraction, offset };
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <svg width={size} height={size}>
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none" stroke="currentColor" strokeWidth={strokeWidth}
            className="text-white/10"
          />
        </svg>
        <p className="text-xs mt-3">Sin gastos este mes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none" stroke="currentColor" strokeWidth={strokeWidth}
            className="text-white/5"
          />
          {/* Segments */}
          {slices.map((s, i) => (
            <motion.circle
              key={s.category_name}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={s.category_color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: circumference - s.fraction * circumference,
              }}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform: `rotate(${s.offset * 360}deg)`,
              }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-bold tabular-nums">{total}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 w-full space-y-1.5">
        {slices.map(s => (
          <div key={s.category_name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.category_color }}
              />
              <span className="truncate">
                {s.category_emoji ? `${s.category_emoji} ` : ''}{s.category_name}
              </span>
            </div>
            <span className="text-muted-foreground tabular-nums ml-2">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
