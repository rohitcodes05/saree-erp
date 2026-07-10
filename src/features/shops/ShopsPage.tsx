import React, { useState, useMemo } from 'react';
import { Plus, Store, Search, Grid3x3, List, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, Badge, EmptyState, CardSkeleton, Input } from '@/components/ui';
import { useShops } from '@/hooks/useShops';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ShopCard from './ShopCard';
import ShopFormModal from './ShopFormModal';
import type { ShopWithStats } from '@/services/shops.service';
import type { Shop } from '@/types/database.types';

// ─── Shops Page ───────────────────────────────────────────────────────────────

const ShopsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { data: shops, isLoading } = useShops();

  const [formOpen, setFormOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtered list
  const filtered = useMemo(() => {
    return (shops ?? []).filter(shop => {
      const matchesSearch =
        shop.name.toLowerCase().includes(search.toLowerCase()) ||
        shop.code.toLowerCase().includes(search.toLowerCase()) ||
        (shop.city?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && shop.is_active) ||
        (filterStatus === 'inactive' && !shop.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [shops, search, filterStatus]);

  const activeCount = (shops ?? []).filter(s => s.is_active).length;

  const handleEdit = (shop: ShopWithStats) => {
    setEditingShop(shop as Shop);
    setFormOpen(true);
  };

  const handleView = (shop: ShopWithStats) => {
    window.location.href = `/shops/${shop.id}`;
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingShop(null);
  };

  return (
    <div className="page-container space-y-6 animate-fade-up">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Shops</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {shops?.length ?? 0} total · {activeCount} active
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { setEditingShop(null); setFormOpen(true); }}
          >
            Add Shop
          </Button>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shops…"
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-surface-2 text-sm text-text placeholder:text-text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex gap-1 p-1 bg-surface-2 border border-border rounded-xl">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors capitalize ${
                  filterStatus === s
                    ? 'bg-primary/15 text-primary-300'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 p-1 bg-surface-2 border border-border rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text'
              }`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Store className="h-8 w-8" />}
            title={search ? 'No shops match your search' : 'No shops yet'}
            description={
              search
                ? 'Try a different search term.'
                : isSuperAdmin
                ? 'Add your first shop to get started with the Saree ERP system.'
                : 'No shops have been assigned to you yet.'
            }
            action={
              isSuperAdmin && !search ? (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setFormOpen(true)}
                >
                  Add First Shop
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(shop => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onEdit={handleEdit}
              onView={handleView}
            />
          ))}
        </div>
      ) : (
        // List view
        <Card noPadding>
          <div className="divide-y divide-border">
            {filtered.map(shop => (
              <div
                key={shop.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2 cursor-pointer transition-colors"
                onClick={() => handleView(shop)}
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text truncate">{shop.name}</p>
                    <span className="text-xs text-text-muted">({shop.code})</span>
                    <Badge variant={shop.is_active ? 'success' : 'default'} size="xs" dot>
                      {shop.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {shop.address} · {shop.city}, {shop.state}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  {shop.phone && (
                    <p className="text-xs text-text-muted">{shop.phone}</p>
                  )}
                  {shop.manager_name && (
                    <p className="text-xs text-text-muted">{shop.manager_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(shop); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Form Modal ─────────────────────────────────────────────────────── */}
      <ShopFormModal
        isOpen={formOpen}
        onClose={handleCloseForm}
        shop={editingShop}
      />
    </div>
  );
};

export default ShopsPage;
