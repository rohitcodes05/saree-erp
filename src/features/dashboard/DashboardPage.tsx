import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  IndianRupee, TrendingUp, TrendingDown, Users, Package,
  AlertTriangle, Clock, ShoppingCart, Store, ArrowUpRight,
  ArrowDownRight, RefreshCw, ReceiptText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardHeader, MetricCard, Skeleton, CardSkeleton, Badge, StatusBadge } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useDashboardMetrics, useRevenueTrend,
  useShopPerformance, useTopProducts, useRecentActivity, useGstSummary,
} from '@/hooks/useDashboard';
import { formatCurrency, formatCurrencyCompact } from '@/constants/gst';
import { formatTimeAgo } from '@/lib/utils';

// ─── Chart Colors ─────────────────────────────────────────────────────────────

const CHART_PRIMARY = '#6366f1';
const CHART_SUCCESS = '#22c55e';
const CHART_WARNING = '#f59e0b';
const CHART_DANGER  = '#ef4444';

const SHOP_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-3 shadow-surface-xl text-sm">
      <p className="font-medium text-text mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-text-muted">
          <span style={{ color: p.color }} className="font-medium">{p.name}:</span>{' '}
          <span className="text-text tabular">{
            p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('gst')
              ? formatCurrency(p.value)
              : p.value.toLocaleString('en-IN')
          }</span>
        </p>
      ))}
    </div>
  );
};

// ─── Stagger Animation Wrapper ────────────────────────────────────────────────

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children, delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Dashboard Page ───────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user, activeShop } = useAuth();
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);
  const [perfPeriod, setPerfPeriod] = useState<'week' | 'month'>('month');

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: trend, isLoading: trendLoading } = useRevenueTrend(trendDays);
  const { data: shopPerf, isLoading: perfLoading } = useShopPerformance(perfPeriod);
  const { data: topProducts, isLoading: productsLoading } = useTopProducts();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: gst, isLoading: gstLoading } = useGstSummary();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-container space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <FadeUp>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">
              {greeting()}, {user?.profile.first_name} 👋
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              {activeShop
                ? <><Store className="inline h-3.5 w-3.5 mr-1 text-primary" />{activeShop.name}</>
                : 'All Stores Overview'
              }
              {' · '}
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => refetchMetrics()}
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </FadeUp>

      {/* ── Metric Cards ─────────────────────────────────────────────────────── */}
      <FadeUp delay={0.05}>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {metricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                label="Today's Revenue"
                value={formatCurrencyCompact(metrics?.todayRevenue ?? 0)}
                change={metrics?.todayRevenueDelta}
                changeLabel="vs yesterday"
                icon={<IndianRupee className="h-5 w-5" />}
                iconColor="text-primary bg-primary/10"
              />
              <MetricCard
                label="This Month"
                value={formatCurrencyCompact(metrics?.monthRevenue ?? 0)}
                icon={<TrendingUp className="h-5 w-5" />}
                iconColor="text-success bg-success/10"
              />
              <MetricCard
                label="Customers"
                value={metrics?.totalCustomers?.toLocaleString('en-IN') ?? '0'}
                icon={<Users className="h-5 w-5" />}
                iconColor="text-warning bg-warning/10"
              />
              <MetricCard
                label="Low Stock Alerts"
                value={metrics?.lowStockCount ?? 0}
                icon={<AlertTriangle className="h-5 w-5" />}
                iconColor={
                  (metrics?.lowStockCount ?? 0) > 0
                    ? 'text-danger bg-danger/10'
                    : 'text-text-muted bg-surface-3'
                }
              />
            </>
          )}
        </div>
      </FadeUp>

      {/* ── Revenue Trend Chart ───────────────────────────────────────────────── */}
      <FadeUp delay={0.1}>
        <Card>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="font-semibold text-text">Revenue Trend</h3>
              <p className="text-xs text-text-muted mt-0.5">Daily sales over time</p>
            </div>
            <div className="flex gap-1">
              {([7, 30, 90] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    trendDays === d
                      ? 'bg-primary/15 text-primary-300'
                      : 'text-text-muted hover:text-text hover:bg-surface-2'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          {trendLoading ? (
            <Skeleton height={240} className="rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend ?? []} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gstGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_SUCCESS} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_SUCCESS} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  tickLine={false} axisLine={false}
                  interval={trendDays === 7 ? 0 : trendDays === 30 ? 4 : 14}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  tickLine={false} axisLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v).replace('₹', '₹')}
                  width={60}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="revenue" name="Revenue"
                  stroke={CHART_PRIMARY} strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
                <Area
                  type="monotone" dataKey="gst" name="GST"
                  stroke={CHART_SUCCESS} strokeWidth={1.5}
                  fill="url(#gstGradient)" strokeDasharray="4 2"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </FadeUp>

      {/* ── Middle Row: Shop Performance + GST Summary ───────────────────────── */}
      <FadeUp delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Shop Performance */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-text">Shop Performance</h3>
                  <p className="text-xs text-text-muted mt-0.5">Revenue comparison</p>
                </div>
                <div className="flex gap-1">
                  {(['week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPerfPeriod(p)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        perfPeriod === p
                          ? 'bg-primary/15 text-primary-300'
                          : 'text-text-muted hover:text-text hover:bg-surface-2'
                      }`}
                    >
                      {p === 'week' ? 'This Week' : 'This Month'}
                    </button>
                  ))}
                </div>
              </div>

              {perfLoading ? (
                <Skeleton height={200} className="rounded-xl" />
              ) : !shopPerf?.length ? (
                <div className="flex items-center justify-center h-48 text-sm text-text-muted">
                  No sales data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={shopPerf}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="shopName" tick={{ fontSize: 10, fill: '#71717a' }}
                      tickLine={false} axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#71717a' }}
                      tickLine={false} axisLine={false}
                      tickFormatter={v => formatCurrencyCompact(v)}
                      width={60}
                    />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="revenue" name="Revenue"
                      radius={[6, 6, 0, 0]}
                    >
                      {shopPerf.map((_, i) => (
                        <Cell
                          key={i}
                          fill={SHOP_COLORS[i % SHOP_COLORS.length]}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* GST Summary */}
          <div>
            <Card className="h-full">
              <h3 className="font-semibold text-text mb-4">GST Summary</h3>
              <p className="text-xs text-text-muted mb-4">This month</p>

              {gstLoading ? (
                <Skeleton lines={5} />
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Total Revenue', value: gst?.totalRevenue ?? 0, color: 'text-text' },
                    { label: 'Taxable Amount', value: gst?.totalTaxable ?? 0, color: 'text-text-muted' },
                    { label: 'CGST', value: gst?.totalCgst ?? 0, color: 'text-primary-300' },
                    { label: 'SGST', value: gst?.totalSgst ?? 0, color: 'text-primary-300' },
                    { label: 'Total GST', value: gst?.totalGst ?? 0, color: 'text-success' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <p className="text-sm text-text-muted">{item.label}</p>
                      <p className={`text-sm font-semibold tabular ${item.color}`}>
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted">Effective Tax Rate</p>
                      <p className="text-xs font-medium text-text-muted">
                        {gst?.totalRevenue
                          ? ((gst.totalGst / gst.totalRevenue) * 100).toFixed(1) + '%'
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </FadeUp>

      {/* ── Bottom Row: Top Products + Activity Feed ─────────────────────────── */}
      <FadeUp delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <Card>
            <CardHeader
              title="Top Products"
              subtitle="By revenue this month"
              icon={<Package className="h-4 w-4" />}
            />

            {productsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton width={24} height={14} />
                    <Skeleton className="flex-1" height={14} />
                    <Skeleton width={80} height={14} />
                  </div>
                ))}
              </div>
            ) : !topProducts?.length ? (
              <div className="flex items-center justify-center h-40 text-sm text-text-muted">
                No sales data this month.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((product, i) => {
                  const maxRevenue = topProducts[0]?.revenue ?? 1;
                  const pct = (product.revenue / maxRevenue) * 100;
                  return (
                    <div key={product.productId} className="group">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-text-muted w-5 text-right flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text truncate font-medium">
                            {product.productName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-text tabular">
                            {formatCurrencyCompact(product.revenue)}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {product.qtySold} pcs
                          </p>
                        </div>
                      </div>
                      <div className="ml-8 h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader
              title="Recent Activity"
              subtitle="Live sales feed"
              icon={<Clock className="h-4 w-4" />}
            />

            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton width={32} height={32} rounded className="flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton height={12} className="w-3/4" />
                      <Skeleton height={10} className="w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !activity?.length ? (
              <div className="flex items-center justify-center h-40 text-sm text-text-muted">
                No recent activity.
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto no-scrollbar">
                {activity.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${
                      item.type === 'sale' ? 'bg-primary/15 text-primary' :
                      item.type === 'customer' ? 'bg-success/15 text-success' :
                      'bg-warning/15 text-warning'
                    }`}>
                      {item.type === 'sale' ? <ReceiptText className="h-4 w-4" /> :
                       item.type === 'customer' ? <Users className="h-4 w-4" /> :
                       <Package className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-text font-medium truncate">{item.title}</p>
                        {item.amount !== undefined && (
                          <p className="text-sm font-semibold text-text tabular flex-shrink-0">
                            {formatCurrencyCompact(item.amount)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.subtitle}
                        {item.shopName && ` · ${item.shopName}`}
                        {' · '}
                        {formatTimeAgo(item.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </FadeUp>

      {/* ── Pending Payments Alert ────────────────────────────────────────────── */}
      {!metricsLoading && (metrics?.pendingPayments ?? 0) > 0 && (
        <FadeUp delay={0.25}>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text">
                {metrics?.pendingPayments} pending payment{metrics?.pendingPayments !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Total outstanding: {formatCurrency(metrics?.pendingAmount ?? 0)}
              </p>
            </div>
            <a
              href="/reports/sales"
              className="text-xs font-medium text-warning hover:text-warning/80 transition-colors"
            >
              View All →
            </a>
          </div>
        </FadeUp>
      )}
    </div>
  );
};

export default DashboardPage;
