'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import type { FinanceCategoryFormData, FinanceCategoryType } from '@/lib/types/database';
import { CATEGORY_COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils/cn';

interface FinanceCategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FinanceCategoryFormData) => Promise<unknown>;
  initial?: Partial<FinanceCategoryFormData>;
  mode?: 'create' | 'edit';
}

const TYPE_OPTIONS: { value: FinanceCategoryType; label: string }[] = [
  { value: 'expense', label: 'Egreso' },
  { value: 'income', label: 'Ingreso' },
  { value: 'both', label: 'Ambos' },
];

export function FinanceCategoryForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode = 'create',
}: FinanceCategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💰');
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0].hex);
  const [type, setType] = useState<FinanceCategoryType>(initial?.type ?? 'expense');
  const [spendingLimit, setSpendingLimit] = useState<string>(
    initial?.spending_limit != null ? String(initial.spending_limit) : ''
  );
  const [isReserved, setIsReserved] = useState(initial?.is_reserved ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && initial) {
      setName(initial.name ?? '');
      setEmoji(initial.emoji ?? '💰');
      setColor(initial.color ?? CATEGORY_COLORS[0].hex);
      setType(initial.type ?? 'expense');
      setSpendingLimit(initial.spending_limit != null ? String(initial.spending_limit) : '');
      setIsReserved(initial.is_reserved ?? false);
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setLoading(true);
    setError('');
    const parsedLimit = spendingLimit.trim() ? parseFloat(spendingLimit) : null;
    const effectiveLimit = parsedLimit && parsedLimit > 0 ? parsedLimit : null;
    const result = await onSubmit({
      name: name.trim(),
      emoji,
      color,
      type,
      spending_limit: effectiveLimit,
      is_reserved: effectiveLimit ? isReserved : false,
    });
    setLoading(false);
    if (result) {
      onClose();
      if (mode === 'create') {
        setName('');
        setEmoji('💰');
        setColor(CATEGORY_COLORS[0].hex);
        setType('expense');
        setSpendingLimit('');
      }
    } else {
      setError('Error al guardar. Intenta de nuevo.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva categoría financiera' : 'Editar categoría'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej: Comida, Transporte, Salario..."
              className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Type selector */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tipo</p>
          <div className="flex gap-1 glass-card rounded-2xl p-1">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                  type === opt.value
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spending limit - only for expense/both */}
        {(type === 'expense' || type === 'both') && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Límite de gasto mensual
              </p>
              <input
                type="number"
                value={spendingLimit}
                onChange={e => setSpendingLimit(e.target.value)}
                placeholder="Sin límite"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
              />
            </div>
            {spendingLimit.trim() && parseFloat(spendingLimit) > 0 && (
              <button
                type="button"
                onClick={() => setIsReserved(p => !p)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all border',
                  isReserved
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    : 'glass-button border-transparent text-muted-foreground'
                )}
              >
                <span className="font-medium">🔒 Reservar del balance</span>
                <span className={cn(
                  'w-9 h-5 rounded-full transition-colors flex items-center px-0.5',
                  isReserved ? 'bg-amber-500' : 'bg-muted'
                )}>
                  <span className={cn(
                    'w-4 h-4 rounded-full bg-white shadow transition-transform',
                    isReserved ? 'translate-x-4' : 'translate-x-0'
                  )} />
                </span>
              </button>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Color</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {/* Preview */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: `linear-gradient(135deg, ${color}20 0%, ${color}0a 100%)`,
            borderLeft: `3px solid ${color}`,
          }}
        >
          <span className="text-2xl">{emoji || '📁'}</span>
          <div>
            <p className="font-semibold text-sm">{name || 'Nombre de categoría'}</p>
            <p className="text-xs text-muted-foreground">
              {type === 'income' ? 'Ingreso' : type === 'expense' ? 'Egreso' : 'Ingreso y Egreso'}
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm glass-button"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear categoría' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
