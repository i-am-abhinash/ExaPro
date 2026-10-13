import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  elevation?: 'flat' | 'elevated' | 'floating' | 'solid';
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevation = 'elevated',
  interactive = false,
  ...props
}) => {
  const elevationClass =
    elevation === 'floating'
      ? 'glass-panel-elevated'
      : elevation === 'elevated'
      ? 'glass-panel'
      : elevation === 'solid'
      ? 'workspace-card'
      : 'glass-panel-subtle';

  const interactiveClasses = interactive ? 'glass-panel-interactive cursor-pointer' : '';

  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden ${elevationClass} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
