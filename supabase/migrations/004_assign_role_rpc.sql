-- ============================================================
-- SAREE ERP – RPC FUNCTION TO ASSIGN ROLE
-- This function allows Super Admins to assign a role to a newly signed up user by email.
-- Since new users have no company_id, RLS blocks direct client updates.
-- This SECURITY DEFINER function bypasses RLS safely after verifying the caller is a super admin.
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_role_by_email(
  p_email TEXT,
  p_role user_role,
  p_company_id UUID,
  p_shop_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role user_role;
  v_caller_company UUID;
  v_target_id UUID;
BEGIN
  -- 1. Get the caller's profile
  SELECT role, company_id INTO v_caller_role, v_caller_company
  FROM public.profiles
  WHERE id = auth.uid();

  -- 2. Verify caller is a super_admin and matches the target company
  IF v_caller_role != 'super_admin' OR v_caller_company != p_company_id THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can assign roles for their company.';
  END IF;

  -- 3. Find the target user by email
  SELECT id INTO v_target_id
  FROM public.profiles
  WHERE email = LOWER(TRIM(p_email));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found. Make sure they have signed up first!';
  END IF;

  -- 4. Update the target user's role and company_id
  UPDATE public.profiles
  SET role = p_role,
      company_id = p_company_id,
      updated_at = NOW()
  WHERE id = v_target_id;

  -- 5. Assign user to the specific shop (upsert to avoid unique constraint errors if re-assigning)
  INSERT INTO public.shop_staff (shop_id, profile_id, role, is_active)
  VALUES (p_shop_id, v_target_id, p_role, true)
  ON CONFLICT (shop_id, profile_id) 
  DO UPDATE SET role = EXCLUDED.role, is_active = true, updated_at = NOW();

  RETURN TRUE;
END;
$$;
