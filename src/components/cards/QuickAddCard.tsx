'use client';

import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QuickAddCardProps {
  onClick: () => void;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function QuickAddCard({ onClick, label = 'Nueva área', sublabel = 'Trabajo, Salud, Estudio...', className }: QuickAddCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'glass-card border-2 border-dashed border-white/30 dark:border-white/15 flex flex-col items-center justify-center gap-3 p-6 text-center group cursor-pointer hover:border-blue-400/50 transition-colors',
        className
      )}
    >
      <motion.div
        className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center group-hover:bg-blue-500/20 transition-colors"
        whileHover={{ rotate: 90 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Plus size={22} className="text-muted-foreground group-hover:text-blue-500 transition-colors" />
      </motion.div>
      <div>
        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          {sublabel}
        </p>
      </div>
    </motion.button>
  );
}
