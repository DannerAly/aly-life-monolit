'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Category, CategoryWithTasks, CategoryFormData, Task } from '@/lib/types/database';
import { calculateCategoryAverage, deriveStatus } from '@/lib/utils/progress';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, taskRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('tasks').select('*').order('sort_order', { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (taskRes.error) throw taskRes.error;

      const cats = catRes.data as Category[];
      const tasks = taskRes.data as Task[];

      // Reconcile status for overdue tasks
      const staleIds = tasks
        .filter(t => deriveStatus(t) !== t.status)
        .map(t => t.id);

      if (staleIds.length > 0) {
        await Promise.all(
          tasks
            .filter(t => staleIds.includes(t.id))
            .map(t =>
              supabase
                .from('tasks')
                .update({ status: deriveStatus(t) })
                .eq('id', t.id)
            )
        );
        // Update local
        tasks.forEach(t => {
          if (staleIds.includes(t.id)) {
            t.status = deriveStatus(t);
          }
        });
      }

      const grouped: CategoryWithTasks[] = cats.map(cat => {
        const catTasks = tasks.filter(t => t.category_id === cat.id);
        return {
          ...cat,
          tasks: catTasks,
          task_count: catTasks.length,
          average_progress: calculateCategoryAverage(catTasks),
          completed_count: catTasks.filter(t => t.status === 'completed').length,
        };
      });

      setCategories(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: CategoryFormData): Promise<Category | null> => {
    try {
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1);
      const { data: created, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          emoji: data.emoji || null,
          color: data.color,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      await fetchCategories();
      return created as Category;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría');
      return null;
    }
  }, [categories, fetchCategories]);

  const updateCategory = useCallback(async (id: string, data: Partial<CategoryFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: data.name, emoji: data.emoji, color: data.color })
        .eq('id', id);
      if (error) throw error;
      await fetchCategories();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar categoría');
      return false;
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar categoría');
      return false;
    }
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
