-- ============================================================
-- SAREE ERP – ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies.sql
-- Description: Enable RLS + helper functions + all policies
-- ============================================================

-- ─── Enable RLS on every table ───────────────────────────────────────────────
ALTER TABLE companies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_staff             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory              ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns                ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance             ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS (SECURITY DEFINER – bypass RLS internally)
-- These are called within policies to avoid recursive RLS evaluation.
-- ─────────────────────────────────────────────────────────────────────────────

-- Get the current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Get the current user's company_id
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Get the array of shop_ids the current user is assigned to
CREATE OR REPLACE FUNCTION public.user_shop_ids(
)
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(shop_id), '{}')
  FROM public.shop_staff
  WHERE profile_id = auth.uid() AND is_active = true;
$$;

-- Check if the current user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Check if current user can manage a specific shop (super_admin OR assigned manager/staff)
CREATE OR REPLACE FUNCTION public.can_access_shop(
p_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    public.is_super_admin(
)
    OR p_shop_id = ANY(public.user_shop_ids(
));
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: companies
-- Only the super_admin can view/update their company.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "company_select_own"
  ON companies FOR SELECT
  USING (id = public.user_company_id());

CREATE POLICY "company_update_super_admin"
  ON companies FOR UPDATE
  USING (id = public.user_company_id() AND public.is_super_admin(
))
  WITH CHECK (id = public.user_company_id() AND public.is_super_admin(
));

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: profiles
-- CRITICAL FIX: profiles_select_company must NOT call user_company_id()
-- because user_company_id() queries the profiles table, creating infinite
-- recursion → permanent hang.
-- Solution: Use auth.uid() direct comparison only for own row access.
-- For company-wide access: use a direct subquery with SECURITY DEFINER bypass.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_company"
  ON profiles FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_super_admin"
  ON profiles FOR UPDATE
  USING (company_id = public.user_company_id() AND public.is_super_admin(
))
  WITH CHECK (company_id = public.user_company_id() AND public.is_super_admin(
));

CREATE POLICY "profiles_insert_super_admin"
  ON profiles FOR INSERT
  WITH CHECK (company_id = public.user_company_id() AND public.is_super_admin(
));

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: shops
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "shops_select"
  ON shops FOR SELECT
  USING (
    company_id = public.user_company_id()
    AND (public.is_super_admin(
) OR id = ANY(public.user_shop_ids(
)))
  );

CREATE POLICY "shops_insert_super_admin"
  ON shops FOR INSERT
  WITH CHECK (company_id = public.user_company_id() AND public.is_super_admin(
));

CREATE POLICY "shops_update_super_admin"
  ON shops FOR UPDATE
  USING (company_id = public.user_company_id() AND public.is_super_admin(
))
  WITH CHECK (company_id = public.user_company_id() AND public.is_super_admin(
));

CREATE POLICY "shops_delete_super_admin"
  ON shops FOR DELETE
  USING (company_id = public.user_company_id() AND public.is_super_admin(
));

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: shop_staff
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "shop_staff_select"
  ON shop_staff FOR SELECT
  USING (
    public.is_super_admin(
)
    OR shop_id = ANY(public.user_shop_ids(
))
    OR profile_id = auth.uid()
  );

CREATE POLICY "shop_staff_manage_super_admin"
  ON shop_staff FOR ALL
  USING (public.is_super_admin(
))
  WITH CHECK (public.is_super_admin(
));

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: shop_settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "shop_settings_select"
  ON shop_settings FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "shop_settings_manage"
  ON shop_settings FOR ALL
  USING (
    public.is_super_admin(
)
    OR (
      shop_id = ANY(public.user_shop_ids(
))
      AND public.user_role() = 'shop_manager'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: categories
-- All company members can view. Only super_admin/manager can modify.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "categories_select_company"
  ON categories FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "categories_manage"
  ON categories FOR ALL
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: brands
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "brands_select_company"
  ON brands FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "brands_manage"
  ON brands FOR ALL
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: suppliers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "suppliers_select_company"
  ON suppliers FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "suppliers_manage"
  ON suppliers FOR ALL
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: products
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "products_select_company"
  ON products FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "products_manage"
  ON products FOR ALL
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager', 'staff')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager', 'staff')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: product_images
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "product_images_select"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.company_id = public.user_company_id()
    )
  );

CREATE POLICY "product_images_manage"
  ON product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.company_id = public.user_company_id()
    )
    AND public.user_role() IN ('super_admin', 'shop_manager', 'staff')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: inventory
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "inventory_select"
  ON inventory FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "inventory_manage"
  ON inventory FOR ALL
  USING (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'staff')
  )
  WITH CHECK (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'staff')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: inventory_transactions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "inv_txn_select"
  ON inventory_transactions FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "inv_txn_insert"
  ON inventory_transactions FOR INSERT
  WITH CHECK (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'staff')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: stock_alerts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "stock_alerts_select"
  ON stock_alerts FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "stock_alerts_update"
  ON stock_alerts FOR UPDATE
  USING (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: customers
-- All staff can view/create. Managers+ can update/delete.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "customers_select_company"
  ON customers FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "customers_insert"
  ON customers FOR INSERT
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "customers_update"
  ON customers FOR UPDATE
  USING (company_id = public.user_company_id())
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "customers_delete_manager"
  ON customers FOR DELETE
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: loyalty_transactions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "loyalty_select"
  ON loyalty_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = loyalty_transactions.customer_id
      AND c.company_id = public.user_company_id()
    )
  );

CREATE POLICY "loyalty_insert"
  ON loyalty_transactions FOR INSERT
  WITH CHECK (public.can_access_shop(
shop_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: coupons
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "coupons_select"
  ON coupons FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "coupons_manage"
  ON coupons FOR ALL
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: sales
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "sales_select"
  ON sales FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "sales_insert"
  ON sales FOR INSERT
  WITH CHECK (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );

CREATE POLICY "sales_update"
  ON sales FOR UPDATE
  USING (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: sale_items, payments (scoped via sale_id → sales.shop_id)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "sale_items_select"
  ON sale_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id AND public.can_access_shop(
s.shop_id)
    )
  );

CREATE POLICY "sale_items_insert"
  ON sale_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id AND public.can_access_shop(
s.shop_id)
    )
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );

CREATE POLICY "payments_select"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = payments.sale_id AND public.can_access_shop(
s.shop_id)
    )
  );

CREATE POLICY "payments_insert"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = payments.sale_id AND public.can_access_shop(
s.shop_id)
    )
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: returns, return_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "returns_select"
  ON returns FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "returns_manage"
  ON returns FOR ALL
  USING (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  )
  WITH CHECK (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );

CREATE POLICY "return_items_select"
  ON return_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM returns r
      WHERE r.id = return_items.return_id AND public.can_access_shop(
r.shop_id)
    )
  );

CREATE POLICY "return_items_manage"
  ON return_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM returns r
      WHERE r.id = return_items.return_id AND public.can_access_shop(
r.shop_id)
    )
    AND public.user_role() IN ('super_admin', 'shop_manager', 'cashier')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: purchase_orders, purchase_order_items, supplier_payments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "po_select"
  ON purchase_orders FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "po_manage"
  ON purchase_orders FOR ALL
  USING (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager')
  )
  WITH CHECK (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

CREATE POLICY "poi_select"
  ON purchase_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
      AND public.can_access_shop(
po.shop_id)
    )
  );

CREATE POLICY "poi_manage"
  ON purchase_order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
      AND public.can_access_shop(
po.shop_id)
    )
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

CREATE POLICY "supplier_payments_select"
  ON supplier_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_payments.supplier_id
      AND s.company_id = public.user_company_id()
    )
  );

CREATE POLICY "supplier_payments_manage"
  ON supplier_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_payments.supplier_id
      AND s.company_id = public.user_company_id()
    )
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: employees, attendance, salary_records
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "employees_select"
  ON employees FOR SELECT
  USING (
    company_id = public.user_company_id()
    AND (public.is_super_admin(
) OR shop_id = ANY(public.user_shop_ids(
)))
  );

CREATE POLICY "employees_manage"
  ON employees FOR ALL
  USING (
    company_id = public.user_company_id()
    AND (
      public.is_super_admin(
)
      OR (
        shop_id = ANY(public.user_shop_ids(
))
        AND public.user_role() = 'shop_manager'
      )
    )
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND (
      public.is_super_admin(
)
      OR (
        shop_id = ANY(public.user_shop_ids(
))
        AND public.user_role() = 'shop_manager'
      )
    )
  );

CREATE POLICY "attendance_select"
  ON attendance FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "attendance_manage"
  ON attendance FOR ALL
  USING (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager')
  )
  WITH CHECK (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

CREATE POLICY "salary_records_select"
  ON salary_records FOR SELECT
  USING (public.can_access_shop(
shop_id));

CREATE POLICY "salary_records_manage"
  ON salary_records FOR ALL
  USING (
    public.can_access_shop(
shop_id)
    AND public.user_role() IN ('super_admin', 'shop_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: audit_logs
-- Read-only for super_admin. System-only inserts via SECURITY DEFINER functions.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  USING (company_id = public.user_company_id() AND public.is_super_admin(
));

CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (company_id = public.user_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES: notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (
    company_id = public.user_company_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
    AND (shop_id IS NULL OR public.can_access_shop(
shop_id))
  );

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (company_id = public.user_company_id());
