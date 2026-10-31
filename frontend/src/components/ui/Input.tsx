import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              'block w-full rounded-lg border text-sm transition-colors duration-150',
              'py-2.5 px-3 bg-white text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon && 'pl-10',
              (rightIcon || error) && 'pr-10',
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100',
              disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
              className
            )}
            {...props}
          />

          {error ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-rose-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          ) : (
            rightIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                {rightIcon}
              </div>
            )
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
