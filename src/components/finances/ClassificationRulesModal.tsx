'use client';

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type {
  ClassificationRule,
  ClassificationRuleFormData,
  TransactionType,
  FinanceCategory,
} from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface ClassificationRulesModalProps {
  open: boolean;
  onClose: () => void;
  rules: ClassificationRule[];
  categories: FinanceCategory[];
  onCreateRule: (data: ClassificationRuleFormData) => Promise<unknown>;
  onDeleteRule: (id: string) => Promise<boolean>;
}

export function ClassificationRulesModal({
  open,
  onClose,
  rules,
  categories,
  onCreateRule,
  onDeleteRule,
}: ClassificationRulesModalProps) {
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [txnType, setTxnType] = useState<TransactionType>('expense');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!keyword.trim() || !categoryId) return;
    setAdding(true);
    await onCreateRule({
      keyword: keyword.trim(),
      category_id: categoryId,
      transaction_type: txnType,
    });
    setKeyword('');
    setCategoryId('');
    setAdding(false);
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? `${cat.emoji ?? ''} ${cat.name}` : 'Desconocida';
  };

  return (
    <Modal open={open} onClose={onClose} title="Reglas de clasificación" className="max-w-lg">
      <p className="text-xs text-muted-foreground mb-4">
        Las reglas clasifican automáticamente transacciones importadas según palabras clave en la descripción.
      </p>

      {/* Add new rule */}
      <div className="flex flex-col gap-2 mb-5 p-3 rounded-xl glass-button">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Palabra clave (ej: UBER, MERCADO)"
            className="flex-1 px-3 py-2 rounded-xl glass-button text-xs bg-transparent placeholder:text-muted-foreground focus:outline-none"
          />
          <select
            value={txnType}
            onChange={e => setTxnType(e.target.value as TransactionType)}
            className="px-3 py-2 rounded-xl glass-button text-xs bg-transparent focus:outline-none"
          >
            <option value="expense">Egreso</option>
            <option value="income">Ingreso</option>
          </select>
        </div>
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl glass-button text-xs bg-transparent focus:outline-none"
          >
            <option value="">Seleccionar categoría...</option>
            {categories
              .filter(c => c.type === 'both' || c.type === txnType)
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? `${c.emoji} ` : ''}{c.name}
                </option>
              ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={adding || !keyword.trim() || !categoryId}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500 text-white disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-1"
          >
            <Plus size={12} />
            Añadir
          </button>
        </div>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No hay reglas todavía. Añade una para clasificar automáticamente.
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="flex items-center justify-between gap-2 p-3 rounded-xl glass-button"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-white/10">
                    {rule.keyword}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs truncate">{getCategoryName(rule.category_id)}</span>
                </div>
                <span className={cn(
                  'text-[10px] mt-0.5 inline-block',
                  rule.transaction_type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {rule.transaction_type === 'income' ? 'Ingreso' : 'Egreso'}
                </span>
              </div>
              <button
                onClick={() => onDeleteRule(rule.id)}
                className="glass-button rounded-lg p-1.5 hover:scale-105 transition-transform text-rose-400 flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
