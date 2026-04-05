'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Saving, SavingFormData, SavingMovementFormData } from '@/lib/types/database';

export function useSavings() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('savings')
        .select('*')
        .order('created_at', { ascending: true });
      if (err) throw err;
      setSavings(data as Saving[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ahorros');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSaving = useCallback(async (data: SavingFormData): Promise<Saving | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay sesión activa');
    const { data: created, error } = await supabase
      .from('savings')
      .insert({
        user_id: user.id,
        name: data.name,
        emoji: data.emoji ?? null,
        color: data.color,
        target_amount: data.target_amount ?? null,
        current_amount: 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await fetchSavings();
    return created as Saving;
  }, [fetchSavings]);

  const updateSaving = useCallback(async (id: string, data: Partial<SavingFormData>): Promise<boolean> => {
    const { error } = await supabase
      .from('savings')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await fetchSavings();
    return true;
  }, [fetchSavings]);

  const deleteSaving = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('savings').delete().eq('id', id);
      if (error) throw error;
      setSavings(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar ahorro');
      return false;
    }
  }, []);

  const deposit = useCallback(async (
    savingId: string,
    amount: number,
    description?: string,
    date?: string,
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const saving = savings.find(s => s.id === savingId);
      if (!saving) return false;
      const today = date ?? new Date().toISOString().slice(0, 10);
      const { error: mvErr } = await supabase.from('saving_movements').insert({
        saving_id: savingId,
        user_id: user.id,
        type: 'deposit',
        amount,
        description: description ?? null,
        date: today,
      });
      if (mvErr) throw mvErr;
      const { error: upErr } = await supabase
        .from('savings')
        .update({ current_amount: saving.current_amount + amount, updated_at: new Date().toISOString() })
        .eq('id', savingId);
      if (upErr) throw upErr;
      await fetchSavings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al depositar');
      return false;
    }
  }, [savings, fetchSavings]);

  const withdraw = useCallback(async (
    savingId: string,
    amount: number,
    description?: string,
    date?: string,
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const saving = savings.find(s => s.id === savingId);
      if (!saving || saving.current_amount < amount) {
        setError('Fondos insuficientes');
        return false;
      }
      const today = date ?? new Date().toISOString().slice(0, 10);
      const { error: mvErr } = await supabase.from('saving_movements').insert({
        saving_id: savingId,
        user_id: user.id,
        type: 'withdrawal',
        amount,
        description: description ?? null,
        date: today,
      });
      if (mvErr) throw mvErr;
      const { error: upErr } = await supabase
        .from('savings')
        .update({ current_amount: saving.current_amount - amount, updated_at: new Date().toISOString() })
        .eq('id', savingId);
      if (upErr) throw upErr;
      await fetchSavings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al retirar');
      return false;
    }
  }, [savings, fetchSavings]);

  const totalSaved = savings.reduce((sum, s) => sum + s.current_amount, 0);

  return {
    savings,
    loading,
    error,
    totalSaved,
    fetchSavings,
    createSaving,
    updateSaving,
    deleteSaving,
    deposit,
    withdraw,
  };
}
