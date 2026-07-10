import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, Button, Input, Select } from '@/components/ui';
import type { Employee } from '@/types/database.types';
import { useShops } from '@/hooks/useShops';
import toast from 'react-hot-toast';

const employeeSchema = z.object({
  shop_id: z.string().min(1, 'Shop is required'),
  employee_code: z.string().min(1, 'Employee code is required'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  designation: z.string().optional(),
  department: z.string().optional(),
  base_salary: z.coerce.number().min(0).default(0),
  date_of_joining: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
  pan_number: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  initialData?: Employee;
  isLoading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  isOpen, onClose, onSubmit, initialData, isLoading
}) => {
  const { data: shops = [] } = useShops();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      shop_id: '',
      employee_code: '',
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      designation: '',
      department: '',
      base_salary: 0,
      date_of_joining: '',
      date_of_birth: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      bank_name: '',
      bank_account_number: '',
      bank_ifsc: '',
      pan_number: '',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        shop_id: initialData.shop_id,
        employee_code: initialData.employee_code,
        first_name: initialData.first_name,
        last_name: initialData.last_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        designation: initialData.designation || '',
        department: initialData.department || '',
        base_salary: initialData.base_salary || 0,
        date_of_joining: initialData.date_of_joining || '',
        date_of_birth: initialData.date_of_birth || '',
        address: initialData.address || '',
        emergency_contact_name: initialData.emergency_contact_name || '',
        emergency_contact_phone: initialData.emergency_contact_phone || '',
        bank_name: initialData.bank_name || '',
        bank_account_number: initialData.bank_account_number || '',
        bank_ifsc: initialData.bank_ifsc || '',
        pan_number: initialData.pan_number || '',
      });
    } else {
      reset();
    }
  }, [initialData, reset, isOpen]);

  const onSubmitHandler = async (data: EmployeeFormValues) => {
    try {
      const cleanedData = {
        ...data,
        email: data.email || undefined,
        date_of_joining: data.date_of_joining || undefined,
        date_of_birth: data.date_of_birth || undefined,
      };
      await onSubmit(cleanedData as Partial<Employee>);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Employee' : 'Add New Employee'}
      size="md"
    >
      <form id="employee-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Personal Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} required />
            <Input label="Last Name" {...register('last_name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" {...register('phone')} />
            <Input label="Email" type="email" {...register('email')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" {...register('date_of_birth')} />
            <Input label="Address" {...register('address')} />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Job Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee Code" {...register('employee_code')} error={errors.employee_code?.message} required />
            <Controller
              name="shop_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Primary Shop"
                  options={shops.map(s => ({ value: s.id, label: s.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.shop_id?.message}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Designation" {...register('designation')} placeholder="e.g. Sales Executive" />
            <Input label="Department" {...register('department')} placeholder="e.g. Sales" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Salary (₹)" type="number" {...register('base_salary')} />
            <Input label="Date of Joining" type="date" {...register('date_of_joining')} />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Bank & Emergency</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency Contact Name" {...register('emergency_contact_name')} />
            <Input label="Emergency Contact Phone" {...register('emergency_contact_phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="PAN Number" {...register('pan_number')} />
            <Input label="Bank Name" {...register('bank_name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Number" {...register('bank_account_number')} />
            <Input label="IFSC Code" {...register('bank_ifsc')} />
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Employee' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
