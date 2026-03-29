'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';

interface FinanceSettingsModalProps {
  open: boolean;
  onClose: () => void;
  cycleDay: number;
  onCycleDayChange: (day: number) => Promise<void>;
  monthlyBudget: number | null;
  onMonthlyBudgetChange: (amount: number | null) => Promise<void>;
}

export function FinanceSettingsModal({
  open,
  onClose,
  cycleDay,
  onCycleDayChange,
  monthlyBudget,
  onMonthlyBudgetChange,
}: FinanceSettingsModalProps) {
  const [localCycleDay, setLocalCycleDay] = useState(cycleDay);
  const [localBudget, setLocalBudget] = useState(monthlyBudget != null ? String(monthlyBudget) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalCycleDay(cycleDay);
      setLocalBudget(monthlyBudget != null ? String(monthlyBudget) : '');
    }
  }, [open, cycleDay, monthlyBudget]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onCycleDayChange(localCycleDay);
      const parsedBudget = localBudget.trim() ? parseFloat(localBudget) : null;
      await onMonthlyBudgetChange(parsedBudget && parsedBudget > 0 ? parsedBudget : null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajustes financieros">
      <div className="space-y-6">
        {/* Cycle day */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            Día de inicio del ciclo
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Si cobras el 15, configura 15 para que tu mes financiero vaya del 15 al 14 del mes siguiente.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={28}
              value={localCycleDay}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (v >= 1 && v <= 28) setLocalCycleDay(v);
              }}
              className="w-20 px-3 py-2.5 rounded-xl glass-button text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
            />
            <span className="text-sm text-muted-foreground">
              {localCycleDay === 1
                ? 'Mes natural (1 al último día)'
                : `Del ${localCycleDay} al ${localCycleDay - 1} del mes siguiente`}
            </span>
          </div>
        </div>

        {/* Monthly budget */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            Presupuesto mensual global
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Tope total de gasto por período. Déjalo vacío si no quieres un límite global.
          </p>
          <input
            type="number"
            value={localBudget}
            onChange={e => setLocalBudget(e.target.value)}
            placeholder="Sin límite"
            min="0"
            step="0.01"
            className="w-full px-4 py-2.5 rounded-xl glass-button text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-transparent"
          />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm glass-button"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
