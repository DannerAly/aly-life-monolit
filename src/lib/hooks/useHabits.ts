'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Habit, HabitWithLog, HabitFormData } from '@/lib/types/database';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useHabits() {
  const [habits, setHabits] = useState<HabitWithLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = todayStr();

      const [habitsRes, logsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('sort_order', { ascending: true }),
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      const logMap = new Map(
        (logsRes.data ?? []).map(log => [log.habit_id, log.value as number])
      );

      const merged: HabitWithLog[] = (habitsRes.data as Habit[]).map(h => {
        const todayValue = logMap.get(h.id) ?? 0;
        const progress = Math.min(Math.round((todayValue / h.daily_goal) * 100), 100);
        return { ...h, todayValue, progress, goalMet: todayValue >= h.daily_goal };
      });

      setHabits(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHabit = useCallback(async (data: HabitFormData): Promise<Habit | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const maxOrder = habits.reduce((max, h) => Math.max(max, h.sort_order), -1);

      const { data: created, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: data.name,
          emoji: data.emoji,
          icon_color: data.icon_color,
          daily_goal: data.daily_goal,
          unit_label: data.unit_label,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchHabits();
      return created as Habit;
    } catch {
      return null;
    }
  }, [habits, fetchHabits]);

  const updateHabit = useCallback(async (id: string, data: Partial<HabitFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await fetchHabits();
      return true;
    } catch {
      return false;
    }
  }, [fetchHabits]);

  const deleteHabit = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      setHabits(prev => prev.filter(h => h.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const incrementHabit = useCallback(async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const newValue = habit.todayValue + 1;

    // Optimistic update
    setHabits(prev =>
      prev.map(h =>
        h.id === id
          ? {
              ...h,
              todayValue: newValue,
              progress: Math.min(Math.round((newValue / h.daily_goal) * 100), 100),
              goalMet: newValue >= h.daily_goal,
            }
          : h
      )
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('habit_logs')
      .upsert(
        {
          habit_id: id,
          user_id: user.id,
          date: todayStr(),
          value: newValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'habit_id,user_id,date' }
      );
  }, [habits]);

  const decrementHabit = useCallback(async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.todayValue <= 0) return;

    const newValue = habit.todayValue - 1;

    // Optimistic update
    setHabits(prev =>
      prev.map(h =>
        h.id === id
          ? {
              ...h,
              todayValue: newValue,
              progress: Math.min(Math.round((newValue / h.daily_goal) * 100), 100),
              goalMet: newValue >= h.daily_goal,
            }
          : h
      )
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('habit_logs')
      .upsert(
        {
          habit_id: id,
          user_id: user.id,
          date: todayStr(),
          value: newValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'habit_id,user_id,date' }
      );
  }, [habits]);

  return {
    habits,
    loading,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    incrementHabit,
    decrementHabit,
  };
}
