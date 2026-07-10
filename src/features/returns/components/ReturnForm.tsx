import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Search, RotateCcw, AlertTriangle } from 'lucide-react';
import { Modal, Button, Input, Select, Badge, Card } from '@/components/ui';
import { useProcessReturn, useSaleByInvoice } from '../hooks';
import { formatCurrency } from '@/constants/gst';

const returnSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  reason: z.string().min(1, 'Reason is required'),
  refund_method: z.string().min(1, 'Refund method is required'),
  restocked: z.boolean(),
  notes: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

interface ReturnFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({ isOpen, onClose }) => {
  const processReturn = useProcessReturn();
  const [searchInvoice, setSearchInvoice] = useState('');
  
  const { data: sale, isLoading: isLoadingSale } = useSaleByInvoice(searchInvoice);
  
  // State for tracking which items are being returned
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      invoice_number: '',
      reason: 'Customer requested',
      refund_method: 'cash',
      restocked: true,
      notes: '',
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInvoice(e.target.value);
  };

  const handleItemQuantityChange = (itemId: string, maxQty: number, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    if (num > maxQty) return;
    
    setReturnItems(prev => ({
      ...prev,
      [itemId]: num
    }));
  };

  const calculateTotalRefund = () => {
    if (!sale) return 0;
    let total = 0;
    
    sale.items.forEach((item: any) => {
      const returnQty = returnItems[item.id] || 0;
      if (returnQty > 0) {
        // Calculate proportional refund based on quantity returned
        const perItemPrice = item.total_amount / item.quantity;
        total += returnQty * perItemPrice;
      }
    });
    
    return total;
  };

  const onSubmit = async (data: ReturnFormValues) => {
    if (!sale) {
      toast.error('Please enter a valid invoice number');
      return;
    }

    // Build the items payload
    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const saleItem = sale.items.find((i: any) => i.id === itemId);
        const perItemPrice = saleItem ? (saleItem.total_amount / saleItem.quantity) : 0;
        return {
          sale_item_id: itemId,
          product_id: saleItem?.product_id,
          quantity: qty,
          refund_amount: qty * perItemPrice,
          unit_price: perItemPrice
        };
      });

    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    try {
      await processReturn.mutateAsync({
        original_sale_id: sale.id,
        customer_id: sale.customer_id,
        reason: data.reason,
        refund_amount: calculateTotalRefund(),
        refund_method: data.refund_method,
        restocked: data.restocked,
        notes: data.notes || '',
        items: itemsToReturn
      });
      
      toast.success('Return processed successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process return');
    }
  };

  const totalRefund = calculateTotalRefund();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Return"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          
          {/* Invoice Search */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Find Invoice</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-muted" />
              </div>
              <input
                type="text"
                placeholder="Enter Invoice Number (e.g. INV-1002)..."
                className="w-full pl-9 pr-4 py-2 bg-surface-1 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                {...register('invoice_number')}
                onChange={(e) => {
                  register('invoice_number').onChange(e);
                  handleSearch(e);
                }}
              />
            </div>
            {errors.invoice_number && (
              <p className="text-danger text-xs mt-1">{errors.invoice_number.message}</p>
            )}
          </div>

          {/* Sale Details & Items */}
          {isLoadingSale && (
            <div className="py-8 text-center text-text-muted animate-pulse">
              Searching for invoice...
            </div>
          )}

          {!isLoadingSale && sale && (
            <Card className="p-4 bg-surface-2 border-primary/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium text-text">{sale.invoice_number}</h4>
                  <p className="text-sm text-text-muted">
                    {new Date(sale.sale_date).toLocaleDateString()} • {sale.customer ? `${sale.customer.first_name} ${sale.customer.last_name || ''}` : 'Walk-in Customer'}
                  </p>
                </div>
                <Badge variant={sale.status === 'completed' ? 'success' : 'warning'}>
                  {sale.status}
                </Badge>
              </div>

              {sale.status === 'returned' ? (
                <div className="bg-warning-50 text-warning p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  This invoice has already been fully returned.
                </div>
              ) : (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-text border-b border-border pb-2">Select Items to Return</h5>
                  {sale.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text">{item.product?.name}</p>
                        <p className="text-xs text-text-muted">SKU: {item.product?.sku} • Qty Sold: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(item.total_amount)}</p>
                      </div>
                      <div className="w-24">
                        <Input 
                          type="number"
                          min="0"
                          max={item.quantity}
                          placeholder="0"
                          value={returnItems[item.id] || ''}
                          onChange={(e) => handleItemQuantityChange(item.id, item.quantity, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Return Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="refund_method"
              control={control}
              render={({ field }) => (
                <Select 
                  label="Refund Method"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.refund_method?.message}
                  options={[
                    { value: 'cash', label: 'Cash Refund' },
                    { value: 'upi', label: 'UPI Refund' },
                    { value: 'card', label: 'Card Refund' },
                    { value: 'exchange', label: 'Exchange (No Cash)' }
                  ]}
                />
              )}
            />
            
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Select 
                  label="Reason for Return"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.reason?.message}
                  options={[
                    { value: 'Customer requested', label: 'Customer Requested' },
                    { value: 'Defective product', label: 'Defective Product' },
                    { value: 'Wrong item', label: 'Wrong Item' },
                    { value: 'Exchange', label: 'Exchange' }
                  ]}
                />
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="restocked" 
              className="rounded border-border text-primary focus:ring-primary"
              {...register('restocked')}
            />
            <label htmlFor="restocked" className="text-sm text-text">
              Restock returned items into inventory
            </label>
          </div>

          <Input 
            label="Additional Notes (Optional)"
            placeholder="Any specific details about the return..."
            {...register('notes')}
          />

        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
          <div>
            <p className="text-sm text-text-muted">Total Refund</p>
            <p className="text-xl font-bold text-danger">{formatCurrency(totalRefund)}</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isSubmitting} 
              disabled={!sale || sale.status === 'returned' || totalRefund === 0}
              icon={<RotateCcw className="h-4 w-4" />}
            >
              Process Return
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
