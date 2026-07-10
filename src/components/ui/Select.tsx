import React, { forwardRef, useRef, useState, useEffect, useCallback } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T = string> {
  options: SelectOption<T>[];
  value?: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

// ─── Select Component ─────────────────────────────────────────────────────────

export function Select<T = string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  error,
  hint,
  disabled = false,
  clearable = false,
  searchable = false,
  required = false,
  className,
  id,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value) ?? null;

  const filtered = searchable
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  const handleSelect = useCallback((opt: SelectOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  }, [onChange]);

  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger */}
        <button
          id={inputId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(v => !v)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          className={cn(
            'w-full h-9 flex items-center gap-2 px-3 rounded-xl border bg-surface-2',
            'text-sm text-left transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
            error
              ? 'border-danger focus-visible:border-danger'
              : isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-border-muted',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {selected?.icon && (
            <span className="flex-shrink-0 text-text-muted">{selected.icon}</span>
          )}
          <span className={cn('flex-1 truncate', !selected && 'text-text-muted/60')}>
            {selected ? selected.label : placeholder}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {clearable && selected && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="p-0.5 rounded text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-text-muted transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'absolute z-50 w-full mt-1',
                'bg-surface-1 border border-border rounded-xl shadow-surface-xl',
                'overflow-hidden'
              )}
            >
              {/* Search */}
              {searchable && (
                <div className="p-1.5 border-b border-border">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full h-7 pl-7 pr-2 text-xs bg-surface-2 rounded-lg border border-border outline-none focus:border-primary text-text placeholder:text-text-muted/60"
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <ul
                role="listbox"
                className="max-h-52 overflow-y-auto p-1"
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-text-muted text-center">
                    No results found
                  </li>
                ) : (
                  filtered.map(opt => {
                    const isSelected = opt.value === value;
                    return (
                      <li
                        key={String(opt.value)}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer',
                          'transition-colors duration-100',
                          opt.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary/15 text-primary-300'
                            : 'text-text hover:bg-surface-2'
                        )}
                      >
                        {opt.icon && (
                          <span className="flex-shrink-0 text-text-muted">{opt.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{opt.label}</p>
                          {opt.description && (
                            <p className="text-xs text-text-muted truncate">{opt.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger flex items-center gap-1">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
}

// ─── Multi-Select (simple) ────────────────────────────────────────────────────

export interface MultiSelectProps<T = string> extends Omit<SelectProps<T>, 'value' | 'onChange' | 'clearable'> {
  value: T[];
  onChange: (value: T[]) => void;
}

export function MultiSelect<T = string>({
  options,
  value = [],
  onChange,
  placeholder = 'Select…',
  label,
  error,
  disabled,
  className,
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (opt: SelectOption<T>) => {
    const exists = value.includes(opt.value);
    onChange(exists ? value.filter(v => v !== opt.value) : [...value, opt.value]);
  };

  const labels = value
    .map(v => options.find(o => o.value === v)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-text">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(v => !v)}
          className={cn(
            'w-full h-9 flex items-center gap-2 px-3 rounded-xl border bg-surface-2',
            'text-sm text-left transition-all duration-150',
            error ? 'border-danger' : isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={cn('flex-1 truncate', !labels && 'text-text-muted/60')}>
            {labels || placeholder}
          </span>
          {value.length > 0 && (
            <span className="flex-shrink-0 text-xs font-semibold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
              {value.length}
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', isOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 w-full mt-1 bg-surface-1 border border-border rounded-xl shadow-surface-xl overflow-hidden"
            >
              <ul className="max-h-52 overflow-y-auto p-1">
                {options.map(opt => {
                  const isSelected = value.includes(opt.value);
                  return (
                    <li
                      key={String(opt.value)}
                      onClick={() => toggle(opt)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/15 text-primary-300' : 'text-text hover:bg-surface-2'
                      )}
                    >
                      <div className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all',
                        isSelected ? 'bg-primary border-primary' : 'border-border bg-surface-2'
                      )}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      {opt.label}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
