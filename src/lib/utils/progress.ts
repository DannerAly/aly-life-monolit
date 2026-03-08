import type { Task, TaskStatus, TaskWithProgress } from "@/lib/types/database";

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function deriveStatus(task: Task): TaskStatus {
  if (task.current_value >= task.target_value) return 'completed';
  if (task.due_date) {
    const due = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return 'failed';
  }
  return 'active';
}

export function withProgress(task: Task): TaskWithProgress {
  return {
    ...task,
    progress: calculateProgress(task.current_value, task.target_value),
  };
}

export function calculateCategoryAverage(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, t) => {
    return sum + calculateProgress(t.current_value, t.target_value);
  }, 0);
  return Math.round(total / tasks.length);
}

export function getOverallStats(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter(t => deriveStatus(t) === 'completed').length;
  const failed = tasks.filter(t => deriveStatus(t) === 'failed').length;
  const active = total - completed - failed;
  const avgProgress = calculateCategoryAverage(tasks);
  return { total, completed, failed, active, avgProgress };
}
