-- ============================================================
-- SAREE ERP – RETURNS & EXCHANGES RPC
-- Migration: 007_returns_rpc.sql
-- ============================================================

-- A robust RPC to process a return transaction.
-- This handles:
-- 1. Inserting into returns & return_items
-- 2. Restocking inventory (if requested)
-- 3. Updating sale_items (returned quantity)
-- 4. Updating sales (status)
-- 5. Creating a refund payment record

CREATE OR REPLACE FUNCTION public.process_return(
  p_shop_id UUID,
  p_original_sale_id UUID,
  p_customer_id UUID,
  p_reason TEXT,
  p_refund_amount DECIMAL(15,2),
  p_refund_method payment_method,
  p_restocked BOOLEAN,
  p_notes TEXT,
  p_items JSONB -- Array of { sale_item_id, product_id, quantity, refund_amount }
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
  -- 1. Generate Return Number (RET-YYMMDD-XXXX)
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
    -- A. Insert into return_items
    INSERT INTO public.return_items (
      return_id, sale_item_id, product_id, quantity, refund_amount
    ) VALUES (
      v_return_id, 
      (v_item->>'sale_item_id')::UUID, 
      (v_item->>'product_id')::UUID, 
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'refund_amount')::DECIMAL(15,2)
    );

    -- B. Restock Inventory (if requested)
    IF p_restocked THEN
      -- Update inventory quantity
      UPDATE public.inventory
      SET quantity = quantity + (v_item->>'quantity')::INTEGER,
          updated_at = NOW()
      WHERE shop_id = p_shop_id AND product_id = (v_item->>'product_id')::UUID;

      -- Log inventory transaction
      INSERT INTO public.inventory_transactions (
        shop_id, product_id, type, quantity, reference_type, reference_id, notes, created_by
      ) VALUES (
        p_shop_id, (v_item->>'product_id')::UUID, 'return', (v_item->>'quantity')::INTEGER,
        'return', v_return_id, 'Restocked from return ' || v_return_number, auth.uid()
      );
    END IF;

    -- C. Update sale_items returned_quantity (if tracking at item level)
    -- We don't have a returned_quantity on sale_items in the schema, so we skip this
    -- but we can calculate it dynamically when querying.
  END LOOP;

  -- 4. Record refund payment (Negative amount or just tracked via refund_method)
  -- Payments table checks amount > 0, so we insert the absolute refund amount but status = 'refunded'
  IF p_refund_amount > 0 THEN
    INSERT INTO public.payments (
      sale_id, method, amount, status, notes
    ) VALUES (
      p_original_sale_id, p_refund_method, p_refund_amount, 'refunded', 'Refund for return ' || v_return_number
    );
  END IF;

  -- 5. Update Sale Status
  -- Check if all items in the sale are returned
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
