'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import type { TaskFormData, Task } from '@/lib/types/database';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<Task | null | boolean>;
  initial?: Partial<TaskFormData>;
  mode?: 'create' | 'edit';
  categoryColor?: string;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode = 'create',
  categoryColor = '#6366f1',
}: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🎯');
  const [taskType, setTaskType] = useState<'one_time' | 'repetition'>(initial?.task_type ?? 'one_time');
  const [targetValue, setTargetValue] = useState(initial?.target_value ?? 5);
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '');
  const [subFilter, setSubFilter] = useState(initial?.sub_filter ?? '');
  const [priority, setPriority] = useState<number | null>(initial?.priority ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setLoading(true);
    setError('');
    const result = await onSubmit({
      title: title.trim(),
      emoji,
      task_type: taskType,
      target_value: taskType === 'one_time' ? 1 : targetValue,
      due_date: dueDate || undefined,
      sub_filter: subFilter || undefined,
      priority,
    });
    setLoading(false);
    if (result) {
      onClose();
      if (mode === 'create') {
        setTitle('');
        setEmoji('🎯');
        setTaskType('one_time');
        setTargetValue(5);
        setDueDate('');
        setSubFilter('');
        setPriority(null);
      }
    } else {
      setError('Error al guardar. Intenta de nuevo.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo objetivo' : 'Editar objetivo'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title + Emoji */}
        <div className="flex items-center gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="ej: Haz 10 paseos por la montaña"
            className="flex-1 px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
            autoFocus
          />
        </div>

        {/* Task Type Toggle */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tipo</p>
          <div className="flex gap-2">
            {([
              { value: 'one_time', label: 'Una vez', desc: 'Hazla y listo' },
              { value: 'repetition', label: 'Repetición', desc: 'N veces para completar' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTaskType(opt.value)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm transition-all ${
                  taskType === opt.value
                    ? 'text-white font-medium'
                    : 'glass-button text-muted-foreground'
                }`}
                style={taskType === opt.value ? { backgroundColor: categoryColor } : undefined}
              >
                <p className="font-medium">{opt.label}</p>
                <p className={`text-xs mt-0.5 ${taskType === opt.value ? 'text-white/70' : 'text-muted-foreground/60'}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Target value (only for repetition) */}
        {taskType === 'repetition' && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Meta (número de veces)
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTargetValue(v => Math.max(2, v - 1))}
                className="glass-button rounded-xl w-10 h-10 flex items-center justify-center text-lg font-bold"
              >
                −
              </button>
              <span className="text-2xl font-bold tabular-nums w-12 text-center">{targetValue}</span>
              <button
                type="button"
                onClick={() => setTargetValue(v => v + 1)}
                className="glass-button rounded-xl w-10 h-10 flex items-center justify-center text-lg font-bold"
              >
                +
              </button>
              <span className="text-sm text-muted-foreground">veces</span>
            </div>
          </div>
        )}

        {/* Sub filter */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Categoría interna <span className="normal-case font-normal">(opcional)</span>
          </p>
          <input
            type="text"
            value={subFilter}
            onChange={e => setSubFilter(e.target.value)}
            placeholder="ej: Deportivo, Académico, Personal..."
            className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
          />
        </div>

        {/* Priority */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Prioridad <span className="normal-case font-normal">(opcional)</span>
          </p>
          <div className="flex gap-2">
            {([
              { value: 1, label: '🔴 Alta' },
              { value: 2, label: '🟡 Media' },
              { value: 3, label: '🔵 Baja' },
              { value: null, label: 'Sin prioridad' },
            ] as const).map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                  priority === opt.value
                    ? 'text-white'
                    : 'glass-button text-muted-foreground'
                }`}
                style={priority === opt.value ? { backgroundColor: categoryColor } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Fecha límite <span className="normal-case font-normal">(opcional)</span>
          </p>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-button text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-transparent"
          />
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
            className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: categoryColor }}
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear objetivo' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
