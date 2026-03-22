'use client';

import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function CardActions({ onEdit, onDelete }: CardActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="absolute top-2 right-10 z-20 glass-button rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical size={14} className="text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute top-10 right-4 z-30 glass-card min-w-[140px] p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onEdit(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-white/10 transition-colors text-left"
              >
                <Pencil size={13} />
                Editar
              </button>
              <button
                onClick={() => { onDelete(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-left"
              >
                <Trash2 size={13} />
                Eliminar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
