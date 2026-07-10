import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useSalesHistory() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: ['sales_history', shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(first_name, last_name, phone),
          created_by_user:profiles!created_by(first_name, last_name),
          items:sale_items(
            id, quantity, unit_price, total_amount, discount_amount, gst_amount,
            product:products(name, sku)
          )
        `)
        .eq('shop_id', shopId)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}
