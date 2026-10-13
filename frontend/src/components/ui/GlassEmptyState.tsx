import React from 'react';
import { GlassButton } from './GlassButton';

interface GlassEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
}

export const GlassEmptyState: React.FC<GlassEmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  actionIcon,
  onAction,
  className = '',
}) => {
  return (
    <div className={`py-16 px-6 text-center space-y-4 max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-slate-400 shadow-glass-sm">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <GlassButton
            variant="primary"
            size="sm"
            icon={actionIcon}
            onClick={onAction}
          >
            {actionText}
          </GlassButton>
        </div>
      )}
    </div>
  );
};
