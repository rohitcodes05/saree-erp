import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Spinner';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sticky?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  // Sorting
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  // Row actions
  onRowClick?: (row: T) => void;
  // Styling
  className?: string;
  compact?: boolean;
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ direction: SortDirection }> = ({ direction }) => {
  if (direction === 'asc')  return <ChevronUp className="h-3 w-3" />;
  if (direction === 'desc') return <ChevronDown className="h-3 w-3" />;
  return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
};

// ─── Table Component ──────────────────────────────────────────────────────────

export function Table<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  sortColumn,
  sortDirection,
  onSort,
  pagination,
  onRowClick,
  className,
  compact = false,
}: TableProps<T>) {

  const getKey = useCallback((row: T, i: number): string => {
    if (typeof rowKey === 'function') return rowKey(row);
    return String(row[rowKey] ?? i);
  }, [rowKey]);

  const handleSort = useCallback((col: TableColumn<T>) => {
    if (!col.sortable || !onSort) return;
    let next: SortDirection = 'asc';
    if (sortColumn === col.key) {
      next = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc';
    }
    onSort(col.key, next);
  }, [onSort, sortColumn, sortDirection]);

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Table */}
      <div className="table-container">
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  className={cn(
                    headPadding,
                    'text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap select-none',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer hover:text-text transition-colors',
                    col.sticky && 'sticky left-0 bg-surface-2 z-10'
                  )}
                  onClick={() => handleSort(col)}
                >
                  <div className={cn(
                    'flex items-center gap-1',
                    col.align === 'center' && 'justify-center',
                    col.align === 'right' && 'justify-end',
                  )}>
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={sortColumn === col.key ? sortDirection ?? null : null} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map(col => (
                    <td key={col.key} className={cellPadding}>
                      <Skeleton height={14} className={cn(
                        col.align === 'right' && 'ml-auto',
                        col.align === 'center' && 'mx-auto',
                      )} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    {emptyIcon && (
                      <div className="text-surface-4">{emptyIcon}</div>
                    )}
                    <p className="text-sm text-text-muted">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={getKey(row, i)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    onRowClick
                      ? 'cursor-pointer hover:bg-surface-2'
                      : 'hover:bg-surface-2/50'
                  )}
                >
                  {columns.map(col => {
                    const value = col.key.includes('.')
                      ? col.key.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], row)
                      : row[col.key];

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          cellPadding, 'text-text',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.sticky && 'sticky left-0 bg-surface-1 z-10',
                        )}
                      >
                        {col.render ? col.render(value, row, i) : String(value ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <TablePagination {...pagination} />
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50, 100];

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = useMemo(() => {
    const p: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) p.push(i);
    } else {
      p.push(1);
      if (page > 3) p.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) p.push(i);
      if (page < totalPages - 2) p.push('...');
      p.push(totalPages);
    }
    return p;
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <p className="text-xs text-text-muted">
          {from}–{to} of {total.toLocaleString('en-IN')}
        </p>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="h-7 px-2 text-xs rounded-lg border border-border bg-surface-2 text-text outline-none focus:border-primary"
          >
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1.5 text-text-muted text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'h-7 min-w-[28px] px-2 text-xs rounded-lg transition-colors font-medium',
                p === page
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
