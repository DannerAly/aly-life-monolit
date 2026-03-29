'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/finance';

export function useCurrency() {
  const [currency, setCurrencyState] = useState('BOB');
  const [financeCycleDay, setFinanceCycleDayState] = useState(1);
  const [monthlyBudget, setMonthlyBudgetState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCurrency = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.currency) setCurrencyState(data.currency);
      if (data?.finance_cycle_day) setFinanceCycleDayState(data.finance_cycle_day);
      if (data?.monthly_budget != null) setMonthlyBudgetState(data.monthly_budget);
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

  const setFinanceCycleDay = useCallback(async (day: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setFinanceCycleDayState(day);

    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          finance_cycle_day: day,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  }, []);

  const setMonthlyBudget = useCallback(async (amount: number | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setMonthlyBudgetState(amount);

    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          monthly_budget: amount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  }, []);

  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, currency),
    [currency]
  );

  return {
    currency,
    loading,
    fetchCurrency,
    setCurrency,
    formatAmount,
    financeCycleDay,
    setFinanceCycleDay,
    monthlyBudget,
    setMonthlyBudget,
  };
}
