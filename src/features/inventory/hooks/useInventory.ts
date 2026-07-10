import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { InventoryStatusView, InventoryTransactionType } from '@/types/database.types';

export function useInventory(shopId?: string) {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ['inventory', companyId, shopId],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('v_inventory_status')
        .select('*')
        .eq('company_id', companyId);

      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query.order('product_name', { ascending: true });

      if (error) throw error;

      // Fetch images for these products to show in POS
      const productIds = data.map(d => d.product_id);
      if (productIds.length > 0) {
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, url')
          .in('product_id', productIds)
          .eq('is_primary', true);
          
        if (images) {
          const imageMap = Object.fromEntries(images.map(img => [img.product_id, img.url]));
          data.forEach(d => {
            (d as any).primary_image_url = imageMap[d.product_id] || null;
          });
        }
      }

      return data as (InventoryStatusView & { primary_image_url?: string | null })[];
    },
    enabled: !!companyId,
  });
}

export interface AdjustStockPayload {
  shopId: string;
  productId: string;
  type: InventoryTransactionType;
  quantity: number;
  notes?: string;
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  const { companyId } = useAuth();

  return useMutation({
    mutationFn: async ({ shopId, productId, type, quantity, notes }: AdjustStockPayload) => {
      // Call the RPC function to handle upserting inventory and logging transaction
      const { data, error } = await supabase.rpc('adjust_stock', {
        p_shop_id: shopId,
        p_product_id: productId,
        p_type: type,
        p_quantity: quantity,
        p_notes: notes || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both specific shop and global inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory', companyId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', companyId, variables.shopId] });
    },
  });
}
