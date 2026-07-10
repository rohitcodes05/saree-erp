import { supabase } from '@/lib/supabase';
// import { formatDate } from '@/lib/utils';
import { subDays, startOfDay, startOfMonth, startOfWeek, endOfDay, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  todayRevenue: number;
  todayRevenueDelta: number;  // % change vs yesterday
  weekRevenue: number;
  monthRevenue: number;
  totalSales: number;
  totalCustomers: number;
  lowStockCount: number;
  pendingPayments: number;
  pendingAmount: number;
  totalInventoryValue: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  sales: number;
  gst: number;
}

export interface ShopPerformance {
  shopId: string;
  shopName: string;
  revenue: number;
  sales: number;
  avgOrderValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  qtySold: number;
  revenue: number;
  categoryName?: string;
}

export interface RecentActivity {
  id: string;
  type: 'sale' | 'return' | 'stock_in' | 'customer';
  title: string;
  subtitle: string;
  amount?: number;
  time: string;
  shopName?: string;
}

export interface GstSummary {
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalGst: number;
  totalRevenue: number;
  byRate: Record<string, { taxable: number; gst: number; count: number }>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString();
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export async function getDashboardMetrics(
  companyId: string,
  shopId?: string
): Promise<{ data: DashboardMetrics | null; error: string | null }> {
  const now = new Date();
  const todayStart = isoDate(startOfDay(now));
  const todayEnd = isoDate(endOfDay(now));
  const yesterdayStart = isoDate(startOfDay(subDays(now, 1)));
  const yesterdayEnd = isoDate(endOfDay(subDays(now, 1)));
  const weekStart = isoDate(startOfWeek(now, { weekStartsOn: 1 }));
  const monthStart = isoDate(startOfMonth(now));

  // Removed shopFilter since we build queries dynamically

  // Today sales
  let todayQ = supabase.from('sales').select('total_amount, gst_amount')
    .eq('status', 'completed')
    .gte('sale_date', todayStart).lte('sale_date', todayEnd);
  if (shopId) todayQ = todayQ.eq('shop_id', shopId);

  // Yesterday sales
  let yesterdayQ = supabase.from('sales').select('total_amount')
    .eq('status', 'completed')
    .gte('sale_date', yesterdayStart).lte('sale_date', yesterdayEnd);
  if (shopId) yesterdayQ = yesterdayQ.eq('shop_id', shopId);

  // Week sales
  let weekQ = supabase.from('sales').select('total_amount')
    .eq('status', 'completed')
    .gte('sale_date', weekStart);
  if (shopId) weekQ = weekQ.eq('shop_id', shopId);

  // Month sales
  let monthQ = supabase.from('sales').select('total_amount')
    .eq('status', 'completed')
    .gte('sale_date', monthStart);
  if (shopId) monthQ = monthQ.eq('shop_id', shopId);

  // Total customers
  const customersQ = supabase.from('customers').select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);

  // Low stock count
  let lowStockQ = supabase.from('stock_alerts').select('id', { count: 'exact', head: true })
    .eq('is_resolved', false);
  if (shopId) lowStockQ = lowStockQ.eq('shop_id', shopId);

  // Pending payments
  let pendingQ = supabase.from('sales').select('amount_due')
    .eq('payment_status', 'pending');
  if (shopId) pendingQ = pendingQ.eq('shop_id', shopId);

  const [todayRes, yesterdayRes, weekRes, monthRes, customersRes, lowStockRes, pendingRes] =
    await Promise.all([
      todayQ, yesterdayQ, weekQ, monthQ, customersQ, lowStockQ, pendingQ
    ]);

  const todaySales = todayRes.data ?? [];
  const yesterdaySales = yesterdayRes.data ?? [];
  const weekSales = weekRes.data ?? [];
  const monthSales = monthRes.data ?? [];
  const pendingSales = pendingRes.data ?? [];

  const todayRevenue = todaySales.reduce((s, r) => s + (r.total_amount || 0), 0);
  const yesterdayRevenue = yesterdaySales.reduce((s, r) => s + (r.total_amount || 0), 0);
  const weekRevenue = weekSales.reduce((s, r) => s + (r.total_amount || 0), 0);
  const monthRevenue = monthSales.reduce((s, r) => s + (r.total_amount || 0), 0);
  const pendingAmount = pendingSales.reduce((s, r) => s + (r.amount_due || 0), 0);

  const delta =
    yesterdayRevenue === 0
      ? todayRevenue > 0 ? 100 : 0
      : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

  return {
    data: {
      todayRevenue,
      todayRevenueDelta: parseFloat(delta.toFixed(1)),
      weekRevenue,
      monthRevenue,
      totalSales: todaySales.length,
      totalCustomers: customersRes.count ?? 0,
      lowStockCount: lowStockRes.count ?? 0,
      pendingPayments: pendingSales.length,
      pendingAmount,
      totalInventoryValue: 0, // computed separately due to cost
    },
    error: null,
  };
}

// ─── Revenue Chart Data ───────────────────────────────────────────────────────

export async function getRevenueTrend(
  _companyId: string,
  days = 30,
  shopId?: string
): Promise<{ data: RevenueDataPoint[]; error: string | null }> {
  const from = isoDate(subDays(startOfDay(new Date()), days - 1));

  let q = supabase
    .from('sales')
    .select('sale_date, total_amount, gst_amount')
    .eq('status', 'completed')
    .gte('sale_date', from);
  if (shopId) q = q.eq('shop_id', shopId);
  q = q.order('sale_date');

  const { data, error } = await q;

  if (error) return { data: [], error: error.message };

  // Group by date
  const grouped = new Map<string, RevenueDataPoint>();

  // Pre-fill all days
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'dd MMM');
    grouped.set(d, { date: d, revenue: 0, sales: 0, gst: 0 });
  }

  for (const sale of data ?? []) {
    const d = format(new Date(sale.sale_date), 'dd MMM');
    const existing = grouped.get(d);
    if (existing) {
      existing.revenue += sale.total_amount || 0;
      existing.gst += sale.gst_amount || 0;
      existing.sales += 1;
    }
  }

  return { data: Array.from(grouped.values()), error: null };
}

// ─── Shop Performance ─────────────────────────────────────────────────────────

export async function getShopPerformance(
  companyId: string,
  period: 'week' | 'month' = 'month'
): Promise<{ data: ShopPerformance[]; error: string | null }> {
  const from = isoDate(
    period === 'week' ? startOfWeek(new Date(), { weekStartsOn: 1 }) : startOfMonth(new Date())
  );

  const { data: shops, error: shopError } = await supabase
    .from('shops')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (shopError) return { data: [], error: shopError.message };

  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('shop_id, total_amount')
    .eq('status', 'completed')
    .gte('sale_date', from);

  if (salesError) return { data: [], error: salesError.message };

  const shopMap = new Map<string, ShopPerformance>(
    (shops ?? []).map(s => [
      s.id,
      { shopId: s.id, shopName: s.name, revenue: 0, sales: 0, avgOrderValue: 0 },
    ])
  );

  for (const sale of salesData ?? []) {
    const sp = shopMap.get(sale.shop_id);
    if (sp) {
      sp.revenue += sale.total_amount || 0;
      sp.sales += 1;
    }
  }

  return {
    data: Array.from(shopMap.values())
      .map(s => ({ ...s, avgOrderValue: s.sales > 0 ? s.revenue / s.sales : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    error: null,
  };
}

// ─── Top Products ─────────────────────────────────────────────────────────────

export async function getTopProducts(
  _companyId: string,
  limit = 10,
  shopId?: string
): Promise<{ data: TopProduct[]; error: string | null }> {
  const from = isoDate(startOfMonth(new Date()));

  let q = supabase
    .from('sale_items')
    .select(`
      product_id, product_name, product_sku,
      quantity, total_amount,
      sale:sales!inner(shop_id, status, sale_date)
    `)
    .eq('sale.status', 'completed')
    .gte('sale.sale_date', from);
  if (shopId) q = q.eq('sale.shop_id', shopId);

  const { data, error } = await q;

  if (error) return { data: [], error: error.message };

  const productMap = new Map<string, TopProduct>();

  for (const item of data ?? []) {
    const existing = productMap.get(item.product_id);
    if (existing) {
      existing.qtySold += item.quantity || 0;
      existing.revenue += item.total_amount || 0;
    } else {
      productMap.set(item.product_id, {
        productId: item.product_id,
        productName: item.product_name,
        sku: item.product_sku ?? '',
        qtySold: item.quantity || 0,
        revenue: item.total_amount || 0,
      });
    }
  }

  return {
    data: Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit),
    error: null,
  };
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

export async function getRecentActivity(
  companyId: string,
  limit = 20
): Promise<{ data: RecentActivity[]; error: string | null }> {
  const [salesRes, customersRes] = await Promise.all([
    supabase
      .from('sales')
      .select('id, invoice_number, total_amount, sale_date, status, shop:shops(name), customer:customers(first_name, last_name)')
      .order('sale_date', { ascending: false })
      .limit(limit),
    supabase
      .from('customers')
      .select('id, first_name, last_name, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const activity: RecentActivity[] = [];

  for (const sale of salesRes.data ?? []) {
    const shop = sale.shop as { name: string } | null;
    const customer = sale.customer as { first_name: string; last_name: string | null } | null;
    activity.push({
      id: sale.id,
      type: 'sale',
      title: `Invoice #${sale.invoice_number}`,
      subtitle: customer
        ? `${customer.first_name} ${customer.last_name ?? ''}`.trim()
        : 'Walk-in Customer',
      amount: sale.total_amount,
      time: sale.sale_date,
      shopName: shop?.name,
    });
  }

  for (const c of customersRes.data ?? []) {
    activity.push({
      id: c.id,
      type: 'customer',
      title: `New customer: ${c.first_name} ${c.last_name ?? ''}`.trim(),
      subtitle: 'Customer registered',
      time: c.created_at,
    });
  }

  return {
    data: activity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit),
    error: null,
  };
}

// ─── GST Summary (this month) ─────────────────────────────────────────────────

export async function getGstSummary(
  _companyId: string,
  shopId?: string
): Promise<{ data: GstSummary | null; error: string | null }> {
  const from = isoDate(startOfMonth(new Date()));

  let q = supabase
    .from('sales')
    .select('total_amount, taxable_amount, gst_amount, cgst_amount, sgst_amount')
    .eq('status', 'completed')
    .gte('sale_date', from);
  if (shopId) q = q.eq('shop_id', shopId);

  const { data, error } = await q;

  if (error) return { data: null, error: error.message };

  const sales = data ?? [];
  const summary: GstSummary = {
    totalTaxable: 0, totalCgst: 0, totalSgst: 0,
    totalGst: 0, totalRevenue: 0, byRate: {},
  };

  for (const s of sales) {
    summary.totalTaxable += s.taxable_amount || 0;
    summary.totalCgst += s.cgst_amount || 0;
    summary.totalSgst += s.sgst_amount || 0;
    summary.totalGst += s.gst_amount || 0;
    summary.totalRevenue += s.total_amount || 0;
  }

  return { data: summary, error: null };
}
