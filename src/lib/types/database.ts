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
}
