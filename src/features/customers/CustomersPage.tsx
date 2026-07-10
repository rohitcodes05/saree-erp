import React, { useState } from 'react';
import { Users, Search, Plus, Phone, Calendar, Edit2, Trash2 } from 'lucide-react';
import { 
  Button, Input, Card, Table, Badge, EmptyState, Spinner
} from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from './hooks';
import { CustomerForm } from './components/CustomerForm';
import type { Customer } from '@/types/database.types';
import toast from 'react-hot-toast';

export const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const filteredCustomers = customers.filter(c => 
    c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenForm = (customer?: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCustomer(undefined);
  };

  const handleSubmit = async (data: Partial<Customer>) => {
    if (selectedCustomer) {
      await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...data });
      toast.success('Customer updated successfully');
    } else {
      await createCustomer.mutateAsync(data);
      toast.success('Customer added successfully');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer.mutateAsync(id);
        toast.success('Customer deleted');
      } catch (err: any) {
        toast.error('Cannot delete customer, they might have sales history.');
      }
    }
  };

  const columns: TableColumn<Customer>[] = [
    {
      header: 'Name',
      key: 'first_name',
      render: (val: any, row) => (
        <div>
          <div className="font-semibold text-text">{row.first_name} {row.last_name}</div>
          {row.email && <div className="text-xs text-text-muted">{row.email}</div>}
        </div>
      )
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (val: any) => (
        <div className="flex items-center gap-1.5 text-text">
          <Phone className="h-3 w-3 text-text-muted" />
          {val}
        </div>
      )
    },
    {
      header: 'Group & Loyalty',
      key: 'customer_group',
      render: (val: any, row) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant={
            val === 'platinum' ? 'primary' : 
            val === 'gold' ? 'warning' : 
            val === 'silver' ? 'secondary' : 'default'
          }>
            {val.charAt(0).toUpperCase() + val.slice(1)}
          </Badge>
          <span className="text-xs font-medium text-text-muted">{row.loyalty_points} pts</span>
        </div>
      )
    },
    {
      header: 'Occasions',
      key: 'date_of_birth',
      render: (val: any, row) => (
        <div className="text-xs text-text-muted space-y-0.5">
          {val && <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> DOB: {new Date(val).toLocaleDateString()}</div>}
          {row.anniversary_date && <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Anniv: {new Date(row.anniversary_date).toLocaleDateString()}</div>}
        </div>
      )
    },
    {
      header: 'Total Purchases',
      key: 'total_purchases',
      render: (val: any) => (
        <div className="font-semibold">₹{(val || 0).toLocaleString('en-IN')}</div>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (val: any, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenForm(row)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => handleDelete(val)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Customers</h1>
          <p className="text-text-muted mt-1">Manage your customer database and loyalty points.</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search by name, phone or email..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState 
            icon={<Users className="h-8 w-8" />}
            title="No customers found"
            description="Add your first customer to start tracking loyalty points."
            action={<Button onClick={() => handleOpenForm()}>Add Customer</Button>}
          />
        ) : (
          <Table 
            columns={columns as any}
            data={filteredCustomers}
            rowKey="id"
          />
        )}
      </Card>

      <CustomerForm 
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedCustomer}
        isLoading={createCustomer.isPending || updateCustomer.isPending}
      />
    </div>
  );
};

export default CustomersPage;
