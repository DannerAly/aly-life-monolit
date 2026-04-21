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
    const newSaving = created as Saving;
    setSavings(prev => [...prev, newSaving]);
    return newSaving;
  }, []);

  const updateSaving = useCallback(async (id: string, data: Partial<SavingFormData>): Promise<boolean> => {
    const { data: updated, error } = await supabase
      .from('savings')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const u = updated as Saving;
    setSavings(prev => prev.map(s => s.id === id ? u : s));
    return true;
  }, []);

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
      const newAmount = saving.current_amount + amount;
      const { error: upErr } = await supabase
        .from('savings')
        .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
        .eq('id', savingId);
      if (upErr) throw upErr;
      // Optimistic: update local state directly
      setSavings(prev => prev.map(s => s.id === savingId ? { ...s, current_amount: newAmount } : s));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al depositar');
      return false;
    }
  }, [savings]);

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
      const newAmount = saving.current_amount - amount;
      const { error: upErr } = await supabase
        .from('savings')
        .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
        .eq('id', savingId);
      if (upErr) throw upErr;
      setSavings(prev => prev.map(s => s.id === savingId ? { ...s, current_amount: newAmount } : s));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al retirar');
      return false;
    }
  }, [savings]);

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
