'use client';

import { useState } from 'react';
import { Moon, Sun, Zap, LogOut, ChevronDown, HelpCircle } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface HeaderProps {
  onStartTutorial?: () => void;
}

export function Header({ onStartTutorial }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  const isFinances = pathname === '/finances';
  const isObjectives = !isFinances;

  // Google OAuth manda los datos en user_metadata
  const meta = user?.user_metadata ?? {};
  const avatar = (meta.avatar_url ?? meta.picture ?? null) as string | null;
  const name = (meta.full_name ?? meta.name ?? user?.email ?? '') as string;
  const firstName = name.split(' ')[0] || 'Usuario';

  return (
    <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-4">
      {/* Logo */}
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

      {/* Navigation Pills */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden sm:flex gap-1 glass-card rounded-2xl p-1"
      >
        <Link
          href="/"
          className={cn(
            'px-4 py-1.5 rounded-xl text-xs font-medium transition-all',
            isObjectives
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Objetivos
        </Link>
        <Link
          href="/finances"
          data-onboarding="nav-finances"
          className={cn(
            'px-4 py-1.5 rounded-xl text-xs font-medium transition-all',
            isFinances
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Finanzas
        </Link>
      </motion.nav>

      {/* Right side */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        {/* Dark mode toggle */}
        <motion.button
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

        {/* User menu */}
        {user && (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowUserMenu(o => !o)}
              className="glass-button rounded-xl flex items-center gap-2 px-3 py-2 hover:scale-[1.02] transition-transform"
            >
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  width={28}
                  height={28}
                  className="rounded-full ring-1 ring-white/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  {firstName[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
                {firstName}
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute right-0 top-12 z-20 glass-card min-w-[200px] p-2"
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {onStartTutorial && (
                      <button
                        onClick={() => { onStartTutorial(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-blue-500/10 hover:text-blue-500 transition-colors text-left"
                      >
                        <HelpCircle size={14} />
                        Ver tutorial
                      </button>
                    )}
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      Cerrar sesión
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </header>
  );
}
