'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/finance';

export function useCurrency() {
  const [currency, setCurrencyState] = useState('BOB');
  const [loading, setLoading] = useState(false);

  const fetchCurrency = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('currency')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.currency) setCurrencyState(data.currency);
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrency = useCallback(async (code: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrencyState(code);

    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          currency: code,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  }, []);

  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, currency),
    [currency]
  );

  return { currency, loading, fetchCurrency, setCurrency, formatAmount };
}
