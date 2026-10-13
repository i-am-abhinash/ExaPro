import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 font-semibold',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2 font-bold',
    lg: 'px-6 py-3.5 text-sm sm:text-base rounded-xl gap-2.5 font-bold',
  };

  const variantClasses = {
    primary:
      'bg-amber hover:bg-amber-hover active:bg-amber-active text-obsidian font-bold shadow-amber-sm hover:shadow-amber-md border border-amber/40 transition-all duration-200',
    secondary:
      'bg-obsidian-elevated hover:bg-obsidian-hover active:bg-obsidian text-cream-primary border border-white/[0.08] hover:border-white/[0.16] shadow-glass-sm transition-all duration-200',
    outline:
      'bg-obsidian-card/80 hover:bg-obsidian-elevated text-cream-primary border border-white/[0.08] hover:border-amber/40 shadow-glass-sm transition-all duration-200',
    ghost:
      'bg-transparent hover:bg-white/[0.06] active:bg-white/[0.09] text-cream-muted hover:text-cream-primary border border-transparent transition-colors',
    danger:
      'bg-status-error-bg hover:bg-status-error-bg/80 active:bg-status-error-bg text-status-error border border-status-error-border shadow-glass-sm transition-colors',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all select-none disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};
