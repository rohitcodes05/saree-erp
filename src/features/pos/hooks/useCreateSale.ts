import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CartItem } from './useCart';
import type { PaymentMethod } from '@/types/database.types';

export interface CheckoutPayload {
  shopId: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      // 1. Generate Invoice Number via RPC
      const { data: invoiceNum, error: invoiceErr } = await supabase.rpc('generate_invoice_number', {
        p_shop_id: payload.shopId,
      });

      if (invoiceErr) throw new Error('Failed to generate invoice number: ' + invoiceErr.message);

      // 2. Create Sale Record
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert([{
          shop_id: payload.shopId,
          invoice_number: invoiceNum,
          customer_id: payload.customerId || null,
          subtotal: payload.subtotal,
          discount_amount: payload.discountAmount,
          discount_percent: 0,
          taxable_amount: payload.subtotal - payload.discountAmount,
          gst_amount: payload.taxAmount,
          cgst_amount: payload.taxAmount / 2, // Assuming split evenly for demo
          sgst_amount: payload.taxAmount / 2,
          igst_amount: 0,
          total_amount: payload.totalAmount,
          amount_paid: payload.amountPaid,
          amount_due: Math.max(0, payload.totalAmount - payload.amountPaid),
          change_amount: Math.max(0, payload.amountPaid - payload.totalAmount),
          status: 'completed',
          payment_status: payload.amountPaid >= payload.totalAmount ? 'completed' : 'pending',
        }])
        .select()
        .single();

      if (saleErr) throw new Error('Failed to create sale: ' + saleErr.message);

      // 3. Create Sale Items
      const saleItems = payload.items.map(item => {
        const lineTotal = item.quantity * item.unitPrice;
        const discountAmt = lineTotal * (item.discountPercent / 100);
        const taxable = lineTotal - discountAmt;
        const gstRate = parseFloat(item.product.gst_rate || '0');
        const gstAmt = taxable * (gstRate / 100);

        return {
          sale_id: sale.id,
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          product_barcode: item.product.barcode,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          purchase_price: item.product.purchase_price,
          discount_percent: item.discountPercent,
          discount_amount: discountAmt,
          gst_rate: item.product.gst_rate,
          gst_amount: gstAmt,
          total_amount: taxable + gstAmt,
        };
      });

      const { error: itemsErr } = await supabase.from('sale_items').insert(saleItems);
      if (itemsErr) throw new Error('Failed to create sale items: ' + itemsErr.message);

      // 4. Record Payment
      const { error: paymentErr } = await supabase.from('payments').insert([{
        sale_id: sale.id,
        method: payload.paymentMethod,
        amount: payload.amountPaid,
        status: 'completed'
      }]);
      if (paymentErr) throw new Error('Failed to record payment: ' + paymentErr.message);

      return sale;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries (inventory might have been deducted by DB triggers)
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['shops', 'revenue', variables.shopId] });
    }
  });
}
