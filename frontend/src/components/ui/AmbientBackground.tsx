import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-ivory">
      {/* Subtle Warm Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(255,255,255,0.8),transparent)]" />

      {/* Warm Minimal Grid Overlay */}
      <div className="absolute inset-0 bg-grid-subtle opacity-75" />

      {/* Gentle, Restrained Light Ambiance - Faint Cobalt & Warm Sunlight */}
      <motion.div
        className="absolute -top-40 left-1/3 w-[650px] h-[650px] rounded-full bg-cobalt/[0.035] blur-[140px]"
        animate={{
          x: [0, 25, -20, 0],
          y: [0, -20, 15, 0],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-1/2 -right-48 w-[600px] h-[600px] rounded-full bg-[#E8E1D3]/40 blur-[130px]"
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 30, -25, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
