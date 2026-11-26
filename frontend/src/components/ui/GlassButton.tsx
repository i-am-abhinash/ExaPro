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
    primary: 'midnight-glass-primary',
    teal: 'midnight-glass-teal',
    secondary: '',
    outline: '',
    ghost: 'midnight-glass-ghost',
    danger: 'midnight-glass-danger',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { y: -1.5, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={disabled || loading ? {} : { scale: 0.98, y: 0, transition: { duration: 0.12 } }}
      disabled={disabled || loading}
      className={`midnight-glass-button inline-flex items-center justify-center select-none disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
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
