'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

const GOAL = 8;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWaterLog() {
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(false);

  const goalMet = glasses >= GOAL;
  const progress = Math.min(Math.round((glasses / GOAL) * 100), 100);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('water_logs')
        .select('glasses')
        .eq('user_id', user.id)
        .eq('date', todayStr())
        .maybeSingle();

      if (error) throw error;
      setGlasses(data?.glasses ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertGlasses = useCallback(async (newGlasses: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('water_logs')
      .upsert(
        { user_id: user.id, date: todayStr(), glasses: newGlasses, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      );

    if (!error) {
      setGlasses(newGlasses);
    }
  }, []);

  const addGlass = useCallback(async () => {
    await upsertGlasses(glasses + 1);
  }, [glasses, upsertGlasses]);

  const removeGlass = useCallback(async () => {
    if (glasses <= 0) return;
    await upsertGlasses(glasses - 1);
  }, [glasses, upsertGlasses]);

  return {
    glasses,
    goal: GOAL,
    goalMet,
    progress,
    loading,
    fetchToday,
    addGlass,
    removeGlass,
  };
}
