'use client';

import { useState } from 'react';
import { COMMON_EMOJIS } from '@/constants/emojis';
import { cn } from '@/lib/utils/cn';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-xl hover:scale-105 transition-transform"
      >
        {value || '🎯'}
      </button>
      {open && (
        <div className="absolute top-12 left-0 z-50 glass rounded-2xl p-3 grid grid-cols-8 gap-1 shadow-xl min-w-[280px]">
          {COMMON_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors',
                value === emoji && 'bg-white/30 dark:bg-white/20'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
