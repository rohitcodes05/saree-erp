import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Employee } from '@/types/database.types';

export function useEmployees() {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!companyId,
  });
}
