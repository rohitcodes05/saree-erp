-- ============================================================
-- HOTFIX: profiles RLS Infinite Recursion Fix
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================
--
-- ROOT CAUSE:
--   The old "profiles_select_company" policy called user_company_id()
--   which itself does: SELECT company_id FROM profiles WHERE id = auth.uid()
--   This triggers the profiles SELECT policy AGAIN → infinite recursion → hang.
--
-- FIX:
--   1. Drop the old recursive policy.
--   2. Create two separate non-recursive policies:
--      a. profiles_select_own  → direct auth.uid() check (no function call)
--      b. profiles_select_company → inline subquery (Postgres breaks the cycle
--         because it's evaluated in a single query, not via a policy function)
-- ============================================================

-- Step 1: Drop the broken policy
DROP POLICY IF EXISTS "profiles_select_company" ON profiles;

-- Step 2: Allow each user to always see their own profile (no function call)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Step 3: Allow viewing all profiles in the same company
--         Uses an inline subquery instead of user_company_id() to avoid recursion
CREATE POLICY "profiles_select_company"
  ON profiles FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- ============================================================
-- VERIFY: Run these after applying the fix
-- ============================================================
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'profiles'
-- ORDER BY policyname;
