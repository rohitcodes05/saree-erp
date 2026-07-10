import React from 'react';
import { cn } from '@/lib/utils';

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  hover = false,
  glass = false,
  noPadding = false,
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'rounded-2xl border border-border',
      glass
        ? 'bg-surface-1/60 backdrop-blur-xl'
        : 'bg-surface-1',
      !noPadding && 'p-5',
      hover && [
        'cursor-pointer transition-all duration-200',
        'hover:border-border-muted hover:bg-surface-2',
        'hover:-translate-y-0.5 hover:shadow-surface-md',
      ],
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// ─── Card Header ─────────────────────────────────────────────────────────────

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-start justify-between gap-4 mb-4',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-text leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ─── Metric Card ─────────────────────────────────────────────────────────────

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeLabel,
  icon,
  iconColor = 'text-primary bg-primary/10',
  className,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className={cn('group', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-muted font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-text mt-1 tabular-nums">
            {value}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                'text-xs mt-1 font-medium',
                isPositive && 'text-success',
                isNegative && 'text-danger',
                !isPositive && !isNegative && 'text-text-muted'
              )}
            >
              {isPositive && '+'}
              {change.toFixed(1)}%
              {changeLabel && (
                <span className="text-text-muted font-normal ml-1">
                  {changeLabel}
                </span>
              )}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              'flex items-center justify-center h-11 w-11 rounded-xl flex-shrink-0 ml-3',
              iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Divider ─────────────────────────────────────────────────────────────────

export const Divider: React.FC<{ className?: string }> = ({ className }) => (
  <hr className={cn('border-border my-4', className)} />
);
