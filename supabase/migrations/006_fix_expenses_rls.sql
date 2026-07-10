-- Drop the incorrect policy
DROP POLICY IF EXISTS "expenses_insert" ON expenses;

-- Re-create the policy using can_access_shop() instead of user_shop_ids()
-- This correctly handles both super_admins (who have access to all shops) 
-- and staff (who have specific assignments)
CREATE POLICY "expenses_insert"
  ON expenses FOR INSERT
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.can_access_shop(shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );
