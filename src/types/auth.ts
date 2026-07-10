import type { Profile, Shop, UserRole, Company } from './database.types';

// ─── Auth Session ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  company: Company | null;
  assignedShops: Shop[];
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

// ─── Role Permissions ─────────────────────────────────────────────────────────

export type Permission =
  | 'shop:view'
  | 'shop:manage'
  | 'product:view'
  | 'product:manage'
  | 'inventory:view'
  | 'inventory:manage'
  | 'pos:access'
  | 'customer:view'
  | 'customer:manage'
  | 'supplier:view'
  | 'supplier:manage'
  | 'employee:view'
  | 'employee:manage'
  | 'report:view'
  | 'report:export'
  | 'settings:view'
  | 'settings:manage'
  | 'audit:view';

export type RolePermissions = Record<UserRole, Permission[]>;

// ─── Route Guard ──────────────────────────────────────────────────────────────

export interface RouteGuardProps {
  roles?: UserRole[];
  permissions?: Permission[];
  redirectTo?: string;
  children: React.ReactNode;
}
