import React, { useState } from 'react';
import { Truck, Search, Plus, Phone, Edit2, Trash2, MapPin } from 'lucide-react';
import { 
  Button, Input, Card, Table, EmptyState, Spinner, Badge
} from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from './hooks';
import { SupplierForm } from './components/SupplierForm';
import type { Supplier } from '@/types/database.types';
import toast from 'react-hot-toast';

export const SuppliersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>();

  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm)) ||
    (s.gst_number && s.gst_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenForm = (supplier?: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSupplier(undefined);
  };

  const handleSubmit = async (data: Partial<Supplier>) => {
    if (selectedSupplier) {
      await updateSupplier.mutateAsync({ id: selectedSupplier.id, ...data });
      toast.success('Supplier updated successfully');
    } else {
      await createSupplier.mutateAsync(data);
      toast.success('Supplier added successfully');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier.mutateAsync(id);
        toast.success('Supplier deleted');
      } catch (err: any) {
        toast.error('Cannot delete supplier, they might have associated products or bills.');
      }
    }
  };

  const columns: TableColumn<any>[] = [
    {
      header: 'Company Name',
      key: 'name',
      render: (_val: any, row) => (
        <div>
          <div className="font-semibold text-text">{row.name}</div>
          {row.contact_person && <div className="text-xs text-text-muted">Attn: {row.contact_person}</div>}
        </div>
      )
    },
    {
      header: 'Contact',
      key: 'phone',
      render: (val: any, row) => (
        <div className="space-y-0.5">
          {val && <div className="flex items-center gap-1.5 text-text text-sm"><Phone className="h-3 w-3 text-text-muted" /> {val}</div>}
          {row.email && <div className="text-xs text-text-muted">{row.email}</div>}
        </div>
      )
    },
    {
      header: 'Location',
      key: 'city',
      render: (val: any, row) => (
        <div className="flex items-center gap-1.5 text-text text-sm">
          {val ? <><MapPin className="h-3 w-3 text-text-muted" /> {val}{row.state ? `, ${row.state}` : ''}</> : '—'}
        </div>
      )
    },
    {
      header: 'Tax Info',
      key: 'gst_number',
      render: (val: any, _row) => (
        <div className="space-y-1">
          {val ? <Badge variant="secondary" className="text-[10px]">GST: {val}</Badge> : <span className="text-xs text-text-muted">No GST</span>}
        </div>
      )
    },
    {
      header: 'Credit Terms',
      key: 'credit_limit',
      render: (val: any, row) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-text">Limit: ₹{(val || 0).toLocaleString('en-IN')}</span>
          <span className="text-xs text-text-muted">Days: {row.credit_days || 0}</span>
        </div>
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
          <h1 className="text-2xl font-bold text-text">Suppliers</h1>
          <p className="text-text-muted mt-1">Manage your vendors, their tax details, and credit terms.</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search by name, contact or GST..." 
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
        ) : filteredSuppliers.length === 0 ? (
          <EmptyState 
            icon={<Truck className="h-8 w-8" />}
            title="No suppliers found"
            description="Add your first supplier to start managing inventory purchases."
            action={<Button onClick={() => handleOpenForm()}>Add Supplier</Button>}
          />
        ) : (
          <Table 
            columns={columns}
            data={filteredSuppliers as any}
            rowKey="id"
          />
        )}
      </Card>

      <SupplierForm 
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedSupplier}
        isLoading={createSupplier.isPending || updateSupplier.isPending}
      />
    </div>
  );
};

export default SuppliersPage;
