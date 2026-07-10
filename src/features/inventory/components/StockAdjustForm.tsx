import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  Button, Input, Textarea, Select, 
  Drawer 
} from '@/components/ui';
import { useAdjustStock } from '../hooks';
import type { InventoryStatusView } from '@/types/database.types';

const adjustSchema = z.object({
  type: z.enum(['stock_in', 'stock_out', 'damage', 'adjustment']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

const TX_TYPES = [
  { value: 'stock_in', label: 'Stock In (+)' },
  { value: 'stock_out', label: 'Stock Out (-)' },
  { value: 'damage', label: 'Damage (-)' },
  { value: 'adjustment', label: 'Manual Adjustment' },
];

export interface StockAdjustFormProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem?: InventoryStatusView | null;
}

export const StockAdjustForm: React.FC<StockAdjustFormProps> = ({ 
  isOpen, 
  onClose, 
  inventoryItem 
}) => {
  const adjustMutation = useAdjustStock();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      type: 'stock_in',
      quantity: 1,
      notes: '',
    },
  });

  // Reset form when opened for a new item
  React.useEffect(() => {
    if (isOpen) {
      reset({
        type: 'stock_in',
        quantity: 1,
        notes: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: AdjustFormData) => {
    if (!inventoryItem) return;

    try {
      await adjustMutation.mutateAsync({
        shopId: inventoryItem.shop_id,
        productId: inventoryItem.product_id,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes,
      });

      toast.success('Stock updated successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update stock');
    }
  };

  if (!inventoryItem) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Stock"
      subtitle={`For: ${inventoryItem.product_name} (${inventoryItem.sku})`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            Confirm Adjustment
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="p-4 bg-surface-2 rounded-xl border border-border">
          <p className="text-sm text-text-muted mb-1">Current Stock in {inventoryItem.shop_name}</p>
          <p className="text-2xl font-semibold text-text">{inventoryItem.quantity} Units</p>
        </div>

        <div className="space-y-4">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label="Transaction Type"
                options={TX_TYPES}
                error={errors.type?.message}
                {...field}
              />
            )}
          />

          <Input
            label="Quantity"
            type="number"
            error={errors.quantity?.message}
            {...register('quantity', { valueAsNumber: true })}
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Reason for adjustment..."
            rows={3}
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>
      </div>
    </Drawer>
  );
};
