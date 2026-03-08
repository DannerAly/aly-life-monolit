import { cn } from '@/lib/utils/cn';
import type { TaskStatus } from '@/lib/types/database';

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  active: {
    label: 'Activo',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  },
  completed: {
    label: 'Completado',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
  failed: {
    label: 'Fallido',
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  },
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 dark:bg-white/10 border border-white/20',
        className
      )}
    >
      {children}
    </span>
  );
}
