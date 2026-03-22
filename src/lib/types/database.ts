export type TaskType = 'one_time' | 'repetition';
export type TaskStatus = 'active' | 'completed' | 'failed';

export interface Category {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  category_id: string;
  title: string;
  emoji: string | null;
  task_type: TaskType;
  target_value: number;
  current_value: number;
  due_date: string | null;
  status: TaskStatus;
  is_completed: boolean;
  sub_filter: string | null;
  priority: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithTasks extends Category {
  tasks: Task[];
  task_count: number;
  average_progress: number;
  completed_count: number;
}

export interface TaskWithProgress extends Task {
  progress: number; // 0-100
}

export interface CategoryFormData {
  name: string;
  emoji?: string;
  color: string;
}

export interface TaskFormData {
  title: string;
  emoji?: string;
  task_type: TaskType;
  target_value: number;
  due_date?: string;
  sub_filter?: string;
  priority?: number | null;
}

export interface GlobalTask extends TaskWithProgress {
  category_name: string;
  category_emoji: string | null;
  category_color: string;
}

// Habits
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  icon_color: string;
  daily_goal: number;
  unit_label: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface HabitWithLog extends Habit {
  todayValue: number;
  progress: number; // 0-100
  goalMet: boolean;
}

export interface HabitFormData {
  name: string;
  emoji: string;
  icon_color: string;
  daily_goal: number;
  unit_label: string;
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  totalDaysTracked: number;
  totalDaysGoalMet: number;
  weeklyData: { date: string; dayLabel: string; value: number }[];
  monthlyData: { date: string; value: number; goalMet: boolean }[];
}

export interface GridItem {
  type: 'category' | 'habit';
  id: string;
}
