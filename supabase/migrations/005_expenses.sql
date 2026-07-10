-- ============================================================
-- SAREE ERP – EXPENSES SCHEMA
-- Migration: 005_expenses.sql
-- ============================================================

-- 1. Create ENUM for Expense Categories
CREATE TYPE expense_category AS ENUM (
  'utilities',    -- Electricity, Water, Internet
  'supplies',     -- Tea, Snacks, Office Supplies, Packaging
  'transport',    -- Travel, Shipping, Freight
  'maintenance',  -- Repairs, Cleaning
  'marketing',    -- Ads, Promotions
  'salary',       -- Staff salary, Wages
  'other'         -- Miscellaneous
);

-- 2. Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Apply updated_at trigger
CREATE TRIGGER trg_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Admins and Shop Managers can view all expenses for their company
CREATE POLICY "expenses_select_management"
  ON expenses FOR SELECT
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- Admins, Managers, AND Cashiers can insert new expenses
CREATE POLICY "expenses_insert"
  ON expenses FOR INSERT
  WITH CHECK (
    company_id = public.user_company_id()
    AND shop_id = ANY(public.user_shop_ids())
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );

-- Only Admins and Managers can update/delete expenses
CREATE POLICY "expenses_update"
  ON expenses FOR UPDATE
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

CREATE POLICY "expenses_delete"
  ON expenses FOR DELETE
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );
