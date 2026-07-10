import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Store, MapPin, Phone, Mail, Clock, Settings,
  ArrowLeft, Edit2, Power, TrendingUp,
  Package, IndianRupee, ShoppingCart,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Card, CardHeader, Button, Badge, Avatar, Skeleton,
  Tabs, TabList, TabTrigger, TabPanel, MetricCard,
} from '@/components/ui';
import { useShop, useShopRevenue, useToggleShopStatus } from '@/hooks/useShops';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ShopFormModal from './ShopFormModal';
import { formatTime, formatDate } from '@/lib/utils';
import { formatCurrency, formatCurrencyCompact } from '@/constants/gst';
import type { Shop } from '@/types/database.types';

// ─── Shop Detail Page ─────────────────────────────────────────────────────────

const ShopDetailPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const { data: shop, isLoading } = useShop(shopId);
  const { data: todayRevenue } = useShopRevenue(shopId, 'today');
  const { data: monthRevenue } = useShopRevenue(shopId, 'month');
  const { mutate: toggleStatus } = useToggleShopStatus();

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="page-container space-y-6 animate-fade-up">
        <Skeleton height={32} className="w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><Skeleton height={60} /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="page-container">
        <Card className="flex flex-col items-center justify-center py-16">
          <h2 className="text-lg font-semibold text-text">Shop not found</h2>
          <Button variant="ghost" onClick={() => navigate('/shops')} className="mt-4">
            ← Back to Shops
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-up">
      {/* ── Back + Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/shops')}
          className="p-1.5 mt-0.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text">{shop.name}</h1>
            <Badge
              variant={shop.is_active ? 'success' : 'default'}
              dot
            >
              {shop.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="secondary" size="sm">{shop.code}</Badge>
          </div>
          <p className="text-sm text-text-muted mt-0.5">
            <MapPin className="inline h-3.5 w-3.5 mr-1" />
            {shop.address}, {shop.city}, {shop.state}
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Power className="h-4 w-4" />}
              onClick={() => toggleStatus({ shopId: shop.id, isActive: !shop.is_active })}
              className={shop.is_active ? 'text-danger' : 'text-success'}
            >
              {shop.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="h-4 w-4" />}
              onClick={() => setEditOpen(true)}
            >
              Edit Shop
            </Button>
          </div>
        )}
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Today's Revenue"
          value={formatCurrencyCompact(todayRevenue?.revenue ?? 0)}
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          label="Today's Sales"
          value={todayRevenue?.count ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconColor="text-success bg-success/10"
        />
        <MetricCard
          label="This Month"
          value={formatCurrencyCompact(monthRevenue?.revenue ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-warning bg-warning/10"
        />
        <MetricCard
          label="Avg. Bill Value"
          value={formatCurrencyCompact(todayRevenue?.avg ?? 0)}
          icon={<Package className="h-5 w-5" />}
          iconColor="text-info-500 bg-info/10"
        />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs defaultTab="info">
        <TabList className="mb-5">
          <TabTrigger id="info" icon={<Store className="h-3.5 w-3.5" />}>
            Shop Info
          </TabTrigger>
          <TabTrigger id="staff" icon={<Avatar size="xs" name="S" className="h-3.5 w-3.5 text-[8px]" />}>
            Staff
          </TabTrigger>
          <TabTrigger id="settings" icon={<Settings className="h-3.5 w-3.5" />}>
            Settings
          </TabTrigger>
        </TabList>

        {/* Info Tab */}
        <TabPanel id="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact Info */}
            <Card>
              <CardHeader title="Contact Information" />
              <div className="space-y-3">
                {[
                  { icon: Phone, label: 'Phone', value: shop.phone },
                  { icon: Mail, label: 'Email', value: shop.email },
                  { icon: MapPin, label: 'Address', value: `${shop.address}, ${shop.city}, ${shop.state} ${shop.pincode ?? ''}` },
                ].map(({ icon: Icon, label, value }) => (
                  value && (
                    <div key={label} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">{label}</p>
                        <p className="text-sm text-text">{value}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </Card>

            {/* Shop Details */}
            <Card>
              <CardHeader title="Shop Details" />
              <div className="space-y-3">
                {[
                  { label: 'GST Number', value: shop.gst_number },
                  { label: 'Opening Time', value: formatTime(shop.opening_time) },
                  { label: 'Closing Time', value: formatTime(shop.closing_time) },
                  { label: 'Created On', value: formatDate(shop.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1">
                    <p className="text-sm text-text-muted">{label}</p>
                    <p className="text-sm font-medium text-text">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabPanel>

        {/* Staff Tab */}
        <TabPanel id="staff">
          <Card>
            <CardHeader title="Shop Staff" subtitle="All staff assigned to this shop" />
            <p className="text-sm text-text-muted">
              Staff management is available in Phase 8. Assign staff via User Management in Settings.
            </p>
          </Card>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel id="settings">
          <Card>
            <CardHeader title="Shop Settings" subtitle="Billing, loyalty, and receipt settings" />
            <p className="text-sm text-text-muted">
              Detailed shop settings are available in Phase 10.
            </p>
          </Card>
        </TabPanel>
      </Tabs>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <ShopFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        shop={shop as Shop}
      />
    </div>
  );
};

export default ShopDetailPage;
