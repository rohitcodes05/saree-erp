import { useQuery } from '@tanstack/react-query';
import {
  getDashboardMetrics,
  getRevenueTrend,
  getShopPerformance,
  getTopProducts,
  getRecentActivity,
  getGstSummary,
} from '@/services/dashboard.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const dashboardKeys = {
  metrics:     (companyId: string, shopId?: string) => ['dashboard', 'metrics', companyId, shopId] as const,
  trend:       (companyId: string, days: number, shopId?: string) => ['dashboard', 'trend', companyId, days, shopId] as const,
  performance: (companyId: string, period: string) => ['dashboard', 'performance', companyId, period] as const,
  topProducts: (companyId: string, shopId?: string) => ['dashboard', 'topProducts', companyId, shopId] as const,
  activity:    (companyId: string) => ['dashboard', 'activity', companyId] as const,
  gst:         (companyId: string, shopId?: string) => ['dashboard', 'gst', companyId, shopId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboardMetrics() {
  const { companyId, activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: dashboardKeys.metrics(companyId ?? '', shopId),
    queryFn:  () => getDashboardMetrics(companyId!, shopId),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    select: (result) => result.data,
  });
}

export function useRevenueTrend(days = 30) {
  const { companyId, activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: dashboardKeys.trend(companyId ?? '', days, shopId),
    queryFn:  () => getRevenueTrend(companyId!, days, shopId),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 5,
    select: (result) => result.data,
  });
}

export function useShopPerformance(period: 'week' | 'month' = 'month') {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.performance(companyId ?? '', period),
    queryFn:  () => getShopPerformance(companyId!, period),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 5,
    select: (result) => result.data,
  });
}

export function useTopProducts() {
  const { companyId, activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: dashboardKeys.topProducts(companyId ?? '', shopId),
    queryFn:  () => getTopProducts(companyId!, 8, shopId),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 10,
    select: (result) => result.data,
  });
}

export function useRecentActivity() {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.activity(companyId ?? ''),
    queryFn:  () => getRecentActivity(companyId!, 15),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 3,
    select: (result) => result.data,
  });
}

export function useGstSummary() {
  const { companyId, activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: dashboardKeys.gst(companyId ?? '', shopId),
    queryFn:  () => getGstSummary(companyId!, shopId),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 10,
    select: (result) => result.data,
  });
}
