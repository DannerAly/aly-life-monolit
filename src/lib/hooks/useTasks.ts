'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Task, TaskWithProgress, TaskFormData } from '@/lib/types/database';
import { withProgress, deriveStatus } from '@/lib/utils/progress';

export function useTasks(categoryId?: string) {
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (catId?: string) => {
    const id = catId ?? categoryId;
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('category_id', id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const rawTasks = data as Task[];

      // Reconcile overdue status
      const stale = rawTasks.filter(t => deriveStatus(t) !== t.status);
      if (stale.length > 0) {
        await Promise.all(
          stale.map(t =>
            supabase.from('tasks').update({ status: deriveStatus(t) }).eq('id', t.id)
          )
        );
        stale.forEach(t => { t.status = deriveStatus(t); });
      }

      setTasks(rawTasks.map(withProgress));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const createTask = useCallback(async (catId: string, data: TaskFormData): Promise<Task | null> => {
    try {
      const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order), -1);
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
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      const t = created as Task;
      setTasks(prev => [...prev, withProgress(t)]);
      return t;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tarea');
      return null;
    }
  }, [tasks]);

  const updateTask = useCallback(async (id: string, data: Partial<TaskFormData>): Promise<boolean> => {
    try {
      const updatePayload: Record<string, unknown> = {};
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.emoji !== undefined) updatePayload.emoji = data.emoji || null;
      if (data.task_type !== undefined) updatePayload.task_type = data.task_type;
      if (data.target_value !== undefined) updatePayload.target_value = data.target_value;
      if (data.due_date !== undefined) updatePayload.due_date = data.due_date || null;
      if (data.sub_filter !== undefined) updatePayload.sub_filter = data.sub_filter || null;

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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tarea');
      return false;
    }
  }, []);

  const incrementTask = useCallback(async (id: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === id);
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
  }, [tasks]);

  const decrementTask = useCallback(async (id: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === id);
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
  }, [tasks]);

  const toggleOneTime = useCallback(async (id: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === id);
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
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    incrementTask,
    decrementTask,
    toggleOneTime,
  };
}
