'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Habit, HabitWithLog, HabitFormData, HabitFrequency } from '@/lib/types/database';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns [firstDay, lastDay] of the current period as YYYY-MM-DD strings */
function getPeriodRange(frequency: HabitFrequency): [string, string] {
  const now = new Date();
  if (frequency === 'daily') {
    const d = todayStr();
    return [d, d];
  }
  if (frequency === 'weekly') {
    // ISO week: Monday = start
    const day = now.getDay(); // 0=Sun
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
  }
  // monthly
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [firstDay.toISOString().slice(0, 10), lastDay.toISOString().slice(0, 10)];
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

      // We need logs for the widest possible range (current month covers all)
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().slice(0, 10);
      // End of month
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      const monthEndStr = monthEnd.toISOString().slice(0, 10);

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
          .gte('date', monthStartStr)
          .lte('date', monthEndStr),
      ]);

      if (habitsRes.error || logsRes.error) { setLoading(false); return; }

      // Group logs by habit_id
      const logsByHabit = new Map<string, { date: string; value: number }[]>();
      for (const log of (logsRes.data ?? [])) {
        const list = logsByHabit.get(log.habit_id) ?? [];
        list.push({ date: log.date, value: log.value as number });
        logsByHabit.set(log.habit_id, list);
      }

      const merged: HabitWithLog[] = (habitsRes.data as Habit[]).map(h => {
        const freq = h.frequency ?? 'daily';
        const logs = logsByHabit.get(h.id) ?? [];
        const [periodStart, periodEnd] = getPeriodRange(freq);

        // Today's value (for the counter UI)
        const todayLog = logs.find(l => l.date === today);
        const todayValue = todayLog?.value ?? 0;

        let periodValue: number;
        let periodGoal: number;

        if (freq === 'daily') {
          // For daily habits, period = today, goal = daily_goal (counter-based)
          periodValue = todayValue;
          periodGoal = h.daily_goal;
        } else {
          // For weekly/monthly: count days in period where value >= 1
          const periodLogs = logs.filter(l => l.date >= periodStart && l.date <= periodEnd);
          periodValue = periodLogs.filter(l => l.value >= 1).length;
          periodGoal = h.daily_goal; // e.g. "20 days this month" or "5 days this week"
        }

        const progress = periodGoal > 0
          ? Math.min(Math.round((periodValue / periodGoal) * 100), 100)
          : 0;
        const goalMet = periodValue >= periodGoal;

        return { ...h, frequency: freq, todayValue, periodValue, periodGoal, progress, goalMet };
      });

      setHabits(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  const habitsRef = useRef(habits);
  habitsRef.current = habits;

  const createHabit = useCallback(async (data: HabitFormData): Promise<Habit | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const maxOrder = habitsRef.current.reduce((max, h) => Math.max(max, h.sort_order), -1);

      const { data: created, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: data.name,
          emoji: data.emoji,
          icon_color: data.icon_color,
          frequency: data.frequency,
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
  }, [fetchHabits]);

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
    let newTodayValue = 0;

    setHabits(prev =>
      prev.map(h => {
        if (h.id !== id) return h;
        const freq = h.frequency ?? 'daily';

        if (freq === 'daily') {
          // Daily: increment counter
          newTodayValue = h.todayValue + 1;
          const periodValue = newTodayValue;
          const progress = Math.min(Math.round((periodValue / h.periodGoal) * 100), 100);
          return { ...h, todayValue: newTodayValue, periodValue, progress, goalMet: periodValue >= h.periodGoal };
        } else {
          // Weekly/monthly: toggle today to 1 (mark as done)
          if (h.todayValue >= 1) return h; // already marked
          newTodayValue = 1;
          const periodValue = h.periodValue + 1;
          const progress = Math.min(Math.round((periodValue / h.periodGoal) * 100), 100);
          return { ...h, todayValue: 1, periodValue, progress, goalMet: periodValue >= h.periodGoal };
        }
      })
    );

    if (newTodayValue === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('habit_logs')
      .upsert(
        {
          habit_id: id,
          user_id: user.id,
          date: todayStr(),
          value: newTodayValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'habit_id,user_id,date' }
      );
  }, []);

  const decrementHabit = useCallback(async (id: string) => {
    let newTodayValue = -1;

    setHabits(prev =>
      prev.map(h => {
        if (h.id !== id) return h;
        if (h.todayValue <= 0) return h;
        const freq = h.frequency ?? 'daily';

        if (freq === 'daily') {
          newTodayValue = h.todayValue - 1;
          const periodValue = newTodayValue;
          const progress = Math.min(Math.round((periodValue / h.periodGoal) * 100), 100);
          return { ...h, todayValue: newTodayValue, periodValue, progress, goalMet: periodValue >= h.periodGoal };
        } else {
          // Weekly/monthly: toggle today to 0 (unmark)
          newTodayValue = 0;
          const periodValue = Math.max(0, h.periodValue - 1);
          const progress = Math.min(Math.round((periodValue / h.periodGoal) * 100), 100);
          return { ...h, todayValue: 0, periodValue, progress, goalMet: periodValue >= h.periodGoal };
        }
      })
    );

    if (newTodayValue < 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('habit_logs')
      .upsert(
        {
          habit_id: id,
          user_id: user.id,
          date: todayStr(),
          value: newTodayValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'habit_id,user_id,date' }
      );
  }, []);

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
