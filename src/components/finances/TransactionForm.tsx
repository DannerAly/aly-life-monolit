'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { TransactionFormData, TransactionType, FinanceCategory } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<unknown>;
  initial?: Partial<TransactionFormData>;
  mode?: 'create' | 'edit';
  categories: FinanceCategory[];
}

export function TransactionForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode = 'create',
  categories,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && initial) {
      setType(initial.type ?? 'expense');
      setAmount(initial.amount?.toString() ?? '');
      setDescription(initial.description ?? '');
      setDate(initial.date ?? new Date().toISOString().slice(0, 10));
      setCategoryId(initial.category_id ?? '');
    }
  }, [open, initial]);

  const filteredCategories = categories.filter(
    c => c.type === 'both' || c.type === type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!date) {
      setError('La fecha es requerida');
      return;
    }
    setLoading(true);
    setError('');

    const result = await onSubmit({
      type,
      amount: parsedAmount,
      description: description.trim(),
      date,
      category_id: categoryId || undefined,
    });

    setLoading(false);
    if (result) {
      onClose();
      if (mode === 'create') {
        setAmount('');
        setDescription('');
        setCategoryId('');
      }
    } else {
      setError('Error al guardar. Intenta de nuevo.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva transacción' : 'Editar transacción'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type toggle */}
        <div className="flex gap-1 glass-card rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              'flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Egreso
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={cn(
              'flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Ingreso
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Monto
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full px-4 py-2.5 rounded-xl glass-button text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/40 tabular-nums"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="ej: Almuerzo, Salario, Uber..."
            className="mt-1 w-full px-4 py-2.5 rounded-xl glass-button text-sm bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Category + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl glass-button text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">Sin categoría</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? `${c.emoji} ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl glass-button text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
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
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 hover:opacity-90',
              type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
            )}
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
