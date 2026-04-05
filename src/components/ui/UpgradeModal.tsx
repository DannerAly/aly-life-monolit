'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Infinity, BarChart2, FileUp, SlidersHorizontal, Star } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Which feature triggered the upgrade prompt */
  feature?: string;
}

const BENEFITS = [
  { icon: Infinity, text: 'Categorías, hábitos y finanzas ilimitados' },
  { icon: BarChart2, text: 'Historial completo de transacciones' },
  { icon: FileUp, text: 'Importar extractos en CSV' },
  { icon: SlidersHorizontal, text: 'Reglas de clasificación automática' },
  { icon: Star, text: 'Metas de ahorro ilimitadas' },
  { icon: Zap, text: 'Acceso prioritario a nuevas funciones' },
];

const KOFI_URL = process.env.NEXT_PUBLIC_KOFI_URL ?? 'https://ko-fi.com';

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 glass-card p-6 rounded-2xl"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 glass-button rounded-xl p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">Pasate a Pro</h2>
                {feature && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Para usar esta función necesitás Pro
                  </p>
                )}
              </div>
            </div>

            {/* Benefits */}
            <ul className="space-y-2.5 mb-6">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-amber-500" />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {/* Pricing hint */}
            <p className="text-xs text-center text-muted-foreground mb-4">
              Desde <span className="font-semibold text-foreground">$5 USD/mes</span> · Sin publicidad · Cancelá cuando quieras
            </p>

            {/* CTA */}
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
            >
              <Zap size={16} />
              Obtener Pro
            </a>
            <p className="text-[11px] text-center text-muted-foreground mt-3">
              Pagás y avisás — activamos tu cuenta en minutos
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
