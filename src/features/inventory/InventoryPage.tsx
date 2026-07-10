import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Layers, Plus } from 'lucide-react';
import { 
  Button, Input, Card, Table, Badge, EmptyState, Select, Spinner
} from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { useInventory } from './hooks';
import { useShops } from '@/hooks/useShops';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { StockAdjustForm } from './components/StockAdjustForm';
import type { InventoryStatusView } from '@/types/database.types';
import { useNavigate } from 'react-router-dom';

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, assignedShops, isCashier } = useAuth();
  const { data: shops = [] } = useShops();
  
  // If user is super_admin, they can see all shops. 
  // Otherwise, default to their first assigned shop.
  const [selectedShopId, setSelectedShopId] = useState<string>(
    role === 'super_admin' ? '' : (assignedShops?.[0]?.id || '')
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const { data: inventory = [], isLoading } = useInventory(selectedShopId || undefined);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryStatusView | null>(null);

  const filteredInventory = inventory.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjust = (item: InventoryStatusView) => {
    setAdjustItem(item);
    setIsAdjustOpen(true);
  };

  const columns: TableColumn<InventoryStatusView>[] = [
    {
      header: 'Product',
      key: 'product_name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-text">{row.product_name}</p>
          <p className="text-xs text-text-muted mt-0.5">SKU: {row.sku} {row.barcode ? `| BC: ${row.barcode}` : ''}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category_name',
      render: (val) => String(val || '—'),
    },
    {
      header: 'Shop',
      key: 'shop_name',
      render: (val) => <span className="text-sm">{String(val)}</span>,
    },
    {
      header: 'Stock Status',
      key: 'stock_status',
      render: (val, row) => {
        if (row.quantity <= 0) {
          return <Badge variant="danger">Out of Stock</Badge>;
        }
        if (row.quantity <= row.minimum_stock) {
          return <Badge variant="warning">Low Stock</Badge>;
        }
        return <Badge variant="success">In Stock</Badge>;
      },
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{String(val)}</span>
          {row.quantity <= row.minimum_stock && (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
      ),
    },
  ];

  if (!isCashier) {
    columns.push({
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button size="sm" variant="outline" onClick={(e) => {
          e.stopPropagation();
          handleAdjust(row);
        }}>
          Adjust
        </Button>
      ),
    });
  }

  const shopOptions = [
    { value: '', label: 'All Shops' },
    ...shops.map(s => ({ value: s.id, label: s.name }))
  ];

  return (
    <div className="page-container animate-fade-up space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Inventory Management</h1>
          <p className="text-sm text-text-muted mt-1">Track stock levels across all your shops.</p>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search by product or SKU..." 
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {role === 'super_admin' && (
            <div className="w-full sm:w-48">
              <Select
                options={shopOptions}
                value={selectedShopId}
                onChange={(val) => setSelectedShopId(val ?? '')}
                placeholder="Filter by Shop"
              />
            </div>
          )}

          <Button variant="outline" className="w-full sm:w-auto ml-auto">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Spinner size="lg" />
            </div>
          ) : filteredInventory?.length === 0 ? (
            <EmptyState 
              icon={<Layers className="h-8 w-8" />}
              title="No inventory records found"
              description="Adjust filters or add products to see stock levels."
            />
          ) : (
            <Table 
              data={filteredInventory || []} 
              columns={columns as any} 
              onRowClick={(item) => navigate(`/products/${item.product_id}`)}
              className="cursor-pointer"
              rowKey="id"
            />
          )}
        </div>
      </Card>

      <StockAdjustForm 
        isOpen={isAdjustOpen} 
        onClose={() => setIsAdjustOpen(false)} 
        inventoryItem={adjustItem} 
      />
    </div>
  );
};

export default InventoryPage;
