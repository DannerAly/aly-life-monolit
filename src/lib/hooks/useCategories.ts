'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Category, CategoryWithTasks, CategoryFormData, Task, TaskStatus } from '@/lib/types/database';
import { calculateCategoryAverage, deriveStatus } from '@/lib/utils/progress';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch the fields needed to compute per-category stats — no heavy fields
      const [catRes, taskRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('tasks')
          .select('id, category_id, current_value, target_value, status, due_date, task_type, sort_order'),
      ]);

      if (catRes.error) throw catRes.error;
      if (taskRes.error) throw taskRes.error;

      const cats = catRes.data as Category[];
      const tasks = taskRes.data as Task[];

      // Batched + fire-and-forget stale status reconciliation
      const staleByStatus = new Map<TaskStatus, string[]>();
      for (const t of tasks) {
        const newStatus = deriveStatus(t);
        if (newStatus !== t.status) {
          const list = staleByStatus.get(newStatus) ?? [];
          list.push(t.id);
          staleByStatus.set(newStatus, list);
          t.status = newStatus; // update local copy for rendering
        }
      }
      // Fire-and-forget: run updates in background, don't block render
      if (staleByStatus.size > 0) {
        for (const [status, ids] of staleByStatus) {
          supabase.from('tasks').update({ status }).in('id', ids).then(
            () => {},
            err => console.error('[reconcileStale] update failed:', err)
          );
        }
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

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const createCategory = useCallback(async (data: CategoryFormData): Promise<Category | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const maxOrder = categoriesRef.current.reduce((max, c) => Math.max(max, c.sort_order), -1);
      const { data: created, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          emoji: data.emoji || null,
          color: data.color,
          sort_order: maxOrder + 1,
          user_id: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      // Optimistic: append with empty tasks
      const newCat = created as Category;
      setCategories(prev => [...prev, {
        ...newCat,
        tasks: [],
        task_count: 0,
        average_progress: 0,
        completed_count: 0,
      }]);
      return newCat;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría');
      return null;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: Partial<CategoryFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: data.name, emoji: data.emoji, color: data.color })
        .eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === id
        ? { ...c, name: data.name ?? c.name, emoji: data.emoji ?? c.emoji, color: data.color ?? c.color }
        : c
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar categoría');
      return false;
    }
  }, []);

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
