import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#101E2B]/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => closeOnBackdrop && onClose()}
        aria-hidden="true"
      />

      {/* Dialog Card */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white shadow-2xl border border-[#E5DFD3] overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]',
          'animate-in zoom-in-95 duration-150 ease-out',
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-4 border-b border-[#F0EAE1] flex items-start justify-between gap-4 bg-[#FAF7F0]">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-[#101E2B] leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-[#5A6D80] mt-1">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#7189A0] hover:text-[#101E2B] rounded-lg p-1 hover:bg-[#F5F0E6] transition-colors shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#F0EAE1] bg-[#FAF7F0] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
