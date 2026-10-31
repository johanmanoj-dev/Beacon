import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = 'neutral',
  size = 'md',
  withDot = false,
  ...props
}) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };

  const dots = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shadow-2xs select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {withDot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dots[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
