import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Expense } from '@/types/database.types';

export function useExpenses() {
  const { companyId, isCashier, activeShop } = useAuth();
  const activeShopId = activeShop?.id;
  
  return useQuery({
    queryKey: ['expenses', companyId, activeShopId],
    queryFn: async () => {
      if (!companyId) return [];
      // Cashiers can't select expenses due to RLS, so return empty early
      if (isCashier) return [];

      let query = supabase
        .from('expenses')
        .select(`
          *,
          recorded_by:profiles(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('expense_date', { ascending: false });

      if (activeShopId) {
        query = query.eq('shop_id', activeShopId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId && !isCashier,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  const { companyId, activeShop, user } = useAuth();

  return useMutation({
    mutationFn: async (expense: Partial<Expense>) => {
      const activeShopId = activeShop?.id;
      if (!companyId || (!activeShopId && !expense.shop_id)) throw new Error('Company ID or Shop ID missing');
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          company_id: companyId,
          shop_id: expense.shop_id || activeShopId,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
          recorded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
