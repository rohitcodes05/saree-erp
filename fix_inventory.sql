-- 1. Modify the view so that products with 0 stock (no inventory row) STILL appear in the Inventory list.
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT
  COALESCE(i.id, gen_random_uuid()) AS id,
  sh.id AS shop_id,
  sh.name AS shop_name,
  sh.company_id,
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.barcode,
  p.category_id,
  c.name AS category_name,
  p.fabric,
  p.color,
  p.selling_price,
  p.purchase_price,
  p.gst_rate,
  COALESCE(i.quantity, 0) AS quantity,
  COALESCE(i.minimum_stock, 5) AS minimum_stock,
  i.rack_number,
  (COALESCE(i.quantity, 0) * p.purchase_price) AS inventory_value,
  CASE
    WHEN COALESCE(i.quantity, 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(i.quantity, 0) <= COALESCE(i.minimum_stock, 5) THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status,
  i.last_stock_update,
  COALESCE(i.updated_at, p.updated_at) AS updated_at
FROM products p
JOIN shops sh ON sh.company_id = p.company_id
LEFT JOIN inventory i ON i.product_id = p.id AND i.shop_id = sh.id
LEFT JOIN categories c ON c.id = p.category_id;


-- 2. Create an RPC function to safely adjust stock and record the transaction.
CREATE OR REPLACE FUNCTION adjust_stock(
  p_shop_id UUID,
  p_product_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qty_before INTEGER;
  v_qty_after INTEGER;
BEGIN
  -- Get current qty
  SELECT quantity INTO v_qty_before
  FROM inventory
  WHERE shop_id = p_shop_id AND product_id = p_product_id;

  IF v_qty_before IS NULL THEN
    v_qty_before := 0;
  END IF;

  -- Calculate new qty based on type
  IF p_type = 'stock_in' THEN
    v_qty_after := v_qty_before + p_quantity;
  ELSIF p_type = 'stock_out' OR p_type = 'damage' THEN
    v_qty_after := v_qty_before - p_quantity;
  ELSE
    -- For 'adjustment', assume p_quantity is the exact amount added/removed (delta)
    v_qty_after := v_qty_before + p_quantity;
  END IF;

  -- Upsert into inventory table
  INSERT INTO inventory (shop_id, product_id, quantity, minimum_stock, updated_at)
  VALUES (p_shop_id, p_product_id, v_qty_after, 5, NOW())
  ON CONFLICT (shop_id, product_id)
  DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    last_stock_update = NOW(),
    updated_at = NOW();

  -- Insert history record
  INSERT INTO inventory_transactions (
    shop_id, product_id, type, quantity, quantity_before, quantity_after, notes, created_at
  ) VALUES (
    p_shop_id, p_product_id, p_type::inventory_transaction_type, p_quantity, v_qty_before, v_qty_after, p_notes, NOW()
  );

  -- Check for low stock alerts
  PERFORM check_and_create_stock_alert(p_shop_id, p_product_id);
END;
$$;
