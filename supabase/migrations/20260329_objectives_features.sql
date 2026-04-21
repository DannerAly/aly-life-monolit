-- ══════════════════════════════════════════════════
-- Migration: Objectives Module Features
-- Date: 2026-03-29
-- Features: Description, Tags, Subtasks, Recurrence,
--           Archive, Progress History
-- ══════════════════════════════════════════════════

-- ── 1. New columns on tasks table ────────────────

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence text CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly'));

-- ── 2. Subtasks table ────────────────────────────

CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- RLS: subtasks inherit access from parent task's user
CREATE POLICY "Users can manage subtasks of own tasks"
  ON subtasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = subtasks.task_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = subtasks.task_id
    )
  );

-- ── 3. Progress history table ────────────────────

CREATE TABLE IF NOT EXISTS progress_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  target numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, date)
);

ALTER TABLE progress_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage progress history of own tasks"
  ON progress_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = progress_history.task_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = progress_history.task_id
    )
  );

-- ── 4. Indexes ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence) WHERE recurrence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_task_date ON progress_history(task_id, date);
