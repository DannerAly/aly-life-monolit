'use client';

import { useState, useCallback } from 'react';
import type {
  FinanceCategory,
  ClassificationRule,
  ImportPreviewRow,
  TransactionType,
} from '@/lib/types/database';
import { parseCSV, classifyTransaction } from '@/lib/utils/importParser';
import { hashTransaction } from '@/lib/utils/hashTransaction';

export function useImportParser(
  categories: FinanceCategory[],
  rules: ClassificationRule[],
  existingHashes: Set<string>,
) {
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File) => {
    setParsing(true);
    setParseError(null);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        setParseError('No se pudieron detectar transacciones en el archivo. Verifica el formato.');
        setPreviewRows([]);
        return;
      }

      const rows: ImportPreviewRow[] = await Promise.all(
        parsed.map(async (row) => {
          const type: TransactionType = row.amount >= 0 ? 'income' : 'expense';
          const absAmount = Math.abs(row.amount);
          const { category, rule } = classifyTransaction(
            row.description,
            row.amount,
            rules,
            categories,
          );
          const hash = await hashTransaction(row.date, row.description, absAmount);
          const isDuplicate = existingHashes.has(hash);

          return {
            date: row.date,
            description: row.description,
            amount: absAmount,
            type,
            suggestedCategory: category,
            matchedRule: rule,
            isDuplicate,
            selected: !isDuplicate,
          };
        })
      );

      setPreviewRows(rows);
    } catch {
      setParseError('Error al leer el archivo.');
      setPreviewRows([]);
    } finally {
      setParsing(false);
    }
  }, [categories, rules, existingHashes]);

  const toggleRow = useCallback((index: number) => {
    setPreviewRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  const updateRowCategory = useCallback((index: number, categoryId: string) => {
    setPreviewRows(prev =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const cat = categories.find(c => c.id === categoryId) ?? null;
        return { ...r, suggestedCategory: cat };
      })
    );
  }, [categories]);

  const getSelectedRows = useCallback(() => {
    return previewRows.filter(r => r.selected && !r.isDuplicate);
  }, [previewRows]);

  const reset = useCallback(() => {
    setPreviewRows([]);
    setParseError(null);
  }, []);

  return {
    previewRows,
    parsing,
    parseError,
    parseFile,
    toggleRow,
    updateRowCategory,
    getSelectedRows,
    reset,
  };
}
