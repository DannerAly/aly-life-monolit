'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SavingCard } from './SavingCard';
import { SavingForm } from './SavingForm';
import { SavingMovementForm } from './SavingMovementForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Saving, SavingFormData, SavingMovementFormData } from '@/lib/types/database';

interface SavingsSectionProps {
  savings: Saving[];
  totalSaved: number;
  formatAmount: (n: number) => string;
  onCreateSaving: (data: SavingFormData) => Promise<unknown>;
  onUpdateSaving: (id: string, data: Partial<SavingFormData>) => Promise<boolean>;
  onDeleteSaving: (id: string) => Promise<boolean>;
  onDeposit: (id: string, amount: number, description?: string, date?: string) => Promise<boolean>;
  onWithdraw: (id: string, amount: number, description?: string, date?: string) => Promise<boolean>;
}

export function SavingsSection({
  savings,
  totalSaved,
  formatAmount,
  onCreateSaving,
  onUpdateSaving,
  onDeleteSaving,
  onDeposit,
  onWithdraw,
}: SavingsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [movementSaving, setMovementSaving] = useState<Saving | null>(null);
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openDeposit = (saving: Saving) => {
    setMovementSaving(saving);
    setMovementType('deposit');
  };

  const openWithdraw = (saving: Saving) => {
    setMovementSaving(saving);
    setMovementType('withdrawal');
  };

  const handleMovement = async (data: SavingMovementFormData): Promise<boolean> => {
    if (!movementSaving) return false;
    if (data.type === 'deposit') {
      return onDeposit(movementSaving.id, data.amount, data.description, data.date);
    }
    return onWithdraw(movementSaving.id, data.amount, data.description, data.date);
  };

  const handleEdit = async (data: SavingFormData): Promise<unknown> => {
    if (!editingSaving) return false;
    const ok = await onUpdateSaving(editingSaving.id, data);
    if (ok) setEditingSaving(null);
    return ok;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    await onDeleteSaving(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Ahorros</h3>
          {savings.length > 1 && (
            <p className="text-xs text-muted-foreground">Total: {formatAmount(totalSaved)}</p>
          )}
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="glass-button rounded-xl px-3 py-2 text-xs font-medium hover:scale-105 transition-transform flex items-center gap-1.5"
        >
          <Plus size={14} />
          Nueva meta
        </button>
      </div>

      {savings.length === 0 ? (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground rounded-2xl">
          <p className="text-2xl mb-2">🏦</p>
          <p>Sin metas de ahorro todavía.</p>
          <p className="text-xs mt-1">Crea una meta para empezar a ahorrar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savings.map(saving => (
            <SavingCard
              key={saving.id}
              saving={saving}
              formatAmount={formatAmount}
              onDeposit={() => openDeposit(saving)}
              onWithdraw={() => openWithdraw(saving)}
              onEdit={() => setEditingSaving(saving)}
              onDelete={() => setDeletingId(saving.id)}
            />
          ))}
        </div>
      )}

      <SavingForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={onCreateSaving}
        mode="create"
      />

      {editingSaving && (
        <SavingForm
          open={!!editingSaving}
          onClose={() => setEditingSaving(null)}
          onSubmit={handleEdit}
          mode="edit"
          initial={{
            name: editingSaving.name,
            emoji: editingSaving.emoji,
            color: editingSaving.color,
            target_amount: editingSaving.target_amount,
          }}
        />
      )}

      <SavingMovementForm
        open={!!movementSaving}
        onClose={() => setMovementSaving(null)}
        saving={movementSaving}
        defaultType={movementType}
        onSubmit={handleMovement}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar meta de ahorro?"
        description="Se perderá el registro de todos los movimientos de esta meta. Esta acción no se puede deshacer."
      />
    </div>
  );
}
