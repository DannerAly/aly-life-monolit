'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, AlertTriangle, TrendingUp, Target,
  Flame, Clock, CheckCircle2, XCircle, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CircularProgress } from '@/components/ui/CircularProgress';
import type { CategoryWithTasks, Task } from '@/lib/types/database';
import { calculateProgress, deriveStatus } from '@/lib/utils/progress';
import { formatRelativeDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

type StatsView = 'day' | 'week' | 'month' | 'year';

interface ObjectivesStatsModalProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithTasks[];
}

const VIEW_OPTIONS: { value: StatsView; label: string }[] = [
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

function getDateRange(view: StatsView): { start: Date; end: Date } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (view) {
    case 'day':
      return { start: now, end };
    case 'week': {
      const start = new Date(now);
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
  }
}

function filterTasksByPeriod(tasks: Task[], view: StatsView): Task[] {
  if (view === 'year') return tasks;
  const { start, end } = getDateRange(view);
  return tasks.filter(t => {
    if (!t.due_date) return view === 'month';
    const due = new Date(t.due_date + 'T00:00:00');
    return due >= start && due <= end;
  });
}

interface CategoryStats {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeTasks: number;
  avgProgress: number;
  completionRate: number;
  tasks: (Task & { progress: number })[];
}

export function ObjectivesStatsModal({
  open,
  onClose,
  categories,
}: ObjectivesStatsModalProps) {
  const [view, setView] = useState<StatsView>('month');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const allTasks = useMemo(() => categories.flatMap(c => c.tasks), [categories]);

  const categoryStats: CategoryStats[] = useMemo(() => {
    return categories.map(cat => {
      const tasks = filterTasksByPeriod(cat.tasks, view);
      const total = tasks.length;
      const completed = tasks.filter(t => deriveStatus(t) === 'completed').length;
      const failed = tasks.filter(t => deriveStatus(t) === 'failed').length;
      const active = total - completed - failed;
      const avgProgress = total > 0
        ? Math.round(tasks.reduce((s, t) => s + calculateProgress(t.current_value, t.target_value), 0) / total)
        : 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        totalTasks: total,
        completedTasks: completed,
        failedTasks: failed,
        activeTasks: active,
        avgProgress,
        completionRate,
        tasks: tasks.map(t => ({ ...t, progress: calculateProgress(t.current_value, t.target_value) })),
      };
    }).filter(c => c.totalTasks > 0);
  }, [categories, view]);

  const globalStats = useMemo(() => {
    const tasks = filterTasksByPeriod(allTasks, view);
    const total = tasks.length;
    const completed = tasks.filter(t => deriveStatus(t) === 'completed').length;
    const failed = tasks.filter(t => deriveStatus(t) === 'failed').length;
    const active = total - completed - failed;
    const avgProgress = total > 0
      ? Math.round(tasks.reduce((s, t) => s + calculateProgress(t.current_value, t.target_value), 0) / total)
      : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, failed, active, avgProgress, completionRate };
  }, [allTasks, view]);

  const bestCategory = useMemo(() => {
    if (categoryStats.length === 0) return null;
    return [...categoryStats].sort((a, b) => b.completionRate - a.completionRate)[0];
  }, [categoryStats]);

  const worstCategories = useMemo(() => {
    return categoryStats
      .filter(c => c.failedTasks > 0 || (c.avgProgress < 40 && c.totalTasks > 0))
      .sort((a, b) => a.avgProgress - b.avgProgress)
      .slice(0, 3);
  }, [categoryStats]);

  const urgentTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 3);
    return allTasks
      .filter(t => {
        if (!t.due_date || deriveStatus(t) !== 'active') return false;
        const due = new Date(t.due_date + 'T00:00:00');
        return due >= now && due <= limit;
      })
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''));
  }, [allTasks]);

  const perfectCategories = useMemo(() => {
    return categoryStats.filter(c => c.completionRate === 100 && c.totalTasks > 0);
  }, [categoryStats]);

  const selectedCategory = categoryStats.find(c => c.id === selectedCategoryId) ?? null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <AnimatePresence mode="wait">
        {selectedCategory ? (
          /* ─── Category Detail View ─── */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Back button + Header */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="glass-button rounded-xl p-2 hover:scale-105 transition-transform"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="text-2xl">{selectedCategory.emoji || '📁'}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{selectedCategory.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedCategory.totalTasks} objetivo{selectedCategory.totalTasks !== 1 ? 's' : ''} en este período
                </p>
              </div>
              <CircularProgress
                value={selectedCategory.avgProgress}
                size={48}
                strokeWidth={4}
                color={selectedCategory.color}
                showLabel
                labelClassName="text-[9px]"
              />
            </div>

            {/* Category stat pills */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <MiniStat icon={<Target size={12} />} label="Total" value={selectedCategory.totalTasks} color="text-foreground" bg="bg-white/10" />
              <MiniStat icon={<CheckCircle2 size={12} />} label="Hechos" value={selectedCategory.completedTasks} color="text-emerald-500" bg="bg-emerald-500/10" />
              <MiniStat icon={<Clock size={12} />} label="Activos" value={selectedCategory.activeTasks} color="text-blue-500" bg="bg-blue-500/10" />
              <MiniStat icon={<XCircle size={12} />} label="Fallidos" value={selectedCategory.failedTasks} color="text-rose-500" bg="bg-rose-500/10" />
            </div>

            {/* Completion bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Cumplimiento</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: selectedCategory.color }}>
                  {selectedCategory.completionRate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedCategory.completionRate}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {selectedCategory.tasks
                .sort((a, b) => {
                  const sa = deriveStatus(a), sb = deriveStatus(b);
                  if (sa === 'completed' && sb !== 'completed') return 1;
                  if (sa !== 'completed' && sb === 'completed') return -1;
                  if (sa === 'failed' && sb === 'active') return 1;
                  if (sa === 'active' && sb === 'failed') return -1;
                  return b.progress - a.progress;
                })
                .map((t, i) => {
                  const status = deriveStatus(t);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-3 rounded-xl glass-button"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{t.emoji || '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold truncate">{t.title}</p>
                            <StatusBadge status={status} />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${t.progress}%` }}
                                transition={{ duration: 0.6, delay: i * 0.04 }}
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor:
                                    status === 'completed' ? '#10b981' :
                                    status === 'failed' ? '#f43f5e' :
                                    selectedCategory.color,
                                }}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">
                              {t.progress}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {t.current_value}/{t.target_value}
                              {t.task_type === 'repetition' ? ' repeticiones' : ''}
                            </span>
                            {t.due_date && (
                              <span className={cn(
                                'text-[10px]',
                                status === 'failed' ? 'text-rose-500' : 'text-muted-foreground'
                              )}>
                                {formatRelativeDate(t.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {selectedCategory.tasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Sin objetivos en este período</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* ─── Main Overview ─── */
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Target size={20} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Mis Objetivos</h2>
                  <p className="text-xs text-muted-foreground">Análisis detallado de tu progreso</p>
                </div>
              </div>
              <CircularProgress
                value={globalStats.avgProgress}
                size={56}
                strokeWidth={4}
                color="#3b82f6"
                showLabel
                labelClassName="text-[10px]"
              />
            </div>

            {/* Period toggle */}
            <div className="flex gap-1 glass-card rounded-2xl p-1 mb-6">
              {VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setView(opt.value)}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    view === opt.value
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Main stats pills */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <MiniStat icon={<Target size={13} />} label="Total" value={globalStats.total} color="text-foreground" bg="bg-white/10" />
              <MiniStat icon={<CheckCircle2 size={13} />} label="Completados" value={globalStats.completed} color="text-emerald-500" bg="bg-emerald-500/10" />
              <MiniStat icon={<Clock size={13} />} label="Activos" value={globalStats.active} color="text-blue-500" bg="bg-blue-500/10" />
              <MiniStat icon={<XCircle size={13} />} label="Fallidos" value={globalStats.failed} color="text-rose-500" bg="bg-rose-500/10" />
            </div>

            {/* Completion rate bar */}
            <div className="glass-card rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(16,185,129,0.06) 100%)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Tasa de cumplimiento</span>
                <span className="text-sm font-bold text-blue-500 tabular-nums">{globalStats.completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${globalStats.completionRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3b82f6, #10b981)' }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Best category */}
                {bestCategory && bestCategory.completionRate > 0 && (
                  <Section title="Mejor área" icon={<Trophy size={14} className="text-amber-500" />}>
                    <CategoryRow cat={bestCategory} onClick={() => setSelectedCategoryId(bestCategory.id)} featured />
                  </Section>
                )}

                {/* Perfect categories */}
                {perfectCategories.length > 1 && (
                  <Section title="Áreas perfectas" icon={<Flame size={14} className="text-orange-500" />}>
                    <div className="flex flex-wrap gap-2">
                      {perfectCategories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategoryId(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:scale-105 transition-transform"
                          style={{ background: `${c.color}20`, color: c.color }}
                        >
                          <span>{c.emoji || '📁'}</span>
                          {c.name}
                          <CheckCircle2 size={12} />
                        </button>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Alerts */}
                {worstCategories.length > 0 && (
                  <Section title="Necesitan atención" icon={<AlertTriangle size={14} className="text-amber-500" />}>
                    <div className="space-y-2">
                      {worstCategories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategoryId(c.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl glass-button text-left hover:scale-[1.01] transition-transform group/row"
                        >
                          <span className="text-base">{c.emoji || '📁'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{c.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.avgProgress}%` }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: c.avgProgress < 30 ? '#f43f5e' : '#f59e0b' }}
                                />
                              </div>
                              <span className="text-[10px] tabular-nums text-muted-foreground">{c.avgProgress}%</span>
                            </div>
                          </div>
                          {c.failedTasks > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              {c.failedTasks} fallido{c.failedTasks !== 1 ? 's' : ''}
                            </span>
                          )}
                          <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Urgent tasks */}
                {urgentTasks.length > 0 && (
                  <Section title="Vencen pronto" icon={<Clock size={14} className="text-rose-500" />}>
                    <div className="space-y-1.5">
                      {urgentTasks.slice(0, 5).map(t => {
                        const cat = categories.find(c => c.id === t.category_id);
                        const dueDate = new Date(t.due_date! + 'T00:00:00');
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
                        const progress = calculateProgress(t.current_value, t.target_value);

                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedCategoryId(t.category_id)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl glass-button text-left hover:scale-[1.01] transition-transform"
                          >
                            <span className="text-sm">{t.emoji || cat?.emoji || '📌'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{t.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {cat?.name} · {progress}% completado
                              </p>
                            </div>
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              daysLeft === 0 ? 'bg-rose-500/20 text-rose-500' :
                              daysLeft === 1 ? 'bg-amber-500/20 text-amber-500' :
                              'bg-blue-500/10 text-blue-500'
                            )}>
                              {daysLeft === 0 ? 'Hoy' : daysLeft === 1 ? 'Mañana' : `${daysLeft} días`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* All categories breakdown */}
                {categoryStats.length > 0 && (
                  <Section title="Desglose por área" icon={<TrendingUp size={14} className="text-blue-500" />}>
                    <div className="space-y-2">
                      {categoryStats
                        .sort((a, b) => b.avgProgress - a.avgProgress)
                        .map((c, i) => (
                          <CategoryRow key={c.id} cat={c} index={i} onClick={() => setSelectedCategoryId(c.id)} />
                        ))}
                    </div>
                  </Section>
                )}

                {categoryStats.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-2xl mb-2">📊</p>
                    <p className="text-sm text-muted-foreground">No hay datos para este período</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

/* ─── Sub-components ─── */

function CategoryRow({
  cat,
  index = 0,
  onClick,
  featured = false,
}: {
  cat: CategoryStats;
  index?: number;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-transform hover:scale-[1.01] group/row',
        featured ? '' : 'glass-button'
      )}
      style={featured ? { background: `${cat.color}15`, borderLeft: `3px solid ${cat.color}` } : undefined}
    >
      <span className={featured ? 'text-xl' : 'text-base'}>{cat.emoji || '📁'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={cn('font-semibold truncate', featured ? 'text-sm' : 'text-xs')}>{cat.name}</p>
          <span className="text-xs font-bold tabular-nums ml-2" style={{ color: cat.color }}>
            {featured ? `${cat.completionRate}%` : `${cat.avgProgress}%`}
          </span>
        </div>
        {!featured && (
          <>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.avgProgress}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-emerald-500">{cat.completedTasks} hechos</span>
              {cat.failedTasks > 0 && <span className="text-[10px] text-rose-500">{cat.failedTasks} fallidos</span>}
              <span className="text-[10px] text-muted-foreground">{cat.totalTasks} total</span>
            </div>
          </>
        )}
        {featured && (
          <p className="text-xs text-muted-foreground">{cat.completedTasks}/{cat.totalTasks} completados</p>
        )}
      </div>
      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
    </motion.button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        Completado
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
        Fallido
      </span>
    );
  }
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
      Activo
    </span>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn('rounded-2xl p-2.5 text-center backdrop-blur-sm', bg)}>
      <div className={cn('flex items-center justify-center mb-0.5', color)}>{icon}</div>
      <p className={cn('text-lg font-bold tabular-nums', color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
