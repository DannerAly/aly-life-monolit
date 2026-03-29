-- Migration: Add finance cycle day and budget limits
-- Run this in your Supabase SQL Editor

-- 1. Add configurable cycle day to user_preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS finance_cycle_day integer NOT NULL DEFAULT 1
CHECK (finance_cycle_day >= 1 AND finance_cycle_day <= 28);

-- 2. Add monthly budget to user_preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS monthly_budget numeric DEFAULT NULL;

-- 3. Add spending limit per finance category
ALTER TABLE finance_categories
ADD COLUMN IF NOT EXISTS spending_limit numeric DEFAULT NULL;
