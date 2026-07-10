import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Supplier } from '@/types/database.types';

export function useSuppliers() {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!companyId,
  });
}
