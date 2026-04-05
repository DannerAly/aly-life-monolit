'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Saving, SavingMovementFormData } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface SavingMovementFormProps {
  open: boolean;
  onClose: () => void;
  saving: Saving | null;
  defaultType?: 'deposit' | 'withdrawal';
  onSubmit: (data: SavingMovementFormData) => Promise<boolean>;
}

export function SavingMovementForm({ open, onClose, saving, defaultType = 'deposit', onSubmit }: SavingMovementFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<'deposit' | 'withdrawal'>(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setAmount('');
      setDescription('');
      setDate(today);
      setError('');
    }
  }, [open, defaultType, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError('Ingresa un monto válido'); return; }
    if (type === 'withdrawal' && saving && parsed > saving.current_amount) {
      setError(`Fondos insuficientes. Disponible: ${saving.current_amount}`);
      return;
    }
    setLoading(true);
    setError('');
    const ok = await onSubmit({ type, amount: parsed, description: description.trim() || undefined, date });
    setLoading(false);
    if (ok) onClose();
    else setError('Error al guardar. Intenta de nuevo.');
  };

  if (!saving) return null;

  return (
    <Modal open={open} onClose={onClose} title={type === 'deposit' ? 'Depositar' : 'Retirar'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Saving info */}
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: `${saving.color}15`, borderLeft: `3px solid ${saving.color}` }}
        >
          <span className="text-xl">{saving.emoji || '💰'}</span>
          <div>
            <p className="font-semibold text-sm">{saving.name}</p>
            <p className="text-xs text-muted-foreground">Disponible: {saving.current_amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Type toggle */}
        <div className="flex gap-1 glass-card rounded-2xl p-1">
          {(['deposit', 'withdrawal'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                type === t
                  ? t === 'deposit' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'deposit' ? 'Depositar' : 'Retirar'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Monto</p>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Descripción (opcional)</p>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="ej: Depósito mensual..."
            className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
          />
        </div>

        {/* Date */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Fecha</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-button text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
          />
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm glass-button">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50',
              type === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
            )}
          >
            {loading ? 'Guardando...' : type === 'deposit' ? 'Depositar' : 'Retirar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
