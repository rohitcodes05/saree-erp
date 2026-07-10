import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { Variant, Size } from '@/types';

// ─── Button Props ─────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Variant Styles ───────────────────────────────────────────────────────────

const variantStyles: Record<Variant, string> = {
  default:   'bg-surface-3 text-text hover:bg-surface-4 border border-border',
  primary:   'bg-primary text-white hover:bg-primary-600 shadow-glow-sm hover:shadow-glow',
  secondary: 'bg-surface-2 text-text hover:bg-surface-3 border border-border',
  success:   'bg-success text-white hover:bg-success-600',
  warning:   'bg-warning text-white hover:bg-warning-600',
  danger:    'bg-danger text-white hover:bg-danger-600',
  ghost:     'text-text hover:bg-surface-2 hover:text-text',
  outline:   'border border-primary text-primary hover:bg-primary/10',
};

const sizeStyles: Record<Size, string> = {
  xs: 'h-6 px-2 text-xs gap-1 rounded-lg',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-9 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-base gap-2 rounded-xl',
  xl: 'h-12 px-6 text-base gap-2.5 rounded-2xl',
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

const ButtonSpinner: React.FC = () => (
  <svg
    className="animate-spin h-4 w-4 flex-shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ─── Button Component ─────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'active:scale-[0.97]',
          'select-none cursor-pointer',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {loading ? (
          <ButtonSpinner />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
