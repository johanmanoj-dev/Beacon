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
    success: 'bg-[#EBF5EE] text-[#1E5638] border-[#BDE3CA]',
    warning: 'bg-[#FEF7EA] text-[#8C4800] border-[#FBDCA3]',
    danger: 'bg-[#FDECEE] text-[#93152A] border-[#F8BFC7]',
    info: 'bg-[#E9EFF5] text-[#2B4257] border-[#C8D7E5]',
    neutral: 'bg-[#F5F0E6] text-[#4A5D6E] border-[#E5DFD3]',
    purple: 'bg-[#F3EFF8] text-[#553C7B] border-[#D9CEE8]',
  };

  const dots = {
    success: 'bg-[#2D6A4F]',
    warning: 'bg-[#B45309]',
    danger: 'bg-[#9F1239]',
    info: 'bg-[#2B4257]',
    neutral: 'bg-[#889AA9]',
    purple: 'bg-[#6B4E8F]',
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
