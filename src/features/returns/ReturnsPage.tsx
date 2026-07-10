import React, { useState } from 'react';
import { RotateCcw, Search, Plus, Filter, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useReturns } from './hooks';
import { formatCurrency } from '@/constants/gst';
import { ReturnForm } from './components/ReturnForm';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ReturnsPage: React.FC = () => {
  const { data: returns, isLoading } = useReturns();
  const { activeShop } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);

  const filteredReturns = returns?.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const returnNo = r.return_number?.toLowerCase() || '';
    const invoiceNo = r.sale?.invoice_number?.toLowerCase() || '';
    const fName = r.customer?.first_name?.toLowerCase() || '';
    const lName = r.customer?.last_name?.toLowerCase() || '';
    
    return returnNo.includes(searchLower) ||
           invoiceNo.includes(searchLower) ||
           fName.includes(searchLower) ||
           lName.includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'rejected': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!activeShop) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-semibold text-text mb-2">No Shop Selected</h2>
        <p className="text-text-muted text-center max-w-md">
          Please select a shop from the top navigation bar to view and manage returns.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            Returns & Exchanges
          </h1>
          <p className="text-text-muted mt-1">Process customer returns and refunds</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Button icon={<Filter className="h-4 w-4" />} variant="outline">
            Filter
          </Button>
          <Button 
            icon={<Plus className="h-4 w-4" />} 
            onClick={() => setIsReturnFormOpen(true)}
            className="flex-1 sm:flex-none"
          >
            Process Return
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-2/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search by Return #, Invoice # or Customer..."
              className="w-full pl-9 pr-4 py-2 bg-surface-1 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-1/50 text-left">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Return #</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Original Invoice</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Refund Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Refund Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    <div className="flex justify-center mb-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading returns...
                  </td>
                </tr>
              ) : filteredReturns?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center">
                      <RotateCcw className="h-12 w-12 text-surface-4 mb-4" />
                      <p className="text-base font-medium text-text mb-1">No returns found</p>
                      <p className="text-sm">There are no returns matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns?.map((ret) => (
                  <tr key={ret.id} className="hover:bg-surface-2/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text font-medium">{new Date(ret.return_date).toLocaleDateString()}</div>
                      <div className="text-xs text-text-muted">{new Date(ret.return_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-primary">{ret.return_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {ret.sale?.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ret.customer ? (
                        <div className="text-sm font-medium text-text">
                          {ret.customer.first_name} {ret.customer.last_name || ''}
                        </div>
                      ) : (
                        <span className="text-sm text-text-muted italic">Walk-in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="capitalize">{ret.refund_method}</Badge>
                      {ret.restocked && (
                         <Badge variant="outline" className="ml-2 text-[10px] py-0">Restocked</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-danger">
                        {formatCurrency(ret.refund_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(ret.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ReturnForm 
        isOpen={isReturnFormOpen} 
        onClose={() => setIsReturnFormOpen(false)} 
      />
    </div>
  );
};
