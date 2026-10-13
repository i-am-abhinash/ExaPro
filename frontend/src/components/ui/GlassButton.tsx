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
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2 font-semibold',
    lg: 'px-6 py-3.5 text-sm sm:text-base rounded-xl gap-2.5 font-bold',
  };

  const variantClasses = {
    primary:
      'bg-cobalt hover:bg-cobalt-hover active:bg-cobalt-active text-white shadow-cobalt-sm hover:shadow-cobalt-md border border-cobalt/30 transition-all duration-200',
    secondary:
      'bg-white hover:bg-ivory-50 active:bg-ivory-100 text-graphite border border-black/[0.09] hover:border-black/[0.16] shadow-glass-sm transition-all duration-200',
    outline:
      'bg-white/70 hover:bg-white text-graphite border border-black/[0.08] hover:border-black/[0.14] shadow-glass-sm transition-all duration-200',
    ghost:
      'bg-transparent hover:bg-black/[0.05] active:bg-black/[0.08] text-slate-muted hover:text-graphite border border-transparent transition-colors',
    danger:
      'bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200/80 shadow-glass-sm transition-colors',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all select-none disabled:opacity-45 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
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
