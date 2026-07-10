import React, { useState } from 'react';
import { Plus, Search, Filter, Box, Trash2 } from 'lucide-react';
import { 
  Button, Input, Card, Table, Badge, EmptyState 
} from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { useProducts, useDeleteProduct } from './hooks';
import { ProductForm } from './components/ProductForm';
import type { Product } from '@/types/database.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ProductsPage: React.FC = () => {
  const { isCashier } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const deleteMutation = useDeleteProduct();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    if (isCashier) return;
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Product deleted');
      } catch (err: any) {
        toast.error('Failed to delete product');
      }
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      header: 'Product',
      key: 'name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-text">{row.name}</p>
          <p className="text-xs text-text-muted mt-0.5">SKU: {row.sku}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      render: (_, row) => (
        <Badge variant="secondary">
          {(row as any).category?.name || 'Uncategorized'}
        </Badge>
      ),
    },
    {
      header: 'Price (₹)',
      key: 'selling_price',
      render: (val) => <span className="font-medium">₹{String(val)}</span>,
    },
    {
      header: 'GST',
      key: 'gst_rate',
      render: (val) => `${val}%`,
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (val) => (
        <Badge variant={val ? 'success' : 'secondary'}>
          {val ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (!isCashier) {
    columns.push({
      header: '',
      key: 'actions',
      render: (_, row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className="page-container animate-fade-up space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Products Catalog</h1>
          <p className="text-sm text-text-muted mt-1">Manage your saree collection, pricing, and barcodes.</p>
        </div>
        {!isCashier && (
          <Button 
            onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters and Table */}
      <Card className="flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search products by name or SKU..." 
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="text-text-muted">Loading products...</span>
            </div>
          ) : filteredProducts.length > 0 ? (
            <Table
              data={filteredProducts}
              columns={columns as any}
              rowKey="id"
              onRowClick={isCashier ? undefined : handleEdit}
              className="w-full whitespace-nowrap cursor-pointer"
            />
          ) : (
            <EmptyState
              icon={<Box className="h-8 w-8" />}
              title={searchTerm ? 'No products found' : 'No products yet'}
              description={searchTerm ? `No results for "${searchTerm}"` : 'Add your first product to start building the catalog.'}
              action={
                !searchTerm && !isCashier && (
                  <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                )
              }
              className="h-[400px]"
            />
          )}
        </div>
      </Card>

      <ProductForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        product={editingProduct} 
      />
    </div>
  );
};

export default ProductsPage;
