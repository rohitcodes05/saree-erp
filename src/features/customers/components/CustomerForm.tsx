import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, Button, Input, Select } from '@/components/ui';
import type { Customer } from '@/types/database.types';
import toast from 'react-hot-toast';

const customerSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().optional(),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  date_of_birth: z.string().optional().or(z.literal('')),
  anniversary_date: z.string().optional().or(z.literal('')),
  customer_group: z.enum(['regular', 'silver', 'gold', 'platinum']).default('regular'),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Customer>) => Promise<void>;
  initialData?: Customer;
  isLoading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen, onClose, onSubmit, initialData, isLoading
}) => {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      date_of_birth: '',
      anniversary_date: '',
      customer_group: 'regular',
      notes: '',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        first_name: initialData.first_name,
        last_name: initialData.last_name || '',
        phone: initialData.phone,
        email: initialData.email || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        pincode: initialData.pincode || '',
        date_of_birth: initialData.date_of_birth || '',
        anniversary_date: initialData.anniversary_date || '',
        customer_group: initialData.customer_group || 'regular',
        notes: initialData.notes || '',
      });
    } else {
      reset();
    }
  }, [initialData, reset, isOpen]);

  const onSubmitHandler = async (data: CustomerFormValues) => {
    try {
      // Clean up empty strings to undefined to avoid DB constraints errors with dates etc
      const cleanedData = {
        ...data,
        email: data.email || undefined,
        date_of_birth: data.date_of_birth || undefined,
        anniversary_date: data.anniversary_date || undefined,
      };
      await onSubmit(cleanedData as Partial<Customer>);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Customer' : 'Add New Customer'}
      size="md"
    >
      <form id="customer-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Basic Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register('first_name')}
              error={errors.first_name?.message}
              required
            />
            <Input
              label="Last Name"
              {...register('last_name')}
              error={errors.last_name?.message}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              {...register('phone')}
              error={errors.phone?.message}
              required
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Address & Details</h3>
          <Input
            label="Street Address"
            {...register('address')}
            error={errors.address?.message}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              {...register('city')}
              error={errors.city?.message}
            />
            <Input
              label="State"
              {...register('state')}
              error={errors.state?.message}
            />
            <Input
              label="Pincode"
              {...register('pincode')}
              error={errors.pincode?.message}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Loyalty & Occasions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="customer_group"
              control={control}
              render={({ field }) => (
                <Select
                  label="Customer Group"
                  options={[
                    { value: 'regular', label: 'Regular' },
                    { value: 'silver', label: 'Silver' },
                    { value: 'gold', label: 'Gold' },
                    { value: 'platinum', label: 'Platinum' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input
                label="Date of Birth"
                type="date"
                {...register('date_of_birth')}
             />
             <Input
                label="Anniversary"
                type="date"
                {...register('anniversary_date')}
             />
          </div>
          <Input
            label="Notes"
            {...register('notes')}
          />
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Customer' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
