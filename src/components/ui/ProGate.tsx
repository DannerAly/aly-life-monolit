'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { UpgradeModal } from './UpgradeModal';

interface ProGateProps {
  isPro: boolean;
  feature?: string;
  children: React.ReactNode;
  /** When true, render children but wrap with overlay instead of replacing */
  overlay?: boolean;
}

export function ProGate({ isPro, feature, children, overlay = false }: ProGateProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isPro) return <>{children}</>;

  if (overlay) {
    return (
      <>
        <div
          className="relative cursor-pointer"
          onClick={() => setShowUpgrade(true)}
        >
          <div className="pointer-events-none select-none opacity-40">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20 backdrop-blur-[1px]">
            <div className="flex items-center gap-1.5 bg-amber-500/90 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow">
              <Lock size={12} />
              Pro
            </div>
          </div>
        </div>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={feature} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowUpgrade(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
      >
        <Lock size={13} />
        <span>Función Pro</span>
      </button>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={feature} />
    </>
  );
}
