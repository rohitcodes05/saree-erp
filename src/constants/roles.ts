import type { UserRole, Permission, RolePermissions } from '@/types';

// ─── Role Display Labels ──────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:  'Super Admin',
  shop_manager: 'Shop Manager',
  cashier:      'Cashier',
  staff:        'Staff',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin:  'Full access to all shops, analytics, and system settings.',
  shop_manager: 'Manage an assigned shop: inventory, billing, staff, and reports.',
  cashier:      'Process sales, handle returns, and look up customers.',
  staff:        'Manage inventory and customer records.',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin:  'text-primary-400 bg-primary-500/10 border-primary-500/20',
  shop_manager: 'text-success-500 bg-success-500/10 border-success-500/20',
  cashier:      'text-warning-500 bg-warning-500/10 border-warning-500/20',
  staff:        'text-text-muted bg-surface-3 border-border',
};

// ─── Role Hierarchy (higher = more powerful) ──────────────────────────────────

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin:  4,
  shop_manager: 3,
  cashier:      2,
  staff:        1,
};

// ─── Role Permissions ─────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: RolePermissions = {
  super_admin: [
    'shop:view', 'shop:manage',
    'product:view', 'product:manage',
    'inventory:view', 'inventory:manage',
    'pos:access',
    'customer:view', 'customer:manage',
    'supplier:view', 'supplier:manage',
    'employee:view', 'employee:manage',
    'report:view', 'report:export',
    'settings:view', 'settings:manage',
    'audit:view',
  ],
  shop_manager: [
    'shop:view',
    'product:view', 'product:manage',
    'inventory:view', 'inventory:manage',
    'pos:access',
    'customer:view', 'customer:manage',
    'supplier:view',
    'employee:view', 'employee:manage',
    'report:view', 'report:export',
    'settings:view',
  ],
  cashier: [
    'product:view',
    'inventory:view',
    'pos:access',
    'customer:view', 'customer:manage',
    'report:view',
  ],
  staff: [
    'product:view',
    'inventory:view', 'inventory:manage',
    'customer:view', 'customer:manage',
  ],
};

// ─── Permission Check Utility ─────────────────────────────────────────────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

export function canAccessRole(currentRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[targetRole];
}

// ─── Default redirect per role ────────────────────────────────────────────────

export const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  super_admin:  '/dashboard',
  shop_manager: '/dashboard',
  cashier:      '/pos',
  staff:        '/inventory',
};
