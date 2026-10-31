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
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow focus:ring-blue-500 border border-transparent',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 border border-slate-200',
      outline:
        'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 focus:ring-blue-500 shadow-2xs',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
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
