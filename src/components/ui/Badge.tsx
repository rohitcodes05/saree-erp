import React from 'react';
import { cn } from '@/lib/utils';
import type { Variant, Size } from '@/types';

// ─── Badge Props ──────────────────────────────────────────────────────────────

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant | 'default';
  size?: Extract<Size, 'xs' | 'sm' | 'md'>;
  dot?: boolean;
  pulse?: boolean;
}

// ─── Variant Styles ───────────────────────────────────────────────────────────

const badgeVariants: Record<string, string> = {
  default:   'bg-surface-3 text-text-subtle border-border',
  primary:   'bg-primary/15 text-primary-300 border-primary/20',
  secondary: 'bg-surface-2 text-text-muted border-border',
  success:   'bg-success/15 text-success border-success/20',
  warning:   'bg-warning/15 text-warning border-warning/20',
  danger:    'bg-danger/15 text-danger border-danger/20',
  ghost:     'bg-transparent text-text-muted border-transparent',
  outline:   'bg-transparent text-primary border-primary/40',
};

const badgeSizes: Record<string, string> = {
  xs: 'h-4 px-1.5 text-[10px] gap-1',
  sm: 'h-5 px-2 text-xs gap-1',
  md: 'h-6 px-2.5 text-xs gap-1.5',
};

// ─── Badge Component ──────────────────────────────────────────────────────────

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center font-medium rounded-full border',
      'whitespace-nowrap select-none',
      badgeVariants[variant],
      badgeSizes[size],
      className
    )}
    {...props}
  >
    {dot && (
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full flex-shrink-0',
          pulse && 'animate-pulse',
          variant === 'success' && 'bg-success',
          variant === 'warning' && 'bg-warning',
          variant === 'danger' && 'bg-danger',
          variant === 'primary' && 'bg-primary',
          (variant === 'default' || variant === 'secondary') && 'bg-text-muted',
          variant === 'ghost' && 'bg-text-muted',
          variant === 'outline' && 'bg-primary',
        )}
      />
    )}
    {children}
  </span>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
// Convenience wrapper for common status patterns.

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { variant: string; label: string }> = {
  // Sale status
  completed:          { variant: 'success', label: 'Completed' },
  draft:              { variant: 'secondary', label: 'Draft' },
  cancelled:          { variant: 'danger', label: 'Cancelled' },
  returned:           { variant: 'warning', label: 'Returned' },
  partially_returned: { variant: 'warning', label: 'Partial Return' },
  // Stock status
  in_stock:           { variant: 'success', label: 'In Stock' },
  low_stock:          { variant: 'warning', label: 'Low Stock' },
  out_of_stock:       { variant: 'danger', label: 'Out of Stock' },
  // PO status
  sent:               { variant: 'primary', label: 'Sent' },
  received:           { variant: 'success', label: 'Received' },
  partially_received: { variant: 'warning', label: 'Partial' },
  // Generic
  active:             { variant: 'success', label: 'Active' },
  inactive:           { variant: 'default', label: 'Inactive' },
  pending:            { variant: 'warning', label: 'Pending' },
  paid:               { variant: 'success', label: 'Paid' },
  failed:             { variant: 'danger', label: 'Failed' },
  refunded:           { variant: 'warning', label: 'Refunded' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  const config = STATUS_MAP[status] ?? {
    variant: 'default',
    label: status.replace(/_/g, ' '),
  };

  return (
    <Badge
      variant={config.variant as Variant}
      dot
      className={className}
    >
      {config.label}
    </Badge>
  );
};
