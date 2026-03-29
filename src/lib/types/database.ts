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
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  icon_color: string;
  frequency: HabitFrequency;
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
  todayValue: number;     // value for today (daily: counter, weekly/monthly: 0 or 1)
  periodValue: number;    // accumulated value in current period
  periodGoal: number;     // goal for the period (= daily_goal for all frequencies)
  progress: number;       // 0-100
  goalMet: boolean;
}

export interface HabitFormData {
  name: string;
  emoji: string;
  icon_color: string;
  frequency: HabitFrequency;
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

export type GridItemSize = 'mini' | '1x1' | '2x1' | '1x2' | '2x2';

export interface GridItem {
  type: 'category' | 'habit';
  id: string;
  size?: GridItemSize;
}

// ── Finance Types ──────────────────────────────────
export type TransactionType = 'income' | 'expense';
export type FinanceCategoryType = 'income' | 'expense' | 'both';

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  color: string;
  type: FinanceCategoryType;
  spending_limit: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  is_imported: boolean;
  import_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string | null;
  category_emoji: string | null;
  category_color: string | null;
}

export interface ClassificationRule {
  id: string;
  user_id: string;
  keyword: string;
  category_id: string;
  transaction_type: TransactionType;
  priority: number;
  created_at: string;
}

export interface FinanceCategoryFormData {
  name: string;
  emoji?: string;
  color: string;
  type: FinanceCategoryType;
  spending_limit?: number | null;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  category_id?: string;
}

export interface ClassificationRuleFormData {
  keyword: string;
  category_id: string;
  transaction_type: TransactionType;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryBreakdown {
  category_id: string | null;
  category_name: string;
  category_emoji: string | null;
  category_color: string;
  total: number;
  percentage: number;
  count: number;
  spending_limit: number | null;
}

// ── Period Views ──
export type PeriodView = 'week' | 'month' | 'year' | 'custom';

export interface PeriodSummary {
  period: string;
  label: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface ImportPreviewRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  suggestedCategory: FinanceCategory | null;
  matchedRule: ClassificationRule | null;
  isDuplicate: boolean;
  selected: boolean;
}
