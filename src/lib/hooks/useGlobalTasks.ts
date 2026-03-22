'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Category, Task, GlobalTask } from '@/lib/types/database';
import { withProgress, deriveStatus } from '@/lib/utils/progress';
import { daysUntil } from '@/lib/utils/date';

export function useGlobalTasks() {
  const [tasks, setTasks] = useState<GlobalTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalTasks = useCallback(async () => {
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
      const rawTasks = taskRes.data as Task[];

      // Reconcile stale statuses
      const stale = rawTasks.filter(t => deriveStatus(t) !== t.status);
      if (stale.length > 0) {
        await Promise.all(
          stale.map(t =>
            supabase.from('tasks').update({ status: deriveStatus(t) }).eq('id', t.id)
          )
        );
        stale.forEach(t => { t.status = deriveStatus(t); });
      }

      const catMap = new Map(cats.map(c => [c.id, c]));

      const globalTasks: GlobalTask[] = rawTasks.map(t => {
        const cat = catMap.get(t.category_id);
        return {
          ...withProgress(t),
          category_name: cat?.name ?? '',
          category_emoji: cat?.emoji ?? null,
          category_color: cat?.color ?? '#6366f1',
        };
      });

      // Sort: completed last → priority (lower first, null last) → due_date proximity (sooner first, null last)
      globalTasks.sort((a, b) => {
        const aCompleted = a.status === 'completed' ? 1 : 0;
        const bCompleted = b.status === 'completed' ? 1 : 0;
        if (aCompleted !== bCompleted) return aCompleted - bCompleted;

        const aPri = a.priority ?? 999;
        const bPri = b.priority ?? 999;
        if (aPri !== bPri) return aPri - bPri;

        const aDays = daysUntil(a.due_date) ?? 9999;
        const bDays = daysUntil(b.due_date) ?? 9999;
        return aDays - bDays;
      });

      setTasks(globalTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, []);

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
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchGlobalTasks,
    incrementTask,
    decrementTask,
    toggleOneTime,
    updateTask,
    deleteTask,
  };
}
