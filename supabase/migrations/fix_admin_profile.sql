-- ====================================================================
-- FIX: Create Admin Profile and Restore RLS Policy
-- Run this entire script in Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Restore the correct RLS policy using the SECURITY DEFINER function
-- (The inline subquery we tried earlier can cause actual recursion in Postgres)
DROP POLICY IF EXISTS "profiles_select_company" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

CREATE POLICY "profiles_select_company"
  ON profiles FOR SELECT
  USING (company_id = public.user_company_id() OR id = auth.uid());

-- 2. Ensure the admin user exists in the auth.users table
DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID := 'a0000000-0000-0000-0000-000000000001'; -- Demo company ID
BEGIN
  -- Find the user ID for the admin email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@example.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User admin@example.com not found in auth.users. Please create the user first in Auth dashboard.';
    RETURN;
  END IF;

  -- Create or update the profile row
  INSERT INTO public.profiles (
    id,
    company_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    is_active
  ) VALUES (
    v_user_id,
    v_company_id,
    'Admin',
    'User',
    'admin@example.com',
    '+91 98400 00000',
    'super_admin',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    is_active = true;

  RAISE NOTICE 'Profile successfully created/updated for %', v_user_id;
END;
$$;
