'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Category, Task, GlobalTask, TaskStatus } from '@/lib/types/database';
import { withProgress, deriveStatus } from '@/lib/utils/progress';

const PAGE_SIZE = 30;

export function useGlobalTasks() {
  const [tasks, setTasks] = useState<GlobalTask[]>([]);
  const [catMap, setCatMap] = useState<Map<string, Category>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(0);
  const fetchingRef = useRef(false);

  const reconcileStale = useCallback((rawTasks: Task[]): Task[] => {
    const staleByStatus = new Map<TaskStatus, string[]>();
    const reconciled = rawTasks.map(t => {
      const newStatus = deriveStatus(t);
      if (newStatus !== t.status) {
        const list = staleByStatus.get(newStatus) ?? [];
        list.push(t.id);
        staleByStatus.set(newStatus, list);
        return { ...t, status: newStatus };
      }
      return t;
    });
    // Fire-and-forget batched updates
    if (staleByStatus.size > 0) {
      for (const [status, ids] of staleByStatus) {
        supabase.from('tasks').update({ status }).in('id', ids).then(
          () => {},
          err => console.error('[reconcileStale] update failed:', err)
        );
      }
    }
    return reconciled;
  }, []);

  const decorateTasks = useCallback((rawTasks: Task[], cats: Map<string, Category>): GlobalTask[] => {
    return rawTasks.map(t => {
      const cat = cats.get(t.category_id);
      return {
        ...withProgress(t),
        category_name: cat?.name ?? '',
        category_emoji: cat?.emoji ?? null,
        category_color: cat?.color ?? '#6366f1',
      };
    });
  }, []);

  const fetchGlobalTasks = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    pageRef.current = 0;

    try {
      const [catRes, taskRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('tasks')
          .select('*', { count: 'exact' })
          .order('sort_order', { ascending: true })
          .range(0, PAGE_SIZE - 1),
      ]);

      if (catRes.error) throw catRes.error;
      if (taskRes.error) throw taskRes.error;

      const cats = catRes.data as Category[];
      const rawTasks = taskRes.data as Task[];
      const count = taskRes.count ?? 0;

      const newCatMap = new Map(cats.map(c => [c.id, c]));
      setCatMap(newCatMap);

      const reconciled = reconcileStale(rawTasks);
      const decorated = decorateTasks(reconciled, newCatMap);

      // Sort: completed last, then sort_order
      decorated.sort((a, b) => {
        const aC = a.status === 'completed' ? 1 : 0;
        const bC = b.status === 'completed' ? 1 : 0;
        if (aC !== bC) return aC - bC;
        return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
      });

      setTasks(decorated);
      setTotal(count);
      setHasMore(count > PAGE_SIZE);
      pageRef.current = 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [reconcileStale, decorateTasks]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoadingMore(true);

    try {
      const from = pageRef.current * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const rawTasks = data as Task[];
      const reconciled = reconcileStale(rawTasks);
      const decorated = decorateTasks(reconciled, catMap);

      setTasks(prev => {
        const combined = [...prev, ...decorated];
        combined.sort((a, b) => {
          const aC = a.status === 'completed' ? 1 : 0;
          const bC = b.status === 'completed' ? 1 : 0;
          if (aC !== bC) return aC - bC;
          return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
        });
        return combined;
      });

      pageRef.current += 1;
      setHasMore(decorated.length === PAGE_SIZE && (pageRef.current * PAGE_SIZE) < total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar más tareas');
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [hasMore, total, catMap, reconcileStale, decorateTasks]);

  const updateLocalTask = (id: string, updatedTask: Task) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, ...withProgress(updatedTask) }
          : t
      )
    );
  };

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

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
      updateLocalTask(id, updated as Task);
      return true;
    } catch {
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
      updateLocalTask(id, updated as Task);
      return true;
    } catch {
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
      updateLocalTask(id, updated as Task);
      return true;
    } catch {
      return false;
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<import('@/lib/types/database').TaskFormData>): Promise<boolean> => {
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
      updateLocalTask(id, updated as Task);
      return true;
    } catch {
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
    } catch {
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
    fetchGlobalTasks,
    loadMore,
    incrementTask,
    decrementTask,
    toggleOneTime,
    updateTask,
    deleteTask,
    reorderTasks,
  };
}
