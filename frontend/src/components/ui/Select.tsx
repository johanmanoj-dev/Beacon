import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options = [],
      placeholder,
      id,
      children,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-[#2B4257] tracking-wide uppercase"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-2xs">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'block w-full rounded-lg border text-sm transition-colors duration-150 appearance-none',
              'py-2.5 pl-3 pr-10 bg-white text-[#101E2B]',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
                : 'border-[#E5DFD3] focus:border-[#2B4257] focus:ring-[#E4ECF2]',
              disabled && 'bg-[#F5F0E6] text-[#7189A0] cursor-not-allowed border-[#E5DFD3]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#7189A0]">
            {error ? (
              <AlertCircle className="h-4 w-4 text-rose-500" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        {error ? (
          <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#5A6D80] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
