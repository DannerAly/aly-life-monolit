'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { FinanceCategory, FinanceCategoryFormData } from '@/lib/types/database';

export function useFinanceCategories() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('finance_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (err) { setLoading(false); return; }
      setCategories(data as FinanceCategory[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const createCategory = useCallback(async (data: FinanceCategoryFormData): Promise<FinanceCategory | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay sesión activa');

    const maxOrder = categoriesRef.current.reduce((max, c) => Math.max(max, c.sort_order), -1);

    const payload: Record<string, unknown> = {
      user_id: user.id,
      name: data.name,
      emoji: data.emoji || null,
      color: data.color,
      type: data.type,
      spending_limit: data.spending_limit ?? null,
      is_reserved: data.is_reserved ?? false,
      sort_order: maxOrder + 1,
    };

    const { data: created, error } = await supabase
      .from('finance_categories')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    // Optimistic: append locally
    const newCat = created as FinanceCategory;
    setCategories(prev => [...prev, newCat].sort((a, b) => a.sort_order - b.sort_order));
    return newCat;
  }, []);

  const updateCategory = useCallback(async (id: string, data: Partial<FinanceCategoryFormData>): Promise<boolean> => {
    const { data: updated, error } = await supabase
      .from('finance_categories')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const u = updated as FinanceCategory;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...u } : c));
    return true;
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('finance_categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar categoría');
      return false;
    }
  }, []);

  const reservedAmount = categories
    .filter(c => c.is_reserved && c.spending_limit && c.spending_limit > 0)
    .reduce((sum, c) => sum + (c.spending_limit ?? 0), 0);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reservedAmount,
  };
}
