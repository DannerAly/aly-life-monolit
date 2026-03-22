'use client';

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import type {
  Transaction,
  TransactionWithCategory,
  TransactionFormData,
  FinanceCategory,
  MonthlySummary,
  CategoryBreakdown,
  PeriodView,
  PeriodSummary,
} from '@/lib/types/database';
import {
  getPeriodRange,
  currentPeriodStr,
  getMonthRange,
  getMonthLabel,
  getWeekShortLabel,
  prevMonth,
  prevWeek,
  currentWeekStr,
} from '@/lib/utils/finance';

// Helper to get ISO week string from a date
function dateToWeekStr(d: Date): string {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  const yearForWeek = date.getFullYear();
  return `${yearForWeek}-W${String(weekNum).padStart(2, '0')}`;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<string, FinanceCategory>>(new Map());
  const [periodTotals, setPeriodTotals] = useState<PeriodSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodView, setPeriodView] = useState<PeriodView>('month');
  const [currentPeriod, setCurrentPeriod] = useState(() => currentPeriodStr('month'));

  // Aliases for backward compat
  const currentMonth = currentPeriod;
  const setCurrentMonth = setCurrentPeriod;

  const fetchTransactions = useCallback(async (period?: string) => {
    setLoading(true);
    try {
      const p = period ?? currentPeriod;
      const { firstDay, lastDay } = getPeriodRange(p, periodView);

      const [txnRes, catRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .gte('date', firstDay)
          .lte('date', lastDay)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('finance_categories')
          .select('*')
          .order('sort_order', { ascending: true }),
      ]);

      if (txnRes.error || catRes.error) { setLoading(false); return; }

      const cats = catRes.data as FinanceCategory[];
      const catMap = new Map(cats.map(c => [c.id, c]));
      setCategoriesMap(catMap);

      const txns = (txnRes.data as Transaction[]).map(t => {
        const cat = t.category_id ? catMap.get(t.category_id) : null;
        return {
          ...t,
          category_name: cat?.name ?? null,
          category_emoji: cat?.emoji ?? null,
          category_color: cat?.color ?? null,
        } as TransactionWithCategory;
      });

      setTransactions(txns);
    } finally {
      setLoading(false);
    }
  }, [currentPeriod, periodView]);

  const summary: MonthlySummary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      month: currentPeriod,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [transactions, currentPeriod]);

  const expenseBreakdown: CategoryBreakdown[] = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    if (totalExpense === 0) return [];

    const groups = new Map<string, { total: number; count: number; cat: FinanceCategory | null }>();

    for (const t of expenses) {
      const key = t.category_id ?? '__none__';
      const existing = groups.get(key);
      const cat = t.category_id ? categoriesMap.get(t.category_id) ?? null : null;
      if (existing) {
        existing.total += t.amount;
        existing.count++;
      } else {
        groups.set(key, { total: t.amount, count: 1, cat });
      }
    }

    return Array.from(groups.entries())
      .map(([catId, g]) => ({
        category_id: catId === '__none__' ? null : catId,
        category_name: g.cat?.name ?? 'Sin categoría',
        category_emoji: g.cat?.emoji ?? null,
        category_color: g.cat?.color ?? '#6b7280',
        total: g.total,
        percentage: Math.round((g.total / totalExpense) * 100),
        count: g.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categoriesMap]);

  const createTransaction = useCallback(async (data: TransactionFormData): Promise<Transaction | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: created, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date,
          category_id: data.category_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchTransactions(currentPeriod);
      return created as Transaction;
    } catch {
      return null;
    }
  }, [fetchTransactions, currentPeriod]);

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await fetchTransactions(currentPeriod);
      return true;
    } catch {
      return false;
    }
  }, [fetchTransactions, currentPeriod]);

  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const bulkCreateTransactions = useCallback(async (
    rows: (TransactionFormData & { import_hash?: string })[]
  ): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const inserts = rows.map(r => ({
        user_id: user.id,
        type: r.type,
        amount: r.amount,
        description: r.description,
        date: r.date,
        category_id: r.category_id || null,
        is_imported: true,
        import_hash: r.import_hash || null,
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(inserts)
        .select();

      if (error) throw error;
      await fetchTransactions(currentPeriod);
      return data?.length ?? 0;
    } catch {
      return 0;
    }
  }, [fetchTransactions, currentPeriod]);

  const fetchPeriodTotals = useCallback(async () => {
    try {
      if (periodView === 'week') {
        // Last 4 weeks
        const weeks: string[] = [];
        let w = currentPeriod.includes('-W') ? currentPeriod : currentWeekStr();
        for (let i = 0; i < 4; i++) {
          weeks.unshift(w);
          w = prevWeek(w);
        }
        const { firstDay } = getPeriodRange(weeks[0], 'week');
        const { lastDay } = getPeriodRange(weeks[weeks.length - 1], 'week');

        const { data, error } = await supabase
          .from('transactions')
          .select('type, amount, date')
          .gte('date', firstDay)
          .lte('date', lastDay);
        if (error) throw error;

        const byWeek = new Map<string, { income: number; expense: number }>();
        for (const wk of weeks) byWeek.set(wk, { income: 0, expense: 0 });

        for (const row of data ?? []) {
          const d = new Date((row.date as string) + 'T00:00:00');
          const wk = dateToWeekStr(d);
          const entry = byWeek.get(wk);
          if (entry) {
            if (row.type === 'income') entry.income += row.amount as number;
            else entry.expense += row.amount as number;
          }
        }

        setPeriodTotals(weeks.map(wk => {
          const e = byWeek.get(wk)!;
          return { period: wk, label: getWeekShortLabel(wk), totalIncome: e.income, totalExpense: e.expense, balance: e.income - e.expense };
        }));

      } else if (periodView === 'year') {
        // 12 months of the selected year
        const year = currentPeriod.includes('-') ? currentPeriod.split('-')[0] : currentPeriod;
        const months: string[] = [];
        for (let m = 1; m <= 12; m++) {
          months.push(`${year}-${String(m).padStart(2, '0')}`);
        }

        const { firstDay } = getMonthRange(months[0]);
        const { lastDay } = getMonthRange(months[11]);

        const { data, error } = await supabase
          .from('transactions')
          .select('type, amount, date')
          .gte('date', firstDay)
          .lte('date', lastDay);
        if (error) throw error;

        const byMonth = new Map<string, { income: number; expense: number }>();
        for (const mo of months) byMonth.set(mo, { income: 0, expense: 0 });

        for (const row of data ?? []) {
          const mo = (row.date as string).slice(0, 7);
          const entry = byMonth.get(mo);
          if (entry) {
            if (row.type === 'income') entry.income += row.amount as number;
            else entry.expense += row.amount as number;
          }
        }

        setPeriodTotals(months.map(mo => {
          const e = byMonth.get(mo)!;
          return { period: mo, label: getMonthLabel(mo), totalIncome: e.income, totalExpense: e.expense, balance: e.income - e.expense };
        }));

      } else {
        // Last 6 months (default)
        const months: string[] = [];
        let m = currentPeriod;
        for (let i = 0; i < 6; i++) {
          months.unshift(m);
          m = prevMonth(m);
        }

        const { firstDay } = getMonthRange(months[0]);
        const { lastDay } = getMonthRange(months[months.length - 1]);

        const { data, error } = await supabase
          .from('transactions')
          .select('type, amount, date')
          .gte('date', firstDay)
          .lte('date', lastDay);
        if (error) throw error;

        const byMonth = new Map<string, { income: number; expense: number }>();
        for (const mo of months) byMonth.set(mo, { income: 0, expense: 0 });

        for (const row of data ?? []) {
          const mo = (row.date as string).slice(0, 7);
          const entry = byMonth.get(mo);
          if (entry) {
            if (row.type === 'income') entry.income += row.amount as number;
            else entry.expense += row.amount as number;
          }
        }

        setPeriodTotals(months.map(mo => {
          const e = byMonth.get(mo)!;
          return { period: mo, label: getMonthLabel(mo), totalIncome: e.income, totalExpense: e.expense, balance: e.income - e.expense };
        }));
      }
    } catch {
      // silent
    }
  }, [currentPeriod, periodView]);

  const fetchExistingHashes = useCallback(async (): Promise<Set<string>> => {
    const { data } = await supabase
      .from('transactions')
      .select('import_hash')
      .eq('is_imported', true)
      .not('import_hash', 'is', null);

    return new Set((data ?? []).map(r => r.import_hash as string));
  }, []);

  return {
    transactions,
    loading,
    currentMonth,
    setCurrentMonth,
    currentPeriod,
    setCurrentPeriod,
    periodView,
    setPeriodView,
    fetchTransactions,
    summary,
    expenseBreakdown,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkCreateTransactions,
    periodTotals,
    fetchPeriodTotals,
    // Legacy alias
    monthlyTotals: periodTotals,
    fetchMonthlyTotals: fetchPeriodTotals,
    fetchExistingHashes,
  };
}
