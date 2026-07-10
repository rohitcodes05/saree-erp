import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Package,
  Layers,
  ShoppingCart,
  Users,
  Truck,
  UserCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Receipt,
  RotateCcw,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar } from '@/components/ui';
import type { NavItem } from '@/types';
import { ROLE_LABELS } from '@/constants/roles';

// ─── Navigation Config ────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['super_admin', 'shop_manager'],
  },
  {
    id: 'shops',
    label: 'Shops',
    icon: Store,
    href: '/shops',
    roles: ['super_admin'],
  },
  {
    id: 'pos',
    label: 'POS Billing',
    icon: ShoppingCart,
    href: '/pos',
    roles: ['super_admin', 'shop_manager', 'cashier'],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    href: '/products',
    roles: ['super_admin', 'shop_manager', 'staff', 'cashier'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Layers,
    href: '/inventory',
    roles: ['super_admin', 'shop_manager', 'staff', 'cashier'],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    href: '/customers',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    href: '/suppliers',
    roles: ['super_admin', 'shop_manager'],
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: UserCheck,
    href: '/employees',
    roles: ['super_admin', 'shop_manager'],
  },
  {
    id: 'sales',
    label: 'Sales History',
    icon: ScrollText,
    href: '/sales',
    roles: ['super_admin', 'shop_manager', 'cashier'],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    href: '/expenses',
    roles: ['super_admin', 'shop_manager', 'cashier'],
  },
  {
    id: 'returns',
    label: 'Returns',
    icon: RotateCcw,
    href: '/returns',
    roles: ['super_admin', 'shop_manager', 'cashier'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    href: '/reports',
    roles: ['super_admin', 'shop_manager'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    roles: ['super_admin', 'shop_manager'],
  },
];

// ─── Nav Link Item ────────────────────────────────────────────────────────────

interface NavLinkItemProps {
  item: NavItem;
  collapsed: boolean;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ item, collapsed }) => {
  const location = useLocation();
  const isActive =
    item.href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.href);

  return (
    <NavLink
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
        'transition-all duration-150',
        isActive
          ? 'bg-primary/15 text-primary-300 shadow-glow-sm'
          : 'text-text-muted hover:text-text hover:bg-surface-2'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="nav-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
        />
      )}

      {/* Icon */}
      <item.icon
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-transform duration-150',
          isActive ? 'text-primary' : 'text-text-muted group-hover:text-text',
          !collapsed && 'group-hover:scale-110'
        )}
      />

      {/* Label */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      {item.badge && !collapsed && (
        <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </NavLink>
  );
};

// ─── Sidebar Component ────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    item => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'relative flex flex-col flex-shrink-0 h-full',
        'bg-surface-1 border-r border-border',
        'overflow-hidden select-none'
      )}
    >
      {/* ── Logo / Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center h-16 px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-semibold text-text leading-tight whitespace-nowrap">
                  Saree ERP
                </p>
                <p className="text-[10px] text-text-muted leading-tight whitespace-nowrap">
                  {user?.company?.name ?? 'Management'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className={cn(
            'ml-auto flex-shrink-0 p-1 rounded-lg text-text-muted',
            'hover:text-text hover:bg-surface-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5">
        {visibleItems.map(item => (
          <NavLinkItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── User Profile ──────────────────────────────────────────────────── */}
      <div className="border-t border-border p-2 relative">
        <button
          onClick={() => setShowUserMenu(v => !v)}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-xl',
            'text-left text-sm hover:bg-surface-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
          )}
        >
          <Avatar
            src={user?.profile.avatar_url}
            name={`${user?.profile.first_name} ${user?.profile.last_name ?? ''}`.trim()}
            size="sm"
            className="flex-shrink-0"
          />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-xs font-medium text-text truncate leading-tight">
                  {user?.profile.first_name} {user?.profile.last_name}
                </p>
                <p className="text-[10px] text-text-muted truncate leading-tight">
                  {role ? ROLE_LABELS[role] : ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-text-muted flex-shrink-0 transition-transform',
                showUserMenu && 'rotate-180'
              )}
            />
          )}
        </button>

        {/* User Menu Dropdown */}
        <AnimatePresence>
          {showUserMenu && !collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-2 right-2 mb-1 bg-surface-2 border border-border rounded-xl p-1 shadow-surface-lg z-50"
            >
              <a
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-3 rounded-lg transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </a>
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
              >
                <span className="text-[13px]">↩</span>
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
