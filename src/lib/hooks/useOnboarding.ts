'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  fallbackSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  /** CSS class to temporarily add to the target element during this step */
  targetClass?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a aly.life!',
    description: 'Te mostramos cómo funciona la app para que aproveches al máximo tus metas.',
    targetSelector: '[data-onboarding="hero"]',
    position: 'bottom',
  },
  {
    id: 'objectives',
    title: 'Tu progreso general',
    description: 'Aquí ves un resumen de todas tus áreas y objetivos. El porcentaje refleja tu avance total. Haz click para ver estadísticas detalladas.',
    targetSelector: '[data-onboarding="hero"]',
    position: 'bottom',
  },
  {
    id: 'categories',
    title: 'Áreas de vida',
    description: 'Crea áreas como Salud, Trabajo o Estudio. Cada una agrupa objetivos relacionados. Haz click en una para ver sus tareas.',
    targetSelector: '[data-onboarding="category-card"]',
    fallbackSelector: '[data-onboarding="add-category"]',
    position: 'bottom',
  },
  {
    id: 'habits',
    title: 'Hábitos diarios',
    description: 'Registra hábitos como meditación, ejercicio o lectura. Toca + para sumar al contador y click en la card para ver estadísticas.',
    targetSelector: '[data-onboarding="habit-card"]',
    fallbackSelector: '[data-onboarding="add-habit"]',
    position: 'bottom',
  },
  {
    id: 'finances',
    title: 'Tus finanzas',
    description: 'Lleva control de ingresos y gastos. Puedes importar extractos bancarios para clasificar gastos automáticamente.',
    // On mobile, nav-finances is in the bottom bar; on desktop it's in the header
    targetSelector: '[data-onboarding="nav-finances"]',
    position: 'top',
  },
  {
    id: 'drag-drop',
    title: 'Organiza a tu gusto',
    description: 'Arrastra desde este ícono para redimensionar las tarjetas. También puedes moverlas desde el ícono de la esquina superior derecha.',
    targetSelector: '[data-onboarding="resize-handle"]',
    fallbackSelector: '[data-onboarding="hero"]',
    position: 'top',
    // Make the normally-hidden resize handle visible during this step
    targetClass: '!opacity-100',
  },
  {
    id: 'done',
    title: '¡Listo para empezar!',
    description: 'Ya conoces lo básico. Puedes volver a ver este tutorial desde el menú de usuario en cualquier momento.',
    targetSelector: '[data-onboarding="hero"]',
    position: 'bottom',
  },
];

export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOnboardingStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      // If table doesn't exist or error, skip onboarding silently
      if (error) {
        setShouldShowOnboarding(false);
        return;
      }

      // If no record exists or onboarding not completed, show it
      if (!data || !data.onboarding_completed) {
        setShouldShowOnboarding(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    setShouldShowOnboarding(false);
    setIsOnboardingActive(false);
  }, []);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOnboardingActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      completeOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, completeOnboarding]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const step = isOnboardingActive ? ONBOARDING_STEPS[currentStep] ?? null : null;

  return {
    shouldShowOnboarding,
    isOnboardingActive,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    step,
    loading,
    fetchOnboardingStatus,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  };
}
