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
      'bg-aurora hover:bg-aurora-hover active:bg-aurora-active text-[#090D16] font-extrabold shadow-aurora-sm hover:shadow-aurora-md border border-aurora/40 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
    secondary:
      'glass-tile-interactive text-cool-primary border border-white/[0.12] hover:border-aurora/40 transition-all duration-200',
    outline:
      'bg-[rgba(28,38,60,0.48)] backdrop-blur-md hover:bg-[rgba(39,51,78,0.65)] text-cool-primary border border-white/[0.10] hover:border-aurora/40 transition-all duration-200',
    ghost:
      'bg-transparent hover:bg-white/[0.08] active:bg-white/[0.12] text-cool-muted hover:text-cool-primary border border-transparent transition-colors',
    danger:
      'bg-status-error-bg hover:bg-status-error-bg/80 active:bg-status-error-bg text-status-error border border-status-error-border transition-colors',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { y: -1.5, transition: { duration: 0.15 } }}
      whileTap={disabled || loading ? {} : { scale: 0.97, y: 1 }}
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
