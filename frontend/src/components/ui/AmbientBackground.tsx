import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-graphite">
      {/* Subtle Restrained Radial Gradient - Lighter at Top-Center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#2B3542_0%,transparent_80%)]" />

      {/* Graphite Grid Overlay */}
      <div className="absolute inset-0 bg-grid-graphite opacity-70" />

      {/* Subtle Electric-Blue Ambient Glow behind Hero Area */}
      <motion.div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[550px] rounded-full bg-electric/[0.055] blur-[150px]"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Soft Secondary Lavender Ambient Ambiance */}
      <motion.div
        className="absolute top-1/2 -right-40 w-[550px] h-[550px] rounded-full bg-lavender/[0.035] blur-[160px]"
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 25, -20, 0],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
