'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertTriangle, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '@/components/ui/Modal';
import type {
  FinanceCategory,
  ImportPreviewRow,
} from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  previewRows: ImportPreviewRow[];
  parsing: boolean;
  parseError: string | null;
  onParseFile: (file: File) => Promise<void>;
  onToggleRow: (index: number) => void;
  onUpdateRowCategory: (index: number, categoryId: string) => void;
  onConfirmImport: () => Promise<void>;
  onReset: () => void;
  onOpenRules: () => void;
  categories: FinanceCategory[];
  formatAmount: (amount: number) => string;
}

export function ImportModal({
  open,
  onClose,
  previewRows,
  parsing,
  parseError,
  onParseFile,
  onToggleRow,
  onUpdateRowCategory,
  onConfirmImport,
  onReset,
  onOpenRules,
  categories,
  formatAmount,
}: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const hasPreview = previewRows.length > 0;
  const totalCount = previewRows.length;
  const duplicateCount = previewRows.filter(r => r.isDuplicate).length;
  const selectedCount = previewRows.filter(r => r.selected && !r.isDuplicate).length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onParseFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await onParseFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    await onConfirmImport();
    setImporting(false);
    onClose();
  };

  const handleClose = () => {
    onReset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Importar extracto bancario" className="max-w-2xl">
      {!hasPreview ? (
        /* Step 1: Upload */
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
              'border-white/20 hover:border-emerald-500/50'
            )}
          >
            {parsing ? (
              <Loader2 size={32} className="animate-spin text-emerald-500" />
            ) : (
              <>
                <Upload size={32} className="text-muted-foreground" />
                <p className="text-sm font-medium">Arrastra tu archivo o haz clic</p>
                <p className="text-xs text-muted-foreground">CSV, TXT</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.CSV,.TXT"
            onChange={handleFileChange}
            className="hidden"
          />

          {parseError && (
            <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <p className="text-xs">{parseError}</p>
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Preview */
        <div>
          {/* Summary bar */}
          <div className="flex items-center justify-between mb-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {totalCount} transacciones
              </span>
              {duplicateCount > 0 && (
                <span className="text-amber-500">{duplicateCount} duplicadas</span>
              )}
              <span className="text-emerald-500 font-medium">{selectedCount} a importar</span>
            </div>
            <button
              onClick={onOpenRules}
              className="flex items-center gap-1 glass-button px-3 py-1.5 rounded-xl text-xs hover:scale-105 transition-transform"
            >
              <Settings size={12} />
              Reglas
            </button>
          </div>

          {/* Table */}
          <div className="max-h-[400px] overflow-y-auto space-y-1.5">
            {previewRows.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl glass-button text-xs',
                  row.isDuplicate && 'opacity-40'
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={row.selected}
                  disabled={row.isDuplicate}
                  onChange={() => onToggleRow(i)}
                  className="rounded accent-emerald-500 flex-shrink-0"
                />

                {/* Date */}
                <span className="text-muted-foreground w-20 flex-shrink-0 tabular-nums">
                  {row.date}
                </span>

                {/* Description */}
                <span className="flex-1 truncate min-w-0">{row.description}</span>

                {/* Amount */}
                <span className={cn(
                  'font-bold tabular-nums flex-shrink-0',
                  row.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {row.type === 'income' ? '+' : '-'}{formatAmount(row.amount)}
                </span>

                {/* Category select */}
                <select
                  value={row.suggestedCategory?.id ?? ''}
                  onChange={e => onUpdateRowCategory(i, e.target.value)}
                  disabled={row.isDuplicate}
                  className="glass-button rounded-lg px-2 py-1 text-[10px] bg-transparent max-w-[100px]"
                >
                  <option value="">Sin cat.</option>
                  {categories
                    .filter(c => c.type === 'both' || c.type === row.type)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.emoji ? `${c.emoji} ` : ''}{c.name}
                      </option>
                    ))}
                </select>

                {/* Duplicate badge */}
                {row.isDuplicate && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
                    Dup
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-5">
            <button
              onClick={() => { onReset(); }}
              className="px-4 py-2 rounded-xl text-sm glass-button"
            >
              Volver
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-white disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${selectedCount} transacciones`
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
