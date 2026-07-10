import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getShops, getShop, createShop, updateShop,
  toggleShopStatus, getShopSettings, updateShopSettings,
  getEligibleManagers, getShopRevenueSummary,
  type CreateShopInput, type UpdateShopInput,
} from '@/services/shops.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const shopKeys = {
  all:      (companyId: string)             => ['shops', companyId] as const,
  detail:   (shopId: string)                => ['shops', 'detail', shopId] as const,
  settings: (shopId: string)                => ['shops', 'settings', shopId] as const,
  managers: (companyId: string)             => ['shops', 'managers', companyId] as const,
  revenue:  (shopId: string, p: string)     => ['shops', 'revenue', shopId, p] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch all shops for the current company */
export function useShops() {
  const { companyId } = useAuth();
  return useQuery({
    queryKey: shopKeys.all(companyId ?? ''),
    queryFn:  () => getShops(companyId!),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 5,
    select: (result) => result.data,
  });
}

/** Fetch a single shop with its settings */
export function useShop(shopId: string | undefined) {
  return useQuery({
    queryKey: shopKeys.detail(shopId ?? ''),
    queryFn:  () => getShop(shopId!),
    enabled:  !!shopId,
    select: (result) => result.data,
  });
}

/** Fetch shop settings */
export function useShopSettings(shopId: string | undefined) {
  return useQuery({
    queryKey: shopKeys.settings(shopId ?? ''),
    queryFn:  () => getShopSettings(shopId!),
    enabled:  !!shopId,
    select: (result) => result.data,
  });
}

/** Fetch eligible managers for shop assignment */
export function useEligibleManagers() {
  const { companyId } = useAuth();
  return useQuery({
    queryKey: shopKeys.managers(companyId ?? ''),
    queryFn:  () => getEligibleManagers(companyId!),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 10,
    select: (result) => result.data,
  });
}

/** Fetch revenue summary for a shop */
export function useShopRevenue(
  shopId: string | undefined,
  period: 'today' | 'week' | 'month' = 'today'
) {
  return useQuery({
    queryKey: shopKeys.revenue(shopId ?? '', period),
    queryFn:  () => getShopRevenueSummary(shopId!, period),
    enabled:  !!shopId,
    refetchInterval: 1000 * 60 * 5, // auto-refresh every 5 min
    select: (result) => result.data,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateShop() {
  const qc = useQueryClient();
  const { companyId } = useAuth();

  return useMutation({
    mutationFn: (input: Omit<CreateShopInput, 'company_id'>) =>
      createShop({ ...input, company_id: companyId! }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      qc.invalidateQueries({ queryKey: shopKeys.all(companyId ?? '') });
      toast.success('Shop created successfully!');
    },
    onError: () => toast.error('Failed to create shop.'),
  });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  const { companyId } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateShopInput) => updateShop(input),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      qc.invalidateQueries({ queryKey: shopKeys.all(companyId ?? '') });
      qc.invalidateQueries({ queryKey: shopKeys.detail(variables.id) });
      toast.success('Shop updated successfully!');
    },
    onError: () => toast.error('Failed to update shop.'),
  });
}

export function useToggleShopStatus() {
  const qc = useQueryClient();
  const { companyId } = useAuth();

  return useMutation({
    mutationFn: ({ shopId, isActive }: { shopId: string; isActive: boolean }) =>
      toggleShopStatus(shopId, isActive),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      qc.invalidateQueries({ queryKey: shopKeys.all(companyId ?? '') });
      qc.invalidateQueries({ queryKey: shopKeys.detail(variables.shopId) });
      toast.success(
        variables.isActive ? 'Shop activated.' : 'Shop deactivated.'
      );
    },
  });
}

export function useUpdateShopSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ shopId, updates }: {
      shopId: string;
      updates: Parameters<typeof updateShopSettings>[1];
    }) => updateShopSettings(shopId, updates),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      qc.invalidateQueries({ queryKey: shopKeys.settings(variables.shopId) });
      toast.success('Settings saved!');
    },
    onError: () => toast.error('Failed to save settings.'),
  });
}
