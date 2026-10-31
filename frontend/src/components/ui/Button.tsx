import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-[#2B4257] text-[#FAF7F0] hover:bg-[#1D2D3D] shadow-sm hover:shadow focus:ring-[#526C84] border border-transparent',
      secondary:
        'bg-[#F5F0E6] text-[#2B4257] hover:bg-[#EAE3D6] focus:ring-[#526C84] border border-[#E5DFD3]',
      outline:
        'bg-white text-[#2B4257] hover:bg-[#FAF7F0] border border-[#E5DFD3] focus:ring-[#526C84] shadow-2xs',
      ghost:
        'bg-transparent text-[#526C84] hover:bg-[#F5F0E6] hover:text-[#101E2B] focus:ring-[#526C84]',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500 border border-transparent',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus:ring-emerald-500 border border-transparent',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5 h-8',
      md: 'text-sm px-4 py-2 rounded-lg gap-2 h-10',
      lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5 h-12',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
