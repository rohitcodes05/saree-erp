import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, rpc } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database } from '@/types/database.types';

type ReturnRecord = Database['public']['Tables']['returns']['Row'];
type ReturnItem = Database['public']['Tables']['return_items']['Row'];

export interface ReturnWithDetails extends ReturnRecord {
  customer?: { first_name: string; last_name: string | null } | null;
  processed_by_user?: { first_name: string; last_name: string | null } | null;
  sale?: { invoice_number: string } | null;
}

export function useReturns() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id;
  
  return useQuery({
    queryKey: ['returns', shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          customer:customers(first_name, last_name),
          processed_by_user:profiles!processed_by(first_name, last_name),
          sale:sales!original_sale_id(invoice_number)
        `)
        .eq('shop_id', shopId)
        .order('return_date', { ascending: false });

      if (error) throw error;
      return data as ReturnWithDetails[];
    },
    enabled: !!shopId,
  });
}

export interface ReturnPayload {
  original_sale_id: string;
  customer_id: string | null;
  reason: string;
  refund_amount: number;
  refund_method: string;
  restocked: boolean;
  notes: string;
  items: {
    sale_item_id: string;
    product_id: string;
    quantity: number;
    refund_amount: number;
    unit_price: number;
  }[];
}

export function useProcessReturn() {
  const queryClient = useQueryClient();
  const { activeShop } = useAuth();

  return useMutation({
    mutationFn: async (payload: ReturnPayload) => {
      const shopId = activeShop?.id;
      if (!shopId) throw new Error('No active shop selected');
      
      const { data, error } = await rpc('process_return', {
        p_shop_id: shopId,
        p_original_sale_id: payload.original_sale_id,
        p_customer_id: payload.customer_id,
        p_reason: payload.reason,
        p_refund_amount: payload.refund_amount,
        p_refund_method: payload.refund_method,
        p_restocked: payload.restocked,
        p_notes: payload.notes,
        p_items: payload.items
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
}

export function useSaleByInvoice(invoiceNumber: string) {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: ['sale_by_invoice', shopId, invoiceNumber],
    queryFn: async () => {
      if (!shopId || !invoiceNumber) return null;

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, first_name, last_name, phone),
          items:sale_items(
            id, product_id, quantity, unit_price, total_amount, discount_amount, gst_amount,
            product:products(name, sku, barcode)
          )
        `)
        .eq('shop_id', shopId)
        .ilike('invoice_number', `%${invoiceNumber}%`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    },
    enabled: !!shopId && !!invoiceNumber && invoiceNumber.length > 3,
  });
}
