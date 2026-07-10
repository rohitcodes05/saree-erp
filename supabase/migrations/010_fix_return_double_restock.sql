-- ============================================================
-- SAREE ERP – FIX DOUBLE RESTOCK ON RETURNS
-- Migration: 010_fix_return_double_restock.sql
-- ============================================================

-- The previous RPC manually restocked inventory, but the database
-- already has an active trigger (trg_return_item_inventory) that 
-- automatically restocks inventory when a return_item is inserted.
-- This caused inventory to be added twice (double restock).
-- We remove the manual restock logic from this RPC.

CREATE OR REPLACE FUNCTION public.process_return(
  p_shop_id UUID,
  p_original_sale_id UUID,
  p_customer_id UUID,
  p_reason TEXT,
  p_refund_amount DECIMAL(15,2),
  p_refund_method payment_method,
  p_restocked BOOLEAN,
  p_notes TEXT,
  p_items JSONB -- Array of { sale_item_id, product_id, quantity, refund_amount, unit_price }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_return_id UUID;
  v_return_number VARCHAR(50);
  v_item JSONB;
  v_sale_status sale_status;
  v_total_sale_items INTEGER;
  v_total_returned_items INTEGER;
BEGIN
  -- 1. Generate Return Number
  v_return_number := 'RET-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

  -- 2. Insert into returns table
  INSERT INTO public.returns (
    shop_id, original_sale_id, return_number, customer_id, reason, 
    refund_amount, refund_method, restocked, status, processed_by, notes
  ) VALUES (
    p_shop_id, p_original_sale_id, v_return_number, p_customer_id, p_reason,
    p_refund_amount, p_refund_method, p_restocked, 'completed', auth.uid(), p_notes
  ) RETURNING id INTO v_return_id;

  -- 3. Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert into return_items
    -- Note: The trigger 'trg_return_item_inventory' will automatically 
    -- detect if p_restocked is true and update the inventory for us.
    INSERT INTO public.return_items (
      return_id, sale_item_id, product_id, quantity, refund_amount, unit_price
    ) VALUES (
      v_return_id, 
      (v_item->>'sale_item_id')::UUID, 
      (v_item->>'product_id')::UUID, 
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'refund_amount')::DECIMAL(15,2),
      (v_item->>'unit_price')::DECIMAL(15,2)
    );
  END LOOP;

  -- 4. Record refund payment
  IF p_refund_amount > 0 THEN
    INSERT INTO public.payments (
      sale_id, method, amount, status, notes
    ) VALUES (
      p_original_sale_id, p_refund_method, p_refund_amount, 'refunded', 'Refund for return ' || v_return_number
    );
  END IF;

  -- 5. Update Sale Status
  SELECT SUM(quantity) INTO v_total_sale_items 
  FROM public.sale_items WHERE sale_id = p_original_sale_id;

  SELECT COALESCE(SUM(ri.quantity), 0) INTO v_total_returned_items
  FROM public.return_items ri
  JOIN public.returns r ON ri.return_id = r.id
  WHERE r.original_sale_id = p_original_sale_id AND r.status = 'completed';

  IF v_total_returned_items >= v_total_sale_items THEN
    v_sale_status := 'returned';
  ELSIF v_total_returned_items > 0 THEN
    v_sale_status := 'partially_returned';
  ELSE
    v_sale_status := 'completed';
  END IF;

  UPDATE public.sales
  SET status = v_sale_status,
      updated_at = NOW()
  WHERE id = p_original_sale_id;

  RETURN v_return_id;
END;
$$;
