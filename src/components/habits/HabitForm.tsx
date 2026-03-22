'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import type { HabitFormData, HabitFrequency } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: HabitFormData) => Promise<unknown>;
  initial?: Partial<HabitFormData>;
  mode?: 'create' | 'edit';
}

const FREQ_OPTIONS: { value: HabitFrequency; label: string; desc: string; goalLabel: string; goalPlaceholder: string }[] = [
  { value: 'daily', label: 'Diario', desc: 'Se reinicia cada día', goalLabel: 'Meta diaria', goalPlaceholder: 'ej: 8 vasos, 30 minutos' },
  { value: 'weekly', label: 'Semanal', desc: 'Días por semana', goalLabel: 'Días por semana', goalPlaceholder: 'ej: 5 días' },
  { value: 'monthly', label: 'Mensual', desc: 'Días por mes', goalLabel: 'Días por mes', goalPlaceholder: 'ej: 20 días' },
];

const FREQ_UNIT_DEFAULTS: Record<HabitFrequency, string> = {
  daily: 'veces',
  weekly: 'días/semana',
  monthly: 'días/mes',
};

export function HabitForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode = 'create',
}: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🎯');
  const [iconColor, setIconColor] = useState(initial?.icon_color ?? '#06b6d4');
  const [frequency, setFrequency] = useState<HabitFrequency>(initial?.frequency ?? 'daily');
  const [dailyGoal, setDailyGoal] = useState(initial?.daily_goal ?? 1);
  const [unitLabel, setUnitLabel] = useState(initial?.unit_label ?? 'veces');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && initial) {
      setName(initial.name ?? '');
      setEmoji(initial.emoji ?? '🎯');
      setIconColor(initial.icon_color ?? '#06b6d4');
      setFrequency(initial.frequency ?? 'daily');
      setDailyGoal(initial.daily_goal ?? 1);
      setUnitLabel(initial.unit_label ?? 'veces');
    }
  }, [open, initial]);

  const handleFrequencyChange = (freq: HabitFrequency) => {
    setFrequency(freq);
    setUnitLabel(FREQ_UNIT_DEFAULTS[freq]);
    // Set sensible defaults
    if (freq === 'weekly') setDailyGoal(prev => prev > 7 ? 5 : prev);
    if (freq === 'monthly') setDailyGoal(prev => prev < 5 ? 20 : prev);
    if (freq === 'daily') setDailyGoal(prev => prev > 30 ? 1 : prev);
  };

  const selectedFreq = FREQ_OPTIONS.find(f => f.value === frequency)!;
  const maxGoal = frequency === 'weekly' ? 7 : frequency === 'monthly' ? 31 : 999;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (dailyGoal < 1) {
      setError('La meta debe ser al menos 1');
      return;
    }
    setLoading(true);
    setError('');
    const result = await onSubmit({
      name: name.trim(),
      emoji,
      icon_color: iconColor,
      frequency,
      daily_goal: Math.min(dailyGoal, maxGoal),
      unit_label: unitLabel.trim() || FREQ_UNIT_DEFAULTS[frequency],
    });
    setLoading(false);
    if (result) {
      onClose();
      if (mode === 'create') {
        setName('');
        setEmoji('🎯');
        setIconColor('#06b6d4');
        setFrequency('daily');
        setDailyGoal(1);
        setUnitLabel('veces');
      }
    } else {
      setError('Error al guardar. Intenta de nuevo.');
    }
  };

  const previewDesc = frequency === 'daily'
    ? `${dailyGoal} ${unitLabel} al día`
    : frequency === 'weekly'
      ? `${dailyGoal} días por semana`
      : `${dailyGoal} días por mes`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo hábito' : 'Editar hábito'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej: Meditación, Ejercicio, Lectura..."
              className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Frequency selector */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Frecuencia</p>
          <div className="flex gap-2">
            {FREQ_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFrequencyChange(opt.value)}
                className={cn(
                  'flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-all text-center',
                  frequency === opt.value
                    ? 'text-white shadow-sm'
                    : 'glass-button text-muted-foreground hover:text-foreground'
                )}
                style={frequency === opt.value ? { backgroundColor: iconColor } : undefined}
              >
                <div>{opt.label}</div>
                <div className={cn(
                  'text-[10px] mt-0.5',
                  frequency === opt.value ? 'text-white/70' : 'text-muted-foreground/60'
                )}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {selectedFreq.goalLabel}
            </label>
            <input
              type="number"
              min={1}
              max={maxGoal}
              value={dailyGoal}
              onChange={e => setDailyGoal(Math.max(1, Math.min(maxGoal, parseInt(e.target.value) || 1)))}
              className="mt-1 w-full px-4 py-2.5 rounded-xl glass-button text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unidad
            </label>
            <input
              type="text"
              value={unitLabel}
              onChange={e => setUnitLabel(e.target.value)}
              placeholder={selectedFreq.goalPlaceholder}
              className="mt-1 w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Color</p>
          <ColorPicker value={iconColor} onChange={setIconColor} />
        </div>

        {/* Preview */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: `linear-gradient(135deg, ${iconColor}20 0%, ${iconColor}0a 100%)`,
            borderLeft: `3px solid ${iconColor}`,
          }}
        >
          <span className="text-2xl">{emoji || '🎯'}</span>
          <div>
            <p className="font-semibold text-sm">{name || 'Nombre del hábito'}</p>
            <p className="text-xs text-muted-foreground">
              Meta: {previewDesc}
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
            style={{ backgroundColor: iconColor }}
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear hábito' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
