import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-[#E5DFD3] bg-[#FAF7F0]/50 ${className}`}
    >
      <div className="h-12 w-12 rounded-2xl bg-white border border-[#E5DFD3] shadow-xs flex items-center justify-center text-[#2B4257] mb-4 transition-transform hover:scale-105">
        <Icon className="h-6 w-6 text-[#2B4257]" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-[#101E2B] tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-[#5A6D80] max-w-md leading-relaxed mb-5">
        {description}
      </p>
      {actionText && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          leftIcon={actionIcon}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};