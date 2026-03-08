'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import type { CategoryFormData, Category } from '@/lib/types/database';
import { CATEGORY_COLORS } from '@/constants/colors';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<Category | null | boolean>;
  initial?: Partial<CategoryFormData>;
  mode?: 'create' | 'edit';
}

export function CategoryForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode = 'create',
}: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🎯');
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0].hex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setLoading(true);
    setError('');
    const result = await onSubmit({ name: name.trim(), emoji, color });
    setLoading(false);
    if (result) {
      onClose();
      if (mode === 'create') {
        setName('');
        setEmoji('🎯');
        setColor(CATEGORY_COLORS[0].hex);
      }
    } else {
      setError('Error al guardar. Intenta de nuevo.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva área de vida' : 'Editar área'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej: Trabajo, Salud, Startup..."
              className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
              autoFocus
            />
          </div>
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
          <span className="text-2xl">{emoji || '📁'}</span>
          <div>
            <p className="font-semibold text-sm">{name || 'Nombre del área'}</p>
            <p className="text-xs text-muted-foreground">0 objetivos</p>
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
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear área' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
