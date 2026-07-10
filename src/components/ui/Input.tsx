import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Input Props ──────────────────────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputClassName?: string;
  wrapperClassName?: string;
}

// ─── Input Component ──────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputClassName,
      wrapperClassName,
      className,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const effectiveType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text leading-none"
          >
            {label}
            {props.required && (
              <span className="text-danger ml-1" aria-hidden>*</span>
            )}
          </label>
        )}

        {/* Input Wrapper */}
        <div className={cn('relative flex items-center', wrapperClassName)}>
          {/* Left Icon */}
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-text-muted pointer-events-none">
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              // Base
              'w-full h-9 rounded-xl border bg-surface-2 px-3 text-sm text-text',
              'placeholder:text-text-muted/60',
              'transition-all duration-150',
              // Border
              'border-border',
              // Focus
              'outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              // Error state
              error && 'border-danger focus:border-danger focus:ring-danger/20',
              // Disabled state
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Icon padding
              leftIcon && 'pl-9',
              (rightIcon || isPassword) && 'pr-9',
              inputClassName
            )}
            {...props}
          />

          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 flex items-center text-text-muted hover:text-text transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Right Icon (non-password) */}
          {rightIcon && !isPassword && (
            <span className="absolute right-3 flex items-center text-text-muted pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1 text-xs text-danger"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Hint */}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          className={cn(
            'w-full min-h-[80px] rounded-xl border bg-surface-2 px-3 py-2',
            'text-sm text-text placeholder:text-text-muted/60',
            'border-border outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'transition-all duration-150 resize-none',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          {...props}
        />
        {error && (
          <p role="alert" className="flex items-center gap-1 text-xs text-danger">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
