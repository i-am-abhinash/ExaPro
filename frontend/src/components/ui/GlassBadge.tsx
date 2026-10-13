import React from 'react';

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'cobalt' | 'neutral' | 'amber' | 'rose' | 'warning' | 'success' | 'error';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px] gap-1.5 font-medium',
    md: 'px-3 py-1 text-xs gap-2 font-medium',
  };

  const variantClasses: Record<string, string> = {
    lime: 'bg-status-success-bg text-status-success border border-status-success-border',
    success: 'bg-status-success-bg text-status-success border border-status-success-border',
    amber: 'bg-amber/10 text-amber border border-amber/30',
    cobalt: 'bg-amber/15 text-amber border border-amber/30',
    neutral: 'bg-white/[0.06] text-cream-secondary border border-white/[0.08]',
    warning: 'bg-status-warning-bg text-status-warning border border-status-warning-border',
    rose: 'bg-status-error-bg text-status-error border border-status-error-border',
    error: 'bg-status-error-bg text-status-error border border-status-error-border',
  };

  const dotColorClasses: Record<string, string> = {
    lime: 'bg-status-success',
    success: 'bg-status-success',
    amber: 'bg-amber',
    cobalt: 'bg-amber',
    neutral: 'bg-cream-muted',
    warning: 'bg-status-warning',
    rose: 'bg-status-error',
    error: 'bg-status-error',
  };

  const resolvedVariantClass = variantClasses[variant] || variantClasses.neutral;
  const resolvedDotClass = dotColorClasses[variant] || dotColorClasses.neutral;

  return (
    <span
      className={`inline-flex items-center rounded-full select-none tracking-tight shadow-sm ${sizeClasses[size]} ${resolvedVariantClass} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${resolvedDotClass} ${pulse ? 'animate-pulse' : ''}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
