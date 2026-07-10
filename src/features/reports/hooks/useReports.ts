import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useSalesReports(dateRange: { start: string, end: string }) {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: ['reports-sales', shopId, dateRange],
    queryFn: async () => {
      if (!shopId) return null;

      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id, total_amount, subtotal, discount_amount, gst_amount, payment_status, sale_date,
          sale_items ( quantity, unit_price, total_amount, product_id, products ( name, sku ) )
        `)
        .eq('shop_id', shopId)
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end)
        .neq('status', 'cancelled'); // Don't include cancelled sales in revenue

      if (error) throw error;

      // Calculate totals
      let totalRevenue = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      let totalItemsSold = 0;
      const salesByDate: Record<string, number> = {};
      const topProducts: Record<string, { name: string; quantity: number; revenue: number }> = {};

      sales?.forEach(sale => {
        totalRevenue += Number(sale.total_amount);
        totalTax += Number(sale.gst_amount);
        totalDiscount += Number(sale.discount_amount);
        
        const dateStr = new Date(sale.sale_date).toLocaleDateString();
        salesByDate[dateStr] = (salesByDate[dateStr] || 0) + Number(sale.total_amount);

        sale.sale_items?.forEach((item: any) => {
          totalItemsSold += Number(item.quantity);
          const pId = item.product_id;
          const pName = item.products?.name || 'Unknown';
          if (!topProducts[pId]) {
            topProducts[pId] = { name: pName, quantity: 0, revenue: 0 };
          }
          topProducts[pId].quantity += Number(item.quantity);
          topProducts[pId].revenue += Number(item.total_amount);
        });
      });

      // Sort products by revenue
      const topProductsArray = Object.values(topProducts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Convert salesByDate for charts
      // Sort dates
      const chartData = Object.entries(salesByDate)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        totalRevenue,
        totalTax,
        totalDiscount,
        totalItemsSold,
        salesCount: sales?.length || 0,
        chartData,
        topProducts: topProductsArray
      };
    },
    enabled: !!shopId,
  });
}

export function useInventoryReports() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: ['reports-inventory', shopId],
    queryFn: async () => {
      if (!shopId) return null;

      // Fetch from view
      const { data, error } = await supabase
        .from('v_inventory_status')
        .select('*')
        .eq('shop_id', shopId);

      if (error) throw error;

      let totalValue = 0;
      let lowStockCount = 0;
      const lowStockItems: any[] = [];

      data?.forEach(item => {
        // Calculate value based on base_price or cost_price (using cost_price would be better but we might not have it in view)
        // We'll just use quantity * base_price for stock value (MRP value)
        // Note: For actual cost value, we'd need average cost price.
        totalValue += (Number(item.quantity || 0) * Number(item.base_price || 0));
        
        if (Number(item.quantity) <= Number(item.low_stock_threshold || 5)) {
          lowStockCount++;
          lowStockItems.push(item);
        }
      });

      return {
        totalValue,
        lowStockCount,
        lowStockItems: lowStockItems.slice(0, 10), // Return top 10 low stock items
        totalItems: data?.length || 0
      };
    },
    enabled: !!shopId,
  });
}
