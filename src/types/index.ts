// Re-export everything from sub-modules for clean imports
export * from './database.types';
export * from './auth';

// ─── Common UI Types ──────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light' | 'system';

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type Variant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'outline';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  children?: NavItem[];
  roles?: import('./database.types').UserRole[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  prefix?: string;
  suffix?: string;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export interface WhatsAppConfig {
  // Phase 1: wa.me link generation
  mode: 'link' | 'api';
  phone: string;
  // Phase 2+: Official API (pluggable)
  apiUrl?: string;
  apiToken?: string;
  templateIds?: Record<string, string>;
}
