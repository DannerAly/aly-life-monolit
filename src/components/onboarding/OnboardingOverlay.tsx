'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
const TOOLTIP_WIDTH = 320;

function findTargetElement(step: OnboardingStep): Element | null {
  let el = document.querySelector(step.targetSelector);
  // Check if element is actually visible (not hidden via CSS)
  if (el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (rect.width === 0 || rect.height === 0 || style.display === 'none' || style.visibility === 'hidden') {
      el = null; // treat as not found
    }
  }
  if (!el && step.fallbackSelector) {
    el = document.querySelector(step.fallbackSelector);
  }
  return el;
}

function measureElement(el: Element): TargetRect {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

function computeTooltipPos(
  targetRect: TargetRect,
  position: OnboardingStep['position'],
): { top: number; left: number; actualPosition: OnboardingStep['position'] } {
  const gap = 16;
  const scrollY = window.scrollY;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Convert target from page coords to viewport coords for visibility checks
  const viewportY = targetRect.y - scrollY;

  // Try the preferred position, fall back if it doesn't fit
  let pos = position;

  // If bottom would push tooltip off screen, try top
  if (pos === 'bottom' && viewportY + targetRect.height + PADDING + gap + 180 > vh) {
    pos = 'top';
  }
  // If top would push tooltip off screen, try bottom
  if (pos === 'top' && viewportY - PADDING - gap - 180 < 0) {
    pos = 'bottom';
  }

  let top = 0;
  let left = 0;

  switch (pos) {
    case 'bottom':
      top = targetRect.y + targetRect.height + PADDING + gap;
      left = targetRect.x + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'top':
      top = targetRect.y - PADDING - gap - 180;
      left = targetRect.x + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'right':
      top = targetRect.y + targetRect.height / 2 - 90;
      left = targetRect.x + targetRect.width + PADDING + gap;
      break;
    case 'left':
      top = targetRect.y + targetRect.height / 2 - 90;
      left = targetRect.x - PADDING - gap - TOOLTIP_WIDTH;
      break;
  }

  // Clamp horizontal
  left = Math.max(16, Math.min(left, vw - TOOLTIP_WIDTH - 16));
  // Clamp vertical (keep tooltip in visible viewport area)
  top = Math.max(scrollY + 16, Math.min(top, scrollY + vh - 200));

  return { top, left, actualPosition: pos };
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
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const prevStepRef = useRef<number>(-1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply/remove targetClass on the DOM element for the current step
  useEffect(() => {
    if (!active || !step?.targetClass) return;

    const el = findTargetElement(step);
    if (!el) return;

    const classes = step.targetClass.split(' ').filter(Boolean);
    el.classList.add(...classes);

    return () => {
      el.classList.remove(...classes);
    };
  }, [active, step]);

  // Main measurement function — polls until stable
  const measureAndPosition = useCallback(() => {
    if (!step) return;

    // Clear any previous polling
    if (pollRef.current) clearInterval(pollRef.current);

    const el = findTargetElement(step);

    if (!el) {
      // Center fallback
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const sy = window.scrollY;
      const fallbackRect = {
        x: vw / 2 - 100,
        y: sy + vh / 2 - 50,
        width: 200,
        height: 100,
      };
      setTargetRect(fallbackRect);
      setTooltipPos(computeTooltipPos(fallbackRect, step.position));
      return;
    }

    // Scroll element into view first
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Poll rect until it stabilizes (scroll finished)
    let stableCount = 0;
    let lastRect: TargetRect | null = null;

    const poll = () => {
      const newRect = measureElement(el);

      if (
        lastRect &&
        Math.abs(newRect.x - lastRect.x) < 1 &&
        Math.abs(newRect.y - lastRect.y) < 1 &&
        Math.abs(newRect.width - lastRect.width) < 1
      ) {
        stableCount++;
      } else {
        stableCount = 0;
      }

      lastRect = newRect;
      setTargetRect(newRect);
      setTooltipPos(computeTooltipPos(newRect, step.position));

      // Consider stable after 5 consecutive same readings (~250ms)
      if (stableCount >= 5) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    // Start polling at 50ms intervals
    poll(); // immediate first measure
    pollRef.current = setInterval(poll, 50);

    // Safety: stop after 2s regardless
    setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
    }, 2000);
  }, [step]);

  // Trigger measurement when step changes
  useEffect(() => {
    if (!active || !step) return;

    // Small delay to let DOM render (especially for new steps)
    const delay = prevStepRef.current === -1 ? 400 : 100;
    prevStepRef.current = currentStep;
    const timer = setTimeout(measureAndPosition, delay);

    return () => {
      clearTimeout(timer);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [active, step, currentStep, measureAndPosition]);

  // Recalculate on resize and scroll
  useEffect(() => {
    if (!active || !step) return;

    const handleResize = () => measureAndPosition();
    const handleScroll = () => {
      // Only update tooltip position without re-scrolling
      if (!step) return;
      const el = findTargetElement(step);
      if (el) {
        const newRect = measureElement(el);
        setTargetRect(newRect);
        setTooltipPos(computeTooltipPos(newRect, step.position));
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [active, step, measureAndPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (!mounted || !active || !step || !targetRect || !tooltipPos) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  // Convert target rect to viewport coords for the SVG mask
  const scrollY = window.scrollY;
  const viewRect = {
    x: targetRect.x,
    y: targetRect.y - scrollY,
    width: targetRect.width,
    height: targetRect.height,
  };

  return createPortal(
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[60]" style={{ pointerEvents: 'auto' }}>
          {/* SVG overlay with spotlight hole */}
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id="onboarding-mask">
                <rect width="100%" height="100%" fill="white" />
                <motion.rect
                  fill="black"
                  rx={16}
                  animate={{
                    x: viewRect.x - PADDING,
                    y: viewRect.y - PADDING,
                    width: viewRect.width + PADDING * 2,
                    height: viewRect.height + PADDING * 2,
                  }}
                  transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.6)"
              mask="url(#onboarding-mask)"
            />
          </motion.svg>

          {/* Clickable overlay area (outside spotlight) to prevent interaction */}
          <div
            className="fixed inset-0"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Tooltip — uses absolute positioning in page coords */}
          <div className="absolute inset-0" style={{ pointerEvents: 'none', overflow: 'visible' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="glass-card p-5 z-10"
                style={{
                  position: 'fixed',
                  top: tooltipPos.top - scrollY,
                  left: tooltipPos.left,
                  width: TOOLTIP_WIDTH,
                  maxWidth: 'calc(100vw - 32px)',
                  pointerEvents: 'auto',
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
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
