-- ============================================================
-- SAREE ERP – FIX INVENTORY TRIGGER
-- Migration: 008_fix_inventory_trigger.sql
-- ============================================================

-- The previous trigger (trg_sale_item_inventory) had a bug in the 
-- ON CONFLICT clause that caused the inventory quantity to increase 
-- instead of decrease during a sale.
-- This migration replaces the trigger function with a clean, corrected logic.

CREATE OR REPLACE FUNCTION update_inventory_on_sale_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id    UUID;
  v_qty_before INTEGER;
  v_qty_after  INTEGER;
  v_created_by UUID;
BEGIN
  -- 1. Get shop_id from the original sale
  SELECT shop_id, created_by INTO v_shop_id, v_created_by
  FROM public.sales
  WHERE id = NEW.sale_id;

  -- 2. Get current quantity
  SELECT quantity INTO v_qty_before
  FROM public.inventory
  WHERE shop_id = v_shop_id AND product_id = NEW.product_id;

  v_qty_before := COALESCE(v_qty_before, 0);
  v_qty_after := GREATEST(v_qty_before - NEW.quantity, 0);

  -- 3. Safely update inventory with the pre-calculated amount
  INSERT INTO public.inventory (shop_id, product_id, quantity, last_stock_update)
  VALUES (v_shop_id, NEW.product_id, v_qty_after, NOW())
  ON CONFLICT (shop_id, product_id)
  DO UPDATE SET
    quantity = v_qty_after,
    last_stock_update = NOW(),
    updated_at = NOW();

  -- 4. Record transaction log
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

  -- 5. Check and create stock alert if needed
  PERFORM check_and_create_stock_alert(v_shop_id, NEW.product_id);

  RETURN NEW;
END;
$$;
