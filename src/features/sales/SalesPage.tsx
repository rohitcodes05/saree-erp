import React, { useState } from 'react';
import { Search, Receipt, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { useSalesHistory } from './hooks';
import { formatCurrency } from '@/constants/gst';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const SalesPage: React.FC = () => {
  const { activeShop } = useAuth();
  const { data: sales, isLoading } = useSalesHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const filteredSales = sales?.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const invoiceNo = s.invoice_number?.toLowerCase() || '';
    const fName = s.customer?.first_name?.toLowerCase() || '';
    const lName = s.customer?.last_name?.toLowerCase() || '';
    
    return invoiceNo.includes(searchLower) ||
           fName.includes(searchLower) ||
           lName.includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'returned': return <Badge variant="danger">Returned</Badge>;
      case 'partially_returned': return <Badge variant="warning">Partially Returned</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSaleId(prev => prev === id ? null : id);
  };

  if (!activeShop) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-semibold text-text mb-2">No Shop Selected</h2>
        <p className="text-text-muted text-center max-w-md">
          Please select a shop from the top navigation bar to view sales history.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Sales History
          </h1>
          <p className="text-text-muted mt-1">View and manage past invoices</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-2/50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search by Invoice # or Customer Name..."
              className="w-full pl-9 pr-4 py-2 bg-surface-1 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface-1/50">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Total Amount</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    Loading sales history...
                  </td>
                </tr>
              ) : filteredSales?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    <Receipt className="h-10 w-10 text-surface-4 mx-auto mb-3" />
                    <p>No sales found.</p>
                  </td>
                </tr>
              ) : (
                filteredSales?.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <tr 
                      className={`hover:bg-surface-2/30 transition-colors cursor-pointer ${expandedSaleId === sale.id ? 'bg-surface-2/50' : ''}`}
                      onClick={() => toggleExpand(sale.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text font-medium">{new Date(sale.sale_date).toLocaleDateString()}</div>
                        <div className="text-xs text-text-muted">{new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary">{sale.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.customer ? (
                          <div className="text-sm font-medium text-text">
                            {sale.customer.first_name} {sale.customer.last_name || ''}
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted italic">Walk-in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sale.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-text">
                          {formatCurrency(sale.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">
                        {expandedSaleId === sale.id ? <ChevronUp className="h-5 w-5 inline-block" /> : <ChevronDown className="h-5 w-5 inline-block" />}
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedSaleId === sale.id && (
                      <tr className="bg-surface-1 border-b border-border">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Items List */}
                            <div>
                              <h4 className="text-sm font-semibold text-text mb-3 border-b border-border pb-2">Purchased Items</h4>
                              <div className="space-y-3">
                                {sale.items.map((item: any) => (
                                  <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div>
                                      <p className="font-medium text-text">{item.product?.name}</p>
                                      <p className="text-xs text-text-muted">SKU: {item.product?.sku} • Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-medium">
                                      {formatCurrency(item.total_amount)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Summary Card */}
                            <div>
                              <h4 className="text-sm font-semibold text-text mb-3 border-b border-border pb-2">Payment Summary</h4>
                              <div className="bg-surface-2 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between text-text-muted">
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(sale.subtotal)}</span>
                                </div>
                                {sale.discount_amount > 0 && (
                                  <div className="flex justify-between text-success">
                                    <span>Discount</span>
                                    <span>- {formatCurrency(sale.discount_amount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-text-muted">
                                  <span>Tax (GST)</span>
                                  <span>+ {formatCurrency(sale.gst_amount)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-text pt-2 border-t border-border mt-2">
                                  <span>Total</span>
                                  <span>{formatCurrency(sale.total_amount)}</span>
                                </div>
                                <div className="flex justify-between text-primary font-medium pt-1">
                                  <span>Amount Paid</span>
                                  <span>{formatCurrency(sale.amount_paid)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
