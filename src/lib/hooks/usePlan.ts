'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PLAN_LIMITS, type PlanType } from '@/lib/constants/planLimits';

export function usePlan() {
  const [plan, setPlan] = useState<PlanType>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('plan, plan_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const rawPlan = data?.plan ?? 'free';
      const expiresAt = data?.plan_expires_at ?? null;

      // Check expiry
      const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
      const effectivePlan: PlanType = rawPlan === 'pro' && !isExpired ? 'pro' : 'free';

      setPlan(effectivePlan);
      setPlanExpiresAt(expiresAt);
    } finally {
      setLoading(false);
    }
  }, []);

  const isPro = plan === 'pro';
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    isPro,
    limits,
    planExpiresAt,
    loading,
    fetchPlan,
  };
}
