'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { HabitStats, HabitFrequency } from '@/lib/types/database';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * For daily habits: a "goal met" day is when value >= daily_goal
 * For weekly/monthly habits: a "goal met" day is when value >= 1 (they did it that day)
 */
function isDayMet(value: number, dailyGoal: number, frequency: HabitFrequency): boolean {
  if (frequency === 'daily') return value >= dailyGoal;
  return value >= 1;
}

export function useHabitStats(habitId: string | null) {
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!habitId) return;
    setLoading(true);
    try {
      const [habitRes, logsRes] = await Promise.all([
        supabase.from('habits').select('daily_goal, frequency').eq('id', habitId).single(),
        supabase
          .from('habit_logs')
          .select('date, value')
          .eq('habit_id', habitId)
          .order('date', { ascending: false }),
      ]);

      if (habitRes.error) throw habitRes.error;
      if (logsRes.error) throw logsRes.error;

      const dailyGoal = habitRes.data.daily_goal as number;
      const frequency = (habitRes.data.frequency ?? 'daily') as HabitFrequency;
      const logs = logsRes.data as { date: string; value: number }[];
      const logMap = new Map(logs.map(l => [l.date, l.value]));

      // Weekly data (last 7 days)
      const weeklyData: HabitStats['weeklyData'] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = dateStr(d);
        weeklyData.push({
          date: ds,
          dayLabel: DAY_LABELS[d.getDay()],
          value: logMap.get(ds) ?? 0,
        });
      }

      // Monthly data (last 30 days)
      const monthlyData: HabitStats['monthlyData'] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = dateStr(d);
        const value = logMap.get(ds) ?? 0;
        monthlyData.push({ date: ds, value, goalMet: isDayMet(value, dailyGoal, frequency) });
      }

      // Streaks — count consecutive days where the day's goal was met
      let bestStreak = 0;
      let streak = 0;
      let totalDaysGoalMet = 0;

      const allDates: string[] = [];
      const earliest = logs.length > 0 ? logs[logs.length - 1].date : dateStr(new Date());
      const start = new Date(earliest);
      const today = new Date();
      for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
        allDates.push(dateStr(new Date(d)));
      }

      for (const ds of allDates) {
        const val = logMap.get(ds) ?? 0;
        if (isDayMet(val, dailyGoal, frequency)) {
          streak++;
          totalDaysGoalMet++;
          if (streak > bestStreak) bestStreak = streak;
        } else {
          streak = 0;
        }
      }

      // Current streak: count backwards from today
      let currentStreak = 0;
      for (let i = 0; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = dateStr(d);
        const val = logMap.get(ds) ?? 0;
        if (isDayMet(val, dailyGoal, frequency)) {
          currentStreak++;
        } else {
          break;
        }
      }

      setStats({
        currentStreak,
        bestStreak,
        totalDaysTracked: logs.length,
        totalDaysGoalMet,
        weeklyData,
        monthlyData,
      });
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  return { stats, loading, fetchStats };
}
