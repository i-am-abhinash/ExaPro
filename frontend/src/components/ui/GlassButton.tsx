import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal';
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
      'bg-aurora hover:bg-aurora-hover active:bg-aurora-active text-[#151C32] font-bold shadow-aurora-sm hover:shadow-aurora-md border border-white/35 transition-all duration-200 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.60)]',
    teal:
      'bg-teal hover:bg-teal-hover active:bg-teal-active text-[#0F241E] font-bold shadow-teal-sm hover:shadow-teal-md border border-white/35 transition-all duration-200 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.60)]',
    secondary:
      'glass-tile-interactive text-cool-primary border border-white/[0.14] hover:border-aurora/50 transition-all duration-200',
    outline:
      'bg-[rgba(32,42,74,0.40)] backdrop-blur-md hover:bg-[rgba(45,58,100,0.55)] text-cool-primary border border-white/[0.14] hover:border-aurora/40 transition-all duration-200',
    ghost:
      'bg-transparent hover:bg-white/[0.08] active:bg-white/[0.12] text-cool-muted hover:text-cool-primary border border-transparent transition-colors',
    danger:
      'bg-status-error-bg hover:bg-status-error-bg/80 active:bg-status-error-bg text-status-error border border-status-error-border transition-colors',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { y: -1.5, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={disabled || loading ? {} : { scale: 0.98, y: 0, transition: { duration: 0.12 } }}
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
