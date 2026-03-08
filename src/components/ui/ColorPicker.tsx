'use client';

import { CATEGORY_COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils/cn';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {CATEGORY_COLORS.map(color => (
        <button
          key={color.hex}
          type="button"
          onClick={() => onChange(color.hex)}
          title={color.name}
          className={cn(
            'w-8 h-8 rounded-full transition-all duration-200 hover:scale-110',
            value === color.hex && 'ring-2 ring-offset-2 ring-offset-background scale-110'
          )}
          style={{
            backgroundColor: color.hex,
            boxShadow: value === color.hex ? `0 0 0 3px ${color.hex}40` : undefined,
          }}
        />
      ))}
    </div>
  );
}
