'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import type { SavingFormData } from '@/lib/types/database';
import { CATEGORY_COLORS } from '@/constants/colors';

interface SavingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SavingFormData) => Promise<unknown>;
  initial?: Partial<SavingFormData>;
  mode?: 'create' | 'edit';
}

export function SavingForm({ open, onClose, onSubmit, initial, mode = 'create' }: SavingFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💰');
  const [color, setColor] = useState(initial?.color ?? '#10b981');
  const [targetAmount, setTargetAmount] = useState<string>(
    initial?.target_amount != null ? String(initial.target_amount) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && initial) {
      setName(initial.name ?? '');
      setEmoji(initial.emoji ?? '💰');
      setColor(initial.color ?? '#10b981');
      setTargetAmount(initial.target_amount != null ? String(initial.target_amount) : '');
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    setLoading(true);
    setError('');
    try {
      const parsed = targetAmount.trim() ? parseFloat(targetAmount) : null;
      const result = await onSubmit({
        name: name.trim(),
        emoji: emoji || null,
        color,
        target_amount: parsed && parsed > 0 ? parsed : null,
      });
      if (result) {
        onClose();
        if (mode === 'create') {
          setName(''); setEmoji('💰'); setColor('#10b981'); setTargetAmount('');
        }
      } else {
        setError('Error al guardar. Intenta de nuevo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'create' ? 'Nueva meta de ahorro' : 'Editar meta'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej: Vacaciones, Emergencias..."
            className="flex-1 px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
            autoFocus
          />
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Meta (opcional)
          </p>
          <input
            type="number"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            placeholder="Sin meta definida"
            min="0"
            step="0.01"
            className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
          />
        </div>

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
          <span className="text-2xl">{emoji || '💰'}</span>
          <div>
            <p className="font-semibold text-sm">{name || 'Nombre de meta'}</p>
            <p className="text-xs text-muted-foreground">
              {targetAmount && parseFloat(targetAmount) > 0 ? `Meta: ${targetAmount}` : 'Sin meta definida'}
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm glass-button">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear meta' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
