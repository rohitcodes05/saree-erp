import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useCreateShop, useUpdateShop, useEligibleManagers } from '@/hooks/useShops';
import type { Shop } from '@/types/database.types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const shopSchema = z.object({
  name:         z.string().min(2, 'Shop name must be at least 2 characters.'),
  code:         z.string().min(2, 'Code must be at least 2 characters.').max(10).toUpperCase(),
  address:      z.string().min(5, 'Full address is required.'),
  city:         z.string().min(2, 'City is required.'),
  state:        z.string().min(2, 'State is required.'),
  pincode:      z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.').optional().or(z.literal('')),
  phone:        z.string().regex(/^\+?[\d\s-]{10,15}$/, 'Enter a valid phone number.').optional().or(z.literal('')),
  email:        z.string().email('Enter a valid email.').optional().or(z.literal('')),
  gst_number:   z.string().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  manager_id:   z.string().uuid().optional().nullable(),
});

type ShopFormData = z.infer<typeof shopSchema>;

// ─── Indian States ────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
].map(s => ({ value: s, label: s }));

// ─── Shop Form Modal ──────────────────────────────────────────────────────────

export interface ShopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: Shop | null; // null = create mode
}

const ShopFormModal: React.FC<ShopFormModalProps> = ({ isOpen, onClose, shop }) => {
  const isEdit = !!shop;
  const { mutateAsync: createShop, isPending: creating } = useCreateShop();
  const { mutateAsync: updateShop, isPending: updating } = useUpdateShop();
  const { data: managers } = useEligibleManagers();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: shop
      ? {
          name: shop.name,
          code: shop.code,
          address: shop.address,
          city: shop.city ?? '',
          state: shop.state ?? '',
          pincode: shop.pincode ?? '',
          phone: shop.phone ?? '',
          email: shop.email ?? '',
          gst_number: shop.gst_number ?? '',
          opening_time: shop.opening_time,
          closing_time: shop.closing_time,
          manager_id: shop.manager_id ?? null,
        }
      : {
          name: '', code: '', address: '', city: '',
          state: 'Tamil Nadu', pincode: '', phone: '',
          email: '', gst_number: '',
          opening_time: '09:00', closing_time: '21:00',
          manager_id: null,
        },
  });

  const state = watch('state');
  const managerId = watch('manager_id');

  const onSubmit = async (data: ShopFormData) => {
    const payload = {
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      gst_number: data.gst_number || undefined,
      opening_time: data.opening_time || '09:00',
      closing_time: data.closing_time || '21:00',
      manager_id: data.manager_id || undefined,
    };

    if (isEdit) {
      const result = await updateShop({ id: shop!.id, ...payload });
      if (!result.error) { onClose(); reset(); }
    } else {
      const result = await createShop(payload);
      if (!result.error) { onClose(); reset(); }
    }
  };

  const managerOptions = [
    { value: '', label: 'No manager assigned' },
    ...(managers ?? []).map(m => ({ value: m.id, label: m.label })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Shop — ${shop?.name}` : 'Add New Shop'}
      subtitle={isEdit ? 'Update shop details' : 'Create a new shop location'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={creating || updating}
          >
            {isEdit ? 'Save Changes' : 'Create Shop'}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        {/* Basic Info */}
        <Input
          label="Shop Name"
          placeholder="T. Nagar Flagship"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Shop Code"
          placeholder="TNG01"
          hint="Short unique identifier (auto-uppercased)"
          required
          error={errors.code?.message}
          {...register('code')}
        />

        {/* Contact */}
        <Input
          label="Phone"
          type="tel"
          placeholder="+91 98400 11111"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="shop@lakshmisilks.in"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Address */}
        <div className="sm:col-span-2">
          <Input
            label="Address"
            placeholder="45, Pondy Bazaar, T. Nagar"
            required
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        <Input
          label="City"
          placeholder="Chennai"
          required
          error={errors.city?.message}
          {...register('city')}
        />

        <Select
          label="State"
          required
          options={INDIAN_STATES}
          searchable
          value={state}
          onChange={val => setValue('state', val ?? '')}
          error={errors.state?.message}
        />

        <Input
          label="Pincode"
          placeholder="600017"
          maxLength={6}
          error={errors.pincode?.message}
          {...register('pincode')}
        />

        <Input
          label="GST Number"
          placeholder="33AABCL1234A1ZS"
          error={errors.gst_number?.message}
          {...register('gst_number')}
        />

        {/* Hours */}
        <Input
          label="Opening Time"
          type="time"
          error={errors.opening_time?.message}
          {...register('opening_time')}
        />
        <Input
          label="Closing Time"
          type="time"
          error={errors.closing_time?.message}
          {...register('closing_time')}
        />

        {/* Manager */}
        <div className="sm:col-span-2">
          <Select
            label="Shop Manager"
            hint="Assign a manager to this shop"
            options={managerOptions}
            value={managerId ?? ''}
            onChange={val => setValue('manager_id', val || null)}
            clearable
            searchable
          />
        </div>
      </form>
    </Modal>
  );
};

export default ShopFormModal;
