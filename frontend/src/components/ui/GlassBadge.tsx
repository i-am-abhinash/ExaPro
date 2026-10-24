import React from 'react';

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'cobalt' | 'neutral' | 'amber' | 'rose' | 'warning' | 'success' | 'error' | 'electric' | 'aurora' | 'lavender' | 'teal' | 'violet' | 'ice' | 'pink';
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
    aurora: 'bg-[#9AABFF]/16 text-[#9AABFF] border border-[#9AABFF]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    electric: 'bg-[#9AABFF]/16 text-[#9AABFF] border border-[#9AABFF]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    cobalt: 'bg-[#9AABFF]/16 text-[#9AABFF] border border-[#9AABFF]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    ice: 'bg-[#A8DDF4]/16 text-[#A8DDF4] border border-[#A8DDF4]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    lavender: 'bg-[#C8B5FF]/16 text-[#C8B5FF] border border-[#C8B5FF]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    violet: 'bg-[#C8B5FF]/16 text-[#C8B5FF] border border-[#C8B5FF]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    pink: 'bg-[#F0BCE1]/16 text-[#F0BCE1] border border-[#F0BCE1]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    teal: 'bg-[#80DCC0]/16 text-[#80DCC0] border border-[#80DCC0]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm',
    lime: 'bg-status-success-bg text-status-success border border-status-success-border backdrop-blur-sm',
    success: 'bg-status-success-bg text-status-success border border-status-success-border backdrop-blur-sm',
    warning: 'bg-status-warning-bg text-status-warning border border-status-warning-border backdrop-blur-sm',
    amber: 'bg-status-warning-bg text-status-warning border border-status-warning-border backdrop-blur-sm',
    rose: 'bg-status-error-bg text-status-error border border-status-error-border backdrop-blur-sm',
    error: 'bg-status-error-bg text-status-error border border-status-error-border backdrop-blur-sm',
    neutral: 'bg-white/[0.08] text-cool-secondary border border-white/[0.12] backdrop-blur-sm',
  };

  const dotColorClasses: Record<string, string> = {
    aurora: 'bg-[#9AABFF]',
    electric: 'bg-[#9AABFF]',
    cobalt: 'bg-[#9AABFF]',
    ice: 'bg-[#A8DDF4]',
    lavender: 'bg-[#C8B5FF]',
    violet: 'bg-[#C8B5FF]',
    pink: 'bg-[#F0BCE1]',
    teal: 'bg-status-success',
    lime: 'bg-status-success',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    amber: 'bg-status-warning',
    rose: 'bg-status-error',
    error: 'bg-status-error',
    neutral: 'bg-cool-muted',
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
