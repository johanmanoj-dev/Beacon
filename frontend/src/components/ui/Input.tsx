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
            className="block text-xs font-semibold text-[#2B4257] tracking-wide uppercase"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7189A0]">
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
              'py-2.5 px-3 bg-white text-[#101E2B] placeholder:text-[#889AA9]',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon && 'pl-10',
              (rightIcon || error) && 'pr-10',
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
                : 'border-[#E5DFD3] focus:border-[#2B4257] focus:ring-[#E4ECF2]',
              disabled && 'bg-[#F5F0E6] text-[#7189A0] cursor-not-allowed border-[#E5DFD3]',
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
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7189A0]">
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
          <p className="text-xs text-[#5A6D80] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
