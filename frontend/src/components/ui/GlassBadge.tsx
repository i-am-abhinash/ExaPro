import React from 'react';

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'cobalt' | 'neutral' | 'amber' | 'rose';
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

  const variantClasses = {
    lime: 'bg-lime-light text-lime-dark border border-lime/40',
    cobalt: 'bg-cobalt-light text-cobalt border border-cobalt/20',
    neutral: 'bg-black/[0.04] text-graphite-800 border border-black/[0.07]',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    rose: 'bg-rose-50 text-rose-800 border border-rose-200/80',
  };

  const dotColorClasses = {
    lime: 'bg-lime-dark',
    cobalt: 'bg-cobalt',
    neutral: 'bg-slate-400',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full select-none tracking-tight shadow-sm ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColorClasses[variant]} ${pulse ? 'animate-pulse' : ''}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
