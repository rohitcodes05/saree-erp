import React from 'react';
import { cn } from '@/lib/utils';

// ─── Spinner ──────────────────────────────────────────────────────────────────

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const spinnerSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading…',
}) => (
  <div
    role="status"
    aria-label={label}
    className={cn('inline-flex items-center justify-center', className)}
  >
    <svg
      className={cn('animate-spin text-primary', spinnerSizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <span className="sr-only">{label}</span>
  </div>
);

// ─── Full-Page Loader ─────────────────────────────────────────────────────────

export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading…',
}) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
    <div className="flex items-center gap-3">
      {/* Logo mark */}
      <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
        <span className="text-white font-bold text-lg">S</span>
      </div>
      <span className="text-lg font-semibold text-text">Saree ERP</span>
    </div>
    <Spinner size="lg" label={message} />
    <p className="text-sm text-text-muted">{message}</p>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = false,
  lines = 1,
  className,
  style,
  ...props
}) => {
  if (lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse bg-surface-3 rounded-lg',
              i === lines - 1 && 'w-3/4' // Last line shorter
            )}
            style={{ height: height ?? 16 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-surface-3',
        rounded ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={{ width, height: height ?? 16, ...style }}
      {...props}
    />
  );
};

// ─── Card Skeleton ────────────────────────────────────────────────────────────

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'rounded-2xl border border-border bg-surface-1 p-5 space-y-3',
      className
    )}
  >
    <div className="flex items-center gap-3">
      <Skeleton width={36} height={36} rounded className="flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} className="w-1/3" />
        <Skeleton height={12} className="w-1/2" />
      </div>
    </div>
    <Skeleton height={24} className="w-2/3" />
    <Skeleton height={12} className="w-1/4" />
  </div>
);
