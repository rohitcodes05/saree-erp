import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, IndianRupee, ShoppingCart, Package, AlertTriangle, 
  ArrowUpRight, Tag, Receipt
} from 'lucide-react';
import { Card, MetricCard, Spinner, Badge, Button } from '@/components/ui';
import { useSalesReports, useInventoryReports } from './hooks';

export const ReportsPage: React.FC = () => {
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'week' | 'month'>('month');

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (dateRangeFilter === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (dateRangeFilter === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (dateRangeFilter === 'month') {
      start.setMonth(start.getMonth() - 1);
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, [dateRangeFilter]);

  const { data: salesData, isLoading: isSalesLoading } = useSalesReports(dateRange);
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventoryReports();

  if (isSalesLoading || isInventoryLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  // Find max amount for chart scaling
  const maxSales = salesData?.chartData?.reduce((max, item) => Math.max(max, item.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Reports & Analytics</h1>
          <p className="text-text-muted mt-1">Overview of your business performance</p>
        </div>
        <div className="flex bg-surface-2 p-1 rounded-lg">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRangeFilter === 'today' ? 'bg-primary text-white shadow-sm' : 'text-text hover:bg-surface-3'}`}
            onClick={() => setDateRangeFilter('today')}
          >
            Today
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRangeFilter === 'week' ? 'bg-primary text-white shadow-sm' : 'text-text hover:bg-surface-3'}`}
            onClick={() => setDateRangeFilter('week')}
          >
            This Week
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRangeFilter === 'month' ? 'bg-primary text-white shadow-sm' : 'text-text hover:bg-surface-3'}`}
            onClick={() => setDateRangeFilter('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={`₹${(salesData?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={<IndianRupee className="h-5 w-5 text-primary" />}
          change={12.5}
          changeLabel="vs last period"
          className="bg-primary/5 border-primary/20"
        />
        <MetricCard
          label="Sales Count"
          value={(salesData?.salesCount || 0).toString()}
          icon={<ShoppingCart className="h-5 w-5 text-secondary" />}
          change={5.2}
          changeLabel="vs last period"
        />
        <MetricCard
          label="Tax Collected (GST)"
          value={`₹${(salesData?.totalTax || 0).toLocaleString('en-IN')}`}
          icon={<Receipt className="h-5 w-5 text-warning" />}
        />
        <MetricCard
          label="Total Inventory Value"
          value={`₹${(inventoryData?.totalValue || 0).toLocaleString('en-IN')}`}
          icon={<Package className="h-5 w-5 text-success" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart (Custom CSS Bar Chart) */}
        <Card className="col-span-1 lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Trend
            </h2>
          </div>
          
          <div className="flex-1 min-h-[300px] flex items-end gap-2 pt-10">
            {salesData?.chartData?.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                No sales data for this period
              </div>
            ) : (
              salesData?.chartData?.map((item, index) => {
                const heightPercentage = maxSales > 0 ? (item.amount / maxSales) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-surface-3 text-text px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition-opacity shadow-surface-lg z-10">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                    {/* Bar */}
                    <div className="w-full max-w-[40px] bg-primary/20 group-hover:bg-primary/40 rounded-t-sm transition-colors relative flex justify-end flex-col" style={{ height: '250px' }}>
                       <div 
                         className="w-full bg-primary rounded-t-sm transition-all duration-500 ease-out" 
                         style={{ height: `${heightPercentage}%` }} 
                       />
                    </div>
                    {/* Label */}
                    <div className="mt-2 text-[10px] text-text-muted font-medium truncate w-full text-center" title={item.date}>
                      {item.date.split('/')[0]}/{item.date.split('/')[1]}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Side Widgets */}
        <div className="space-y-6">
          
          {/* Top Products */}
          <Card className="p-5">
            <h2 className="text-base font-bold text-text flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-secondary" />
              Top Selling Products
            </h2>
            <div className="space-y-4">
              {salesData?.topProducts?.length === 0 ? (
                <div className="text-sm text-text-muted text-center py-4">No products sold yet</div>
              ) : (
                salesData?.topProducts?.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-text-muted">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text truncate max-w-[150px]">{product.name}</div>
                        <div className="text-xs text-text-muted">{product.quantity} units sold</div>
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-primary">
                      ₹{product.revenue.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="p-5 border-l-4 border-l-danger">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-danger" />
                Low Stock Alerts
              </h2>
              <Badge variant="danger" className="rounded-full px-2 py-0.5">{inventoryData?.lowStockCount || 0}</Badge>
            </div>
            
            <div className="space-y-3">
              {inventoryData?.lowStockItems?.length === 0 ? (
                <div className="text-sm text-text-muted text-center py-4">All products are well stocked!</div>
              ) : (
                inventoryData?.lowStockItems?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-md bg-danger/5 border border-danger/10">
                    <div className="truncate pr-2">
                      <div className="text-sm font-medium text-text truncate">{item.product_name}</div>
                      <div className="text-xs text-text-muted">{item.shop_name}</div>
                    </div>
                    <div className="flex-shrink-0 text-center min-w-[40px]">
                      <div className="text-lg font-bold text-danger leading-none">{item.quantity}</div>
                      <div className="text-[10px] text-text-muted font-medium">Left</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {Number(inventoryData?.lowStockCount) > 10 && (
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">View all {inventoryData?.lowStockCount} items <ArrowUpRight className="h-3 w-3 ml-1" /></Button>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
