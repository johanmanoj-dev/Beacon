import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  hoverable?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-[#2B4257] bg-[#E9EFF5]',
  badge,
  badgeColor = 'text-[#101E2B] bg-[#F5F0E6]',
  hoverable = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E5DFD3] bg-white text-[#101E2B] p-5 sm:p-6 shadow-2xs transition-all duration-200 min-w-0 flex flex-col justify-between',
        hoverable && 'hover:shadow-md hover:border-[#CBD7E2] hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 min-w-0">
        <span
          className="text-[11px] font-bold text-[#5A6D80] uppercase tracking-wider truncate"
          title={label}
        >
          {label}
        </span>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl shrink-0 flex items-center justify-center', iconColor)}>
            {typeof Icon === 'function' ? (
              <Icon className="h-4 w-4" />
            ) : (
              (Icon as React.ReactNode)
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#101E2B] tracking-tight font-mono truncate">
          {value}
        </div>
        {(sub || badge) && (
          <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
            {sub && (
              <span className="text-[#7189A0] font-medium truncate" title={sub}>
                {sub}
              </span>
            )}
            {badge && (
              <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0', badgeColor)}>
                {badge}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
