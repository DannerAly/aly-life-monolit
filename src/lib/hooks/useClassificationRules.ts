'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ClassificationRule, ClassificationRuleFormData } from '@/lib/types/database';

export function useClassificationRules() {
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classification_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) { setLoading(false); return; }
      setRules(data as ClassificationRule[]);
    } finally {
      setLoading(false);
    }
  }, []);

  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const createRule = useCallback(async (data: ClassificationRuleFormData): Promise<ClassificationRule | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const maxPriority = rulesRef.current.reduce((max, r) => Math.max(max, r.priority), -1);

      const { data: created, error } = await supabase
        .from('classification_rules')
        .insert({
          user_id: user.id,
          keyword: data.keyword.toLowerCase(),
          category_id: data.category_id,
          transaction_type: data.transaction_type,
          priority: maxPriority + 1,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchRules();
      return created as ClassificationRule;
    } catch {
      return null;
    }
  }, [fetchRules]);

  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('classification_rules').delete().eq('id', id);
      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { rules, loading, fetchRules, createRule, deleteRule };
}
