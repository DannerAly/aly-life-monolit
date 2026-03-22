'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { OnboardingStep } from '@/lib/hooks/useOnboarding';
import { cn } from '@/lib/utils/cn';

interface OnboardingOverlayProps {
  active: boolean;
  step: OnboardingStep | null;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PADDING = 12;

function getTooltipPosition(
  targetRect: TargetRect,
  position: OnboardingStep['position'],
  tooltipWidth: number,
  tooltipHeight: number,
): { top: number; left: number } {
  const gap = 16;
  let top = 0;
  let left = 0;

  switch (position) {
    case 'bottom':
      top = targetRect.y + targetRect.height + PADDING + gap;
      left = targetRect.x + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
      top = targetRect.y - PADDING - gap - tooltipHeight;
      left = targetRect.x + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'right':
      top = targetRect.y + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.x + targetRect.width + PADDING + gap;
      break;
    case 'left':
      top = targetRect.y + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.x - PADDING - gap - tooltipWidth;
      break;
  }

  // Clamp to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  left = Math.max(16, Math.min(left, vw - tooltipWidth - 16));
  top = Math.max(16, Math.min(top, vh - tooltipHeight - 16));

  return { top, left };
}

export function OnboardingOverlay({
  active,
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: OnboardingOverlayProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    let el = document.querySelector(step.targetSelector);
    if (!el && step.fallbackSelector) {
      el = document.querySelector(step.fallbackSelector);
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Small delay for scroll to finish
      requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect();
        setTargetRect({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      });
    } else {
      // Fallback: center of screen
      setTargetRect({
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 50,
        width: 200,
        height: 100,
      });
    }
  }, [step]);

  useEffect(() => {
    if (!active || !step) return;
    // Delay slightly to allow DOM to settle
    const timer = setTimeout(updateTargetRect, 200);

    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, step, currentStep, updateTargetRect]);

  if (!mounted || !active || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const tooltipWidth = 340;
  const tooltipHeight = 200;

  const tooltipPos = targetRect
    ? getTooltipPosition(targetRect, step.position, tooltipWidth, tooltipHeight)
    : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 170 };

  return createPortal(
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[60]">
          {/* SVG overlay with spotlight hole */}
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <mask id="onboarding-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <motion.rect
                    x={targetRect.x - PADDING}
                    y={targetRect.y - PADDING}
                    width={targetRect.width + PADDING * 2}
                    height={targetRect.height + PADDING * 2}
                    rx={20}
                    fill="black"
                    animate={{
                      x: targetRect.x - PADDING,
                      y: targetRect.y - PADDING,
                      width: targetRect.width + PADDING * 2,
                      height: targetRect.height + PADDING * 2,
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.55)"
              mask="url(#onboarding-mask)"
            />
          </motion.svg>

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute glass-card p-5 z-10"
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: tooltipWidth,
                maxWidth: 'calc(100vw - 32px)',
              }}
            >
              {/* Close button */}
              <button
                onClick={onSkip}
                className="absolute top-3 right-3 glass-button rounded-lg p-1 hover:scale-105 transition-transform"
              >
                <X size={12} />
              </button>

              <h3 className="font-semibold text-sm mb-1.5 pr-6">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Progress dots */}
              <div className="flex gap-1.5 mt-4">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i === currentStep
                        ? 'bg-blue-500 w-4'
                        : i < currentStep
                          ? 'bg-blue-500/40'
                          : 'bg-white/20'
                    )}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={onSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Saltar
                </button>
                <div className="flex gap-2">
                  {!isFirst && (
                    <button
                      onClick={onPrev}
                      className="glass-button rounded-xl px-3 py-1.5 text-xs flex items-center gap-1"
                    >
                      <ChevronLeft size={12} />
                      Anterior
                    </button>
                  )}
                  <button
                    onClick={onNext}
                    className="bg-blue-500 text-white rounded-xl px-4 py-1.5 text-xs font-medium flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    {isLast ? 'Empezar' : 'Siguiente'}
                    {!isLast && <ChevronRight size={12} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
