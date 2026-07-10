import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, Button, Input } from '@/components/ui';
import type { Supplier } from '@/types/database.types';
import toast from 'react-hot-toast';

const supplierSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gst_number: z.string().optional(),
  pan_number: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
  credit_limit: z.coerce.number().min(0).default(0),
  credit_days: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Supplier>) => Promise<void>;
  initialData?: Supplier;
  isLoading?: boolean;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  isOpen, onClose, onSubmit, initialData, isLoading
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gst_number: '',
      pan_number: '',
      bank_name: '',
      bank_account_number: '',
      bank_ifsc: '',
      credit_limit: 0,
      credit_days: 0,
      notes: '',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        contact_person: initialData.contact_person || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        pincode: initialData.pincode || '',
        gst_number: initialData.gst_number || '',
        pan_number: initialData.pan_number || '',
        bank_name: initialData.bank_name || '',
        bank_account_number: initialData.bank_account_number || '',
        bank_ifsc: initialData.bank_ifsc || '',
        credit_limit: initialData.credit_limit || 0,
        credit_days: initialData.credit_days || 0,
        notes: initialData.notes || '',
      });
    } else {
      reset();
    }
  }, [initialData, reset, isOpen]);

  const onSubmitHandler = async (data: SupplierFormValues) => {
    try {
      const cleanedData = {
        ...data,
        email: data.email || undefined,
      };
      await onSubmit(cleanedData as Partial<Supplier>);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Supplier' : 'Add New Supplier'}
      size="md"
    >
      <form id="supplier-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Basic Info</h3>
          <Input
            label="Company Name"
            {...register('name')}
            error={errors.name?.message}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              {...register('contact_person')}
              error={errors.contact_person?.message}
            />
            <Input
              label="Phone Number"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Address</h3>
          <Input
            label="Street Address"
            {...register('address')}
            error={errors.address?.message}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" {...register('city')} />
            <Input label="State" {...register('state')} />
            <Input label="Pincode" {...register('pincode')} />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Tax & Bank Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="GST Number" {...register('gst_number')} />
            <Input label="PAN Number" {...register('pan_number')} />
          </div>
          <Input label="Bank Name" {...register('bank_name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Number" {...register('bank_account_number')} />
            <Input label="IFSC Code" {...register('bank_ifsc')} />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Business Terms</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Credit Limit (₹)" type="number" {...register('credit_limit')} />
            <Input label="Credit Days" type="number" {...register('credit_days')} />
          </div>
          <Input label="Notes" {...register('notes')} />
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Supplier' : 'Add Supplier'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
