import React, { useState } from 'react';
import {
  Store, MapPin, Phone, Mail, Clock, Users, TrendingUp,
  MoreVertical, Edit2, Power, ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Badge, Avatar } from '@/components/ui';
import { useToggleShopStatus } from '@/hooks/useShops';
import { formatTime } from '@/lib/utils';
import { formatCurrencyCompact } from '@/constants/gst';
import type { ShopWithStats } from '@/services/shops.service';
import { cn } from '@/lib/utils';

// ─── Shop Card ────────────────────────────────────────────────────────────────

interface ShopCardProps {
  shop: ShopWithStats;
  onEdit: (shop: ShopWithStats) => void;
  onView: (shop: ShopWithStats) => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onEdit, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { mutate: toggleStatus, isPending } = useToggleShopStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        hover
        className="group relative overflow-hidden"
        onClick={() => onView(shop)}
      >
        {/* Top accent bar */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-0.5',
            shop.is_active ? 'bg-primary' : 'bg-surface-4'
          )}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Shop icon or logo */}
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <Store className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-text leading-tight">{shop.name}</h3>
              <p className="text-xs text-text-muted">{shop.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={shop.is_active ? 'success' : 'default'}
              dot
              size="xs"
            >
              {shop.is_active ? 'Active' : 'Inactive'}
            </Badge>

            {/* Action menu */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-3 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-surface-1 border border-border rounded-xl shadow-surface-xl z-50 p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(shop);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Shop
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        toggleStatus({ shopId: shop.id, isActive: !shop.is_active });
                      }}
                      disabled={isPending}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                        shop.is_active
                          ? 'text-danger hover:bg-danger/10'
                          : 'text-success hover:bg-success/10'
                      )}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {shop.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{shop.city}, {shop.state}</span>
          </div>
          {shop.phone && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{shop.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{formatTime(shop.opening_time)} – {formatTime(shop.closing_time)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          {shop.manager_name ? (
            <div className="flex items-center gap-2">
              <Avatar name={shop.manager_name} size="xs" />
              <span className="text-xs text-text-muted">{shop.manager_name}</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted italic">No manager</span>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onView(shop); }}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-400 transition-colors"
          >
            View
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ShopCard;
