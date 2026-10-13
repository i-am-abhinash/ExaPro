import React from 'react';

interface GlassSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'table-row';
  count?: number;
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({
  className = '',
  variant = 'text',
  count = 1,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'w-10 h-10 rounded-full';
      case 'card':
        return 'h-36 w-full rounded-2xl';
      case 'table-row':
        return 'h-12 w-full rounded-xl';
      case 'text':
      default:
        return 'h-4 w-full rounded-lg';
    }
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="space-y-3 w-full animate-pulse">
      {items.map((key) => (
        <div
          key={key}
          className={`relative overflow-hidden bg-white/[0.04] border border-white/[0.04] ${getVariantClasses()} ${className}`}
        >
          {/* Subtle dark shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer" />
        </div>
      ))}
    </div>
  );
};
