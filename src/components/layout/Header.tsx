'use client';

import { Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { motion } from 'motion/react';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <div className="glass-button rounded-xl p-2">
          <Zap size={18} className="text-blue-500" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          aly<span className="text-blue-500">.</span>life
        </span>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="glass-button rounded-xl p-2.5 hover:scale-105 transition-transform"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} className="text-blue-500" />
        )}
      </motion.button>
    </header>
  );
}
