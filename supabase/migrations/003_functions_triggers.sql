-- ============================================================
-- SAREE ERP – FUNCTIONS, TRIGGERS & VIEWS
-- Migration: 003_functions_triggers.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: update_updated_at_column
-- Auto-updates the `updated_at` column on every UPDATE.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'companies', 'profiles', 'shops', 'shop_staff', 'shop_settings',
    'categories', 'brands', 'suppliers', 'products', 'inventory',
    'customers', 'coupons', 'sales', 'returns', 'purchase_orders',
    'employees', 'attendance', 'salary_records'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: handle_new_user
-- Triggered after a new user signs up via Supabase Auth.
-- Auto-creates a profile record with metadata from the signup payload.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_company_id UUID;
BEGIN
  -- Safely extract role (default to 'staff' if invalid or missing)
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'staff'
    );
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'staff';
  END;

  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  INSERT INTO public.profiles (
    id, company_id, first_name, last_name, email, phone, role
  ) VALUES (
    NEW.id,
    v_company_id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    v_role
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: update_last_login
-- Updates the `last_login` field in profiles when a user signs in.
-- Called from the frontend via RPC after auth, not via trigger.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = NOW()
  WHERE id = auth.uid();
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: generate_invoice_number
-- Atomically increments and returns the next invoice number for a shop.
-- Uses FOR UPDATE to prevent race conditions in concurrent billing.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_invoice_number(p_shop_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix  TEXT;
  v_number  INTEGER;
  v_result  TEXT;
BEGIN
  SELECT invoice_prefix, invoice_current_number
  INTO v_prefix, v_number
  FROM public.shop_settings
  WHERE shop_id = p_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop settings not found for shop %', p_shop_id;
  END IF;

  v_result := v_prefix || '-' || LPAD(v_number::TEXT, 6, '0');

  UPDATE public.shop_settings
  SET invoice_current_number = invoice_current_number + 1
  WHERE shop_id = p_shop_id;

  RETURN v_result;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: generate_po_number
-- Same pattern as invoice number but for purchase orders.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_po_number(p_shop_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_code TEXT;
  v_count     INTEGER;
BEGIN
  SELECT code INTO v_shop_code FROM public.shops WHERE id = p_shop_id;
  SELECT COUNT(*) + 1 INTO v_count FROM public.purchase_orders WHERE shop_id = p_shop_id;
  RETURN 'PO-' || v_shop_code || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: check_and_create_stock_alert
-- Creates a stock alert if quantity <= minimum_stock.
-- Resolves any existing alert if stock is now above minimum.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_and_create_stock_alert(
  p_shop_id    UUID,
  p_product_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quantity      INTEGER;
  v_minimum       INTEGER;
BEGIN
  SELECT quantity, minimum_stock
  INTO v_quantity, v_minimum
  FROM public.inventory
  WHERE shop_id = p_shop_id AND product_id = p_product_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_quantity <= v_minimum THEN
    INSERT INTO public.stock_alerts (shop_id, product_id, current_stock, minimum_stock)
    VALUES (p_shop_id, p_product_id, v_quantity, v_minimum)
    ON CONFLICT DO NOTHING;

    -- Insert in-app notification
    INSERT INTO public.notifications (
      company_id, shop_id, type, title, message, data
    )
    SELECT
      sh.company_id,
      p_shop_id,
      'low_stock'::notification_type,
      'Low Stock Alert',
      'Product "' || p.name || '" is running low (' || v_quantity || ' remaining) at ' || sh.name,
      jsonb_build_object(
        'product_id', p_product_id,
        'shop_id', p_shop_id,
        'current_stock', v_quantity,
        'minimum_stock', v_minimum
      )
    FROM public.shops sh
    JOIN public.products p ON p.id = p_product_id
    WHERE sh.id = p_shop_id
    ON CONFLICT DO NOTHING;
  ELSE
    -- Resolve existing unresolved alert
    UPDATE public.stock_alerts
    SET is_resolved = true, resolved_at = NOW()
    WHERE shop_id = p_shop_id
      AND product_id = p_product_id
      AND is_resolved = false;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: update_inventory_on_sale_item
-- Decrements inventory when a sale_item is inserted.
-- Records the transaction in inventory_transactions.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_inventory_on_sale_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id        UUID;
  v_qty_before     INTEGER;
  v_qty_after      INTEGER;
  v_sale_date      TIMESTAMPTZ;
  v_created_by     UUID;
BEGIN
  SELECT shop_id, created_by, sale_date
  INTO v_shop_id, v_created_by, v_sale_date
  FROM public.sales
  WHERE id = NEW.sale_id;

  SELECT quantity INTO v_qty_before
  FROM public.inventory
  WHERE shop_id = v_shop_id AND product_id = NEW.product_id;

  v_qty_after := COALESCE(v_qty_before, 0) - NEW.quantity;

  -- Update inventory
  INSERT INTO public.inventory (shop_id, product_id, quantity, last_stock_update)
  VALUES (v_shop_id, NEW.product_id, GREATEST(v_qty_after, 0), NOW())
  ON CONFLICT (shop_id, product_id)
  DO UPDATE SET
    quantity = GREATEST(EXCLUDED.quantity + inventory.quantity - NEW.quantity + COALESCE(v_qty_before, 0) - inventory.quantity, 0),
    last_stock_update = NOW(),
    updated_at = NOW();

  -- Simpler: direct update
  UPDATE public.inventory
  SET
    quantity = GREATEST(quantity - NEW.quantity, 0),
    last_stock_update = NOW(),
    updated_at = NOW()
  WHERE shop_id = v_shop_id AND product_id = NEW.product_id;

  GET DIAGNOSTICS v_qty_after = ROW_COUNT;

  SELECT quantity INTO v_qty_after
  FROM public.inventory
  WHERE shop_id = v_shop_id AND product_id = NEW.product_id;

  -- Record transaction
  INSERT INTO public.inventory_transactions (
    shop_id, product_id, type, quantity,
    quantity_before, quantity_after,
    reference_type, reference_id,
    unit_cost, created_by
  ) VALUES (
    v_shop_id, NEW.product_id, 'stock_out'::inventory_transaction_type,
    NEW.quantity, v_qty_before, v_qty_after,
    'sale', NEW.sale_id,
    NEW.purchase_price, v_created_by
  );

  -- Check and create stock alert if needed
  PERFORM check_and_create_stock_alert(v_shop_id, NEW.product_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sale_item_inventory
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale_item();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: restore_inventory_on_return
-- Restocks inventory when a return_item is inserted and restocked = true.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION restore_inventory_on_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id    UUID;
  v_qty_before INTEGER;
  v_restocked  BOOLEAN;
BEGIN
  SELECT shop_id, restocked INTO v_shop_id, v_restocked
  FROM public.returns
  WHERE id = NEW.return_id;

  IF NOT v_restocked THEN
    RETURN NEW;
  END IF;

  SELECT quantity INTO v_qty_before
  FROM public.inventory
  WHERE shop_id = v_shop_id AND product_id = NEW.product_id;

  UPDATE public.inventory
  SET
    quantity = quantity + NEW.quantity,
    last_stock_update = NOW(),
    updated_at = NOW()
  WHERE shop_id = v_shop_id AND product_id = NEW.product_id;

  INSERT INTO public.inventory_transactions (
    shop_id, product_id, type, quantity,
    quantity_before, quantity_after,
    reference_type, reference_id
  ) VALUES (
    v_shop_id, NEW.product_id, 'return'::inventory_transaction_type,
    NEW.quantity, v_qty_before, COALESCE(v_qty_before, 0) + NEW.quantity,
    'return', NEW.return_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_return_item_inventory
  AFTER INSERT ON return_items
  FOR EACH ROW
  EXECUTE FUNCTION restore_inventory_on_return();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: update_customer_on_sale
-- Updates customer stats (total_purchases, total_visits, last_visit) on sale.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_customer_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE public.customers
    SET
      total_purchases = total_purchases + NEW.total_amount,
      total_visits    = total_visits + 1,
      last_visit      = NOW(),
      -- Auto-upgrade customer group based on lifetime spend
      customer_group  = CASE
        WHEN (total_purchases + NEW.total_amount) >= 500000 THEN 'platinum'
        WHEN (total_purchases + NEW.total_amount) >= 100000 THEN 'gold'
        WHEN (total_purchases + NEW.total_amount) >= 25000  THEN 'silver'
        ELSE 'regular'
      END,
      updated_at = NOW()
    WHERE id = NEW.customer_id;

    -- Earn loyalty points (if enabled for the shop)
    IF NEW.loyalty_points_earned > 0 THEN
      UPDATE public.customers
      SET loyalty_points = loyalty_points + NEW.loyalty_points_earned
      WHERE id = NEW.customer_id;

      INSERT INTO public.loyalty_transactions (
        customer_id, shop_id, points, type,
        reference_type, reference_id, balance_after
      )
      SELECT
        NEW.customer_id,
        NEW.shop_id,
        NEW.loyalty_points_earned,
        'earned',
        'sale',
        NEW.id,
        c.loyalty_points
      FROM public.customers c
      WHERE c.id = NEW.customer_id;
    END IF;

    -- Deduct redeemed points
    IF NEW.loyalty_points_used > 0 THEN
      UPDATE public.customers
      SET loyalty_points = GREATEST(loyalty_points - NEW.loyalty_points_used, 0)
      WHERE id = NEW.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sale_customer_update
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_on_sale();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: auto_create_shop_settings
-- Auto-creates shop_settings row when a new shop is inserted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_create_shop_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shop_settings (shop_id, invoice_prefix)
  VALUES (NEW.id, UPPER(LEFT(NEW.code, 5)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shop_create_settings
  AFTER INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_shop_settings();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: update_coupon_usage
-- Increments used_count on coupons when a sale using that coupon is completed.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.coupon_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE public.coupons
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = NEW.coupon_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sale_coupon_usage
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_coupon_usage();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: update_po_outstanding
-- Updates outstanding_amount on purchase_orders when a supplier_payment lands.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_po_outstanding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.purchase_order_id IS NOT NULL THEN
    UPDATE public.purchase_orders
    SET
      paid_amount        = paid_amount + NEW.amount,
      outstanding_amount = GREATEST(total_amount - (paid_amount + NEW.amount), 0),
      updated_at         = NOW()
    WHERE id = NEW.purchase_order_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_supplier_payment_po
  AFTER INSERT ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_po_outstanding();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: log_audit_event (RPC callable from frontend)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action        TEXT,
  p_resource_type TEXT,
  p_resource_id   UUID DEFAULT NULL,
  p_old_values    JSONB DEFAULT NULL,
  p_new_values    JSONB DEFAULT NULL,
  p_shop_id       UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    company_id, shop_id, user_id,
    action, resource_type, resource_id,
    old_values, new_values
  ) VALUES (
    auth.user_company_id(),
    p_shop_id,
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: search_products (RPC)
-- Full-text + trigram search across products for a company.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_products(
  p_query     TEXT,
  p_shop_id   UUID DEFAULT NULL,
  p_limit     INTEGER DEFAULT 20,
  p_offset    INTEGER DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  name          VARCHAR,
  sku           VARCHAR,
  barcode       VARCHAR,
  selling_price DECIMAL,
  gst_rate      gst_rate,
  category_name TEXT,
  quantity      INTEGER,
  rank          FLOAT4
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.sku,
    p.barcode,
    p.selling_price,
    p.gst_rate,
    c.name::TEXT AS category_name,
    COALESCE(i.quantity, 0) AS quantity,
    ts_rank(p.search_vector, websearch_to_tsquery('english', p_query)) AS rank
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  LEFT JOIN public.inventory i
    ON i.product_id = p.id AND (p_shop_id IS NULL OR i.shop_id = p_shop_id)
  WHERE
    p.company_id = auth.user_company_id()
    AND p.is_active = true
    AND (
      p.search_vector @@ websearch_to_tsquery('english', p_query)
      OR p.sku ILIKE '%' || p_query || '%'
      OR p.barcode ILIKE '%' || p_query || '%'
      OR p.name ILIKE '%' || p_query || '%'
    )
  ORDER BY rank DESC, p.name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: search_customers (RPC)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_customers(
  p_query   TEXT,
  p_limit   INTEGER DEFAULT 10
)
RETURNS TABLE (
  id              UUID,
  first_name      VARCHAR,
  last_name       VARCHAR,
  phone           VARCHAR,
  email           VARCHAR,
  loyalty_points  DECIMAL,
  customer_group  VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.first_name, c.last_name, c.phone, c.email,
    c.loyalty_points, c.customer_group
  FROM public.customers c
  WHERE
    c.company_id = auth.user_company_id()
    AND (
      c.phone ILIKE '%' || p_query || '%'
      OR c.first_name ILIKE '%' || p_query || '%'
      OR c.last_name ILIKE '%' || p_query || '%'
      OR c.email ILIKE '%' || p_query || '%'
    )
  ORDER BY c.last_visit DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- v_inventory_status: Current stock status with product + shop info
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT
  i.id,
  i.shop_id,
  sh.name                          AS shop_name,
  sh.company_id,
  i.product_id,
  p.name                           AS product_name,
  p.sku,
  p.barcode,
  p.category_id,
  c.name                           AS category_name,
  p.fabric,
  p.color,
  p.selling_price,
  p.purchase_price,
  p.gst_rate,
  i.quantity,
  i.minimum_stock,
  i.rack_number,
  (i.quantity * p.purchase_price)  AS inventory_value,
  CASE
    WHEN i.quantity = 0          THEN 'out_of_stock'
    WHEN i.quantity <= i.minimum_stock THEN 'low_stock'
    ELSE 'in_stock'
  END                              AS stock_status,
  i.last_stock_update,
  i.updated_at
FROM inventory i
JOIN shops sh    ON sh.id = i.shop_id
JOIN products p  ON p.id  = i.product_id
LEFT JOIN categories c ON c.id = p.category_id;

-- v_daily_sales_summary: Aggregated sales per shop per day
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT
  s.shop_id,
  sh.name                                    AS shop_name,
  sh.company_id,
  DATE(s.sale_date)                          AS sale_date,
  COUNT(*)                                   AS total_transactions,
  SUM(s.total_amount)                        AS total_revenue,
  SUM(s.discount_amount + s.coupon_discount) AS total_discounts,
  SUM(s.gst_amount)                          AS total_gst,
  SUM(s.cgst_amount)                         AS total_cgst,
  SUM(s.sgst_amount)                         AS total_sgst,
  AVG(s.total_amount)                        AS avg_transaction_value,
  COUNT(DISTINCT s.customer_id)              AS unique_customers,
  SUM(CASE WHEN s.payment_status = 'pending' THEN s.amount_due ELSE 0 END) AS outstanding_amount
FROM sales s
JOIN shops sh ON sh.id = s.shop_id
WHERE s.status = 'completed'
GROUP BY s.shop_id, sh.name, sh.company_id, DATE(s.sale_date);

-- v_product_performance: Top products by revenue and quantity
CREATE OR REPLACE VIEW v_product_performance AS
SELECT
  si.product_id,
  p.name                                                     AS product_name,
  p.sku,
  p.company_id,
  p.category_id,
  c.name                                                     AS category_name,
  s.shop_id,
  sh.name                                                    AS shop_name,
  COUNT(DISTINCT s.id)                                       AS transaction_count,
  SUM(si.quantity)                                           AS total_qty_sold,
  SUM(si.total_amount)                                       AS total_revenue,
  SUM(si.quantity * (si.unit_price - COALESCE(si.purchase_price, 0))) AS gross_profit
FROM sale_items si
JOIN sales s      ON s.id  = si.sale_id
JOIN products p   ON p.id  = si.product_id
JOIN shops sh     ON sh.id = s.shop_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE s.status = 'completed'
GROUP BY si.product_id, p.name, p.sku, p.company_id, p.category_id,
         c.name, s.shop_id, sh.name;

-- v_gst_report: GST breakup for tax reporting
CREATE OR REPLACE VIEW v_gst_report AS
SELECT
  s.shop_id,
  sh.name                        AS shop_name,
  sh.company_id,
  sh.gst_number                  AS shop_gst_number,
  DATE_TRUNC('month', s.sale_date) AS month,
  s.gst_amount,
  s.cgst_amount,
  s.sgst_amount,
  s.igst_amount,
  s.taxable_amount,
  s.total_amount,
  s.invoice_number,
  s.sale_date,
  si.gst_rate,
  SUM(si.gst_amount)             AS line_gst
FROM sales s
JOIN shops sh        ON sh.id = s.shop_id
JOIN sale_items si   ON si.sale_id = s.id
WHERE s.status = 'completed'
GROUP BY
  s.shop_id, sh.name, sh.company_id, sh.gst_number,
  DATE_TRUNC('month', s.sale_date), s.gst_amount, s.cgst_amount,
  s.sgst_amount, s.igst_amount, s.taxable_amount, s.total_amount,
  s.invoice_number, s.sale_date, si.gst_rate;

-- v_supplier_outstanding: Outstanding dues to suppliers
CREATE OR REPLACE VIEW v_supplier_outstanding AS
SELECT
  sup.id                                                     AS supplier_id,
  sup.name                                                   AS supplier_name,
  sup.company_id,
  sup.phone,
  COUNT(po.id)                                               AS total_orders,
  COALESCE(SUM(po.total_amount), 0)                          AS total_ordered,
  COALESCE(SUM(po.paid_amount), 0)                           AS total_paid,
  COALESCE(SUM(po.outstanding_amount), 0)                    AS total_outstanding
FROM suppliers sup
LEFT JOIN purchase_orders po ON po.supplier_id = sup.id
  AND po.status NOT IN ('cancelled', 'draft')
GROUP BY sup.id, sup.name, sup.company_id, sup.phone;
