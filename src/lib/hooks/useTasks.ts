'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Task, TaskWithProgress, TaskFormData, TaskStatus } from '@/lib/types/database';
import { withProgress, deriveStatus } from '@/lib/utils/progress';

const PAGE_SIZE = 30;

export function useTasks(categoryId?: string) {
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(0);
  const fetchingRef = useRef(false);

  const reconcileStale = useCallback(async (rawTasks: Task[]): Promise<Task[]> => {
    // Group tasks by their new derived status to batch updates
    const updatesByStatus = new Map<TaskStatus, string[]>();
    const reconciled = rawTasks.map(t => {
      const newStatus = deriveStatus(t);
      if (newStatus !== t.status) {
        const list = updatesByStatus.get(newStatus) ?? [];
        list.push(t.id);
        updatesByStatus.set(newStatus, list);
        return { ...t, status: newStatus };
      }
      return t;
    });

    // Fire-and-forget batched updates (don't block the UI)
    if (updatesByStatus.size > 0) {
      for (const [status, ids] of updatesByStatus) {
        supabase.from('tasks').update({ status }).in('id', ids).then(
          () => {},
          err => console.error('[reconcileStale] update failed:', err)
        );
      }
    }

    return reconciled;
  }, []);

  const fetchTasks = useCallback(async (catId?: string) => {
    const id = catId ?? categoryId;
    if (!id || fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);
    pageRef.current = 0;

    try {
      const from = 0;
      const to = PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('category_id', id)
        .order('sort_order', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const rawTasks = data as Task[];
      const reconciled = await reconcileStale(rawTasks);

      setTasks(reconciled.map(withProgress));
      setTotal(count ?? 0);
      setHasMore((count ?? 0) > PAGE_SIZE);
      pageRef.current = 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [categoryId, reconcileStale]);

  const loadMore = useCallback(async () => {
    const id = categoryId;
    if (!id || fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoadingMore(true);

    try {
      const from = pageRef.current * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('category_id', id)
        .order('sort_order', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const rawTasks = data as Task[];
      const reconciled = await reconcileStale(rawTasks);
      const newTasks = reconciled.map(withProgress);

      setTasks(prev => [...prev, ...newTasks]);
      pageRef.current += 1;
      setHasMore(newTasks.length === PAGE_SIZE && (pageRef.current * PAGE_SIZE) < total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar más tareas');
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [categoryId, hasMore, total, reconcileStale]);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const createTask = useCallback(async (catId: string, data: TaskFormData): Promise<Task | null> => {
    try {
      const maxOrder = tasksRef.current.reduce((max, t) => Math.max(max, t.sort_order), -1);
      const { data: created, error } = await supabase
        .from('tasks')
        .insert({
          category_id: catId,
          title: data.title,
          emoji: data.emoji || null,
          task_type: data.task_type,
          target_value: data.task_type === 'one_time' ? 1 : data.target_value,
          current_value: 0,
          due_date: data.due_date || null,
          status: 'active',
          is_completed: false,
          sub_filter: data.sub_filter || null,
          priority: data.priority ?? null,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      const t = created as Task;
      setTasks(prev => [...prev, withProgress(t)]);
      setTotal(prev => prev + 1);
      return t;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tarea');
      return null;
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<TaskFormData>): Promise<boolean> => {
    try {
      const updatePayload: Record<string, unknown> = {};
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.emoji !== undefined) updatePayload.emoji = data.emoji || null;
      if (data.task_type !== undefined) updatePayload.task_type = data.task_type;
      if (data.target_value !== undefined) updatePayload.target_value = data.target_value;
      if (data.due_date !== undefined) updatePayload.due_date = data.due_date || null;
      if (data.sub_filter !== undefined) updatePayload.sub_filter = data.sub_filter || null;
      if (data.priority !== undefined) updatePayload.priority = data.priority ?? null;

      const { data: updated, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const t = updated as Task;
      setTasks(prev => prev.map(task => task.id === id ? withProgress({ ...task, ...t }) : task));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tarea');
      return false;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tarea');
      return false;
    }
  }, []);

  const incrementTask = useCallback(async (id: string): Promise<boolean> => {
    const task = tasksRef.current.find(t => t.id === id);
    if (!task) return false;
    const newValue = Math.min(task.current_value + 1, task.target_value);
    const newStatus = newValue >= task.target_value ? 'completed' : task.status;
    const newIsCompleted = newValue >= task.target_value;

    try {
      const { data: updated, error } = await supabase
        .from('tasks')
        .update({ current_value: newValue, status: newStatus, is_completed: newIsCompleted })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const t = updated as Task;
      setTasks(prev => prev.map(task => task.id === id ? withProgress(t) : task));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al incrementar tarea');
      return false;
    }
  }, []);

  const decrementTask = useCallback(async (id: string): Promise<boolean> => {
    const task = tasksRef.current.find(t => t.id === id);
    if (!task || task.current_value <= 0) return false;
    const newValue = task.current_value - 1;
    const newStatus = deriveStatus({ ...task, current_value: newValue });
    try {
      const { data: updated, error } = await supabase
        .from('tasks')
        .update({ current_value: newValue, status: newStatus, is_completed: false })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const t = updated as Task;
      setTasks(prev => prev.map(task => task.id === id ? withProgress(t) : task));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al decrementar tarea');
      return false;
    }
  }, []);

  const toggleOneTime = useCallback(async (id: string): Promise<boolean> => {
    const task = tasksRef.current.find(t => t.id === id);
    if (!task || task.task_type !== 'one_time') return false;
    const newValue = task.current_value === 0 ? 1 : 0;
    const newStatus = newValue === 1 ? 'completed' : 'active';
    try {
      const { data: updated, error } = await supabase
        .from('tasks')
        .update({ current_value: newValue, status: newStatus, is_completed: newValue === 1 })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const t = updated as Task;
      setTasks(prev => prev.map(task => task.id === id ? withProgress(t) : task));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tarea');
      return false;
    }
  }, []);

  const reorderTasks = useCallback(async (orderedIds: string[]): Promise<boolean> => {
    const idToIndex = new Map(orderedIds.map((id, i) => [id, i]));
    setTasks(prev => {
      const next = [...prev];
      next.sort((a, b) => (idToIndex.get(a.id) ?? 9999) - (idToIndex.get(b.id) ?? 9999));
      return next.map((t, i) => ({ ...t, sort_order: i }));
    });
    try {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from('tasks').update({ sort_order: i }).eq('id', id)
        )
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    tasks,
    loading,
    loadingMore,
    hasMore,
    total,
    error,
    fetchTasks,
    loadMore,
    createTask,
    updateTask,
    deleteTask,
    incrementTask,
    decrementTask,
    toggleOneTime,
    reorderTasks,
  };
}
