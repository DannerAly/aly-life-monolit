'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { EMOJI_CATEGORIES, searchEmojis } from '@/constants/emojis';
import { cn } from '@/lib/utils/cn';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch('');
  };

  const searchResults = search ? searchEmojis(search) : null;

  return (
    <div className={cn('relative', className)} ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-xl hover:scale-105 transition-transform"
      >
        {value || '🎯'}
      </button>

      {open && (
        <div className="absolute top-12 left-0 z-50 glass rounded-2xl shadow-xl w-[320px] overflow-hidden">
          {/* Search bar */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar emoji..."
                className="w-full pl-8 pr-8 py-2 rounded-xl glass-button text-xs bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Emoji grid - scrollable */}
          <div className="max-h-[280px] overflow-y-auto p-2 scrollbar-thin">
            {searchResults ? (
              // Search results
              searchResults.length > 0 ? (
                <div className="grid grid-cols-8 gap-1">
                  {searchResults.map(emoji => (
                    <EmojiButton
                      key={emoji}
                      emoji={emoji}
                      selected={value === emoji}
                      onClick={() => handleSelect(emoji)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No se encontraron emojis
                </p>
              )
            ) : (
              // Categories
              EMOJI_CATEGORIES.map(cat => (
                <div key={cat.name} className="mb-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1.5 sticky top-0 bg-inherit">
                    {cat.name}
                  </p>
                  <div className="grid grid-cols-8 gap-1">
                    {cat.emojis.map(emoji => (
                      <EmojiButton
                        key={emoji}
                        emoji={emoji}
                        selected={value === emoji}
                        onClick={() => handleSelect(emoji)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmojiButton({ emoji, selected, onClick }: { emoji: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors',
        selected && 'bg-white/30 dark:bg-white/20 ring-1 ring-blue-500/30'
      )}
    >
      {emoji}
    </button>
  );
}
