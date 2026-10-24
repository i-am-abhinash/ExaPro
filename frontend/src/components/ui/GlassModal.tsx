import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Frosted Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#151C32]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={`relative w-full ${maxWidthClasses[maxWidth]} rounded-3xl bg-[rgba(29,35,64,0.85)] backdrop-blur-2xl border border-white/[0.18] p-6 sm:p-8 shadow-glass-xl z-10 space-y-6 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.30)]`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                {title && <h3 className="text-lg font-bold text-cool-primary tracking-tight">{title}</h3>}
                {description && <p className="text-xs text-cool-muted leading-relaxed">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-cool-muted hover:text-cool-primary hover:bg-white/[0.08] transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">{children}</div>

            {/* Footer */}
            {footer && <div className="pt-4 border-t border-white/[0.10]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
