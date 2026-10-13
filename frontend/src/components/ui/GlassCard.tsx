import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  elevation?: 'flat' | 'elevated' | 'floating';
  glow?: 'cyan' | 'violet' | 'none';
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevation = 'elevated',
  glow = 'none',
  interactive = false,
  ...props
}) => {
  const elevationClass =
    elevation === 'floating'
      ? 'glass-surface-elevated shadow-glass-lg'
      : elevation === 'elevated'
      ? 'glass-surface shadow-glass-md'
      : 'glass-surface-subtle shadow-glass-sm';

  const glowClass =
    glow === 'cyan'
      ? 'border-cyan-500/30 shadow-glow-cyan'
      : glow === 'violet'
      ? 'border-violet-500/30 shadow-glow-violet'
      : '';

  const interactiveProps = interactive
    ? {
        whileHover: { y: -2, transition: { duration: 0.2 } },
        whileTap: { scale: 0.99 },
      }
    : {};

  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${elevationClass} ${glowClass} ${className}`}
      {...interactiveProps}
      {...props}
    >
      {/* Top inner light reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};
