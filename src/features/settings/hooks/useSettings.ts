import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Shop } from '@/types/database.types';
import toast from 'react-hot-toast';

export function useShopDetails() {
  const { assignedShops } = useAuth();
  const shopId = assignedShops?.[0]?.id;

  return useQuery({
    queryKey: ['shop-details', shopId],
    queryFn: async () => {
      if (!shopId) return null;

      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      return data as Shop;
    },
    enabled: !!shopId,
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();
  const { assignedShops } = useAuth();
  const shopId = assignedShops?.[0]?.id;

  return useMutation({
    mutationFn: async (updates: Partial<Shop>) => {
      if (!shopId) throw new Error('No shop assigned');

      const { data, error } = await supabase
        .from('shops')
        .update(updates)
        .eq('id', shopId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-details', shopId] });
      toast.success('Shop details updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update shop details');
    }
  });
}
