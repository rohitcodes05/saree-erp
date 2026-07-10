import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Brand } from '@/types/database.types';

export function useBrands() {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ['brands', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Brand[];
    },
    enabled: !!companyId,
  });
}
