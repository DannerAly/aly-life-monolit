-- ══════════════════════════════════════════════════
-- Migration: Finance Features
-- Date: 2026-03-29
-- Features: Recurring Transactions, Savings Goals, Debts,
--           Bills, Accounts, Notes/Tags, Subcategories,
--           Envelope Budgeting
-- ══════════════════════════════════════════════════

-- ── 1. Add new columns to existing tables (basic) ──

-- Transactions: notes, tags, account_id (recurring_id added after table exists)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS account_id uuid;

-- Finance Categories: parent_id (subcategories), budget_amount (envelope)
ALTER TABLE finance_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES finance_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS budget_amount numeric;

-- ── 2. Recurring Transactions ────────────────────

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES finance_categories(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL DEFAULT '',
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  next_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  last_generated date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring transactions"
  ON recurring_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add recurring_id FK now that recurring_transactions exists
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS recurring_id uuid REFERENCES recurring_transactions(id) ON DELETE SET NULL;

-- ── 3. Savings Goals ─────────────────────────────

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🎯',
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline date,
  color text NOT NULL DEFAULT '#10b981',
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings goals"
  ON savings_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Debts ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person text NOT NULL,
  emoji text NOT NULL DEFAULT '👤',
  type text NOT NULL CHECK (type IN ('lent', 'borrowed')),
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  paid_amount numeric NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  description text NOT NULL DEFAULT '',
  due_date date,
  is_settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debts"
  ON debts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. Bills / Payment Reminders ─────────────────

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📅',
  amount numeric NOT NULL CHECK (amount > 0),
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category_id uuid REFERENCES finance_categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_paid_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bills"
  ON bills FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 6. Finance Accounts ──────────────────────────

CREATE TABLE IF NOT EXISTS finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🏦',
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'savings', 'credit', 'investment', 'other')),
  initial_balance numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#3b82f6',
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own finance accounts"
  ON finance_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add foreign key for transactions.account_id (after finance_accounts exists)
-- Note: Run this after the table is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'transactions_account_id_fkey'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES finance_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 7. Indexes ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_transactions(next_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_finance_accounts_user ON finance_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(recurring_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_parent ON finance_categories(parent_id);
