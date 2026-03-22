'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { GridItem } from '@/lib/types/database';

export function useGridLayout() {
  const [gridLayout, setGridLayout] = useState<GridItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLayout = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('grid_layout')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setGridLayout((data?.grid_layout as GridItem[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLayout = useCallback(async (items: GridItem[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setGridLayout(items);

    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          grid_layout: items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  }, []);

  return { gridLayout, loading, fetchLayout, saveLayout };
}
