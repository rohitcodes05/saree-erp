import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, Modal } from '@/components/ui';
import { useAddExpense } from '../hooks';
import type { ExpenseCategory } from '@/types/database.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

const expenseSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().optional(),
  expense_date: z.string().min(1, 'Date is required'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryOptions = [
  { value: 'utilities', label: 'Utilities (Electricity, Water)' },
  { value: 'supplies', label: 'Supplies (Tea, Snacks)' },
  { value: 'transport', label: 'Transport / Shipping' },
  { value: 'maintenance', label: 'Maintenance / Repairs' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'salary', label: 'Salary / Wages' },
  { value: 'other', label: 'Other' }
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose }) => {
  const addExpense = useAddExpense();
  const authState = useAuth();
  const { activeShop, assignedShops } = authState;
  
  console.log('[DEBUG] ExpenseForm render - useAuth returned:', { activeShop, assignedShopsCount: assignedShops?.length });
  
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
      category: 'supplies'
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        expense_date: new Date().toISOString().split('T')[0],
        category: 'supplies'
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ExpenseFormValues) => {
    // If activeShop is missing or has no ID, fallback to the first assigned shop
    const shopToUse = activeShop?.id ? activeShop : assignedShops?.[0];
    const shopId = shopToUse?.id;
    
    console.log('[DEBUG] ExpenseForm onSubmit - using shopId:', shopId, 'from shop:', shopToUse);
    
    if (!shopId) {
      toast.error('No active shop selected');
      return;
    }

    try {
      await addExpense.mutateAsync({
        ...data,
        category: data.category as ExpenseCategory,
        shop_id: shopId,
      });
      toast.success('Expense recorded successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record expense');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Expense"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
            required
            placeholder="e.g. 150"
          />
        </div>

        <div>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                label="Category"
                value={field.value}
                onChange={field.onChange}
                error={errors.category?.message}
                options={categoryOptions}
                required
              />
            )}
          />
        </div>

        <div>
          <Input
            label="Date"
            type="date"
            {...register('expense_date')}
            error={errors.expense_date?.message}
            required
          />
        </div>

        <div>
          <Input
            label="Description (Optional)"
            {...register('description')}
            error={errors.description?.message}
            placeholder="e.g. Evening tea for staff"
          />
        </div>

        {!activeShop && !assignedShops?.length && (
          <div className="bg-danger-50 text-danger p-3 rounded-lg text-sm mb-4 border border-danger-200">
            <strong>Warning:</strong> No shop assigned to you. You cannot save expenses.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!activeShop && !assignedShops?.length}>
            Save Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};
