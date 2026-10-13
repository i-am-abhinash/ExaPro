import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#090D16]">
      {/* 1. Deep Midnight Base with Restrained Navy Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 65% at 50% -10%, #0E172B 0%, #090D16 100%)',
        }}
      />

      {/* 2. Technical Subtle Texture Grid */}
      <div className="absolute inset-0 bg-grid-midnight opacity-80" />

      {/* 3. Primary Soft Indigo-Blue Aurora Light behind the Hero / Command Center */}
      <motion.div
        className="absolute -top-28 left-1/2 -translate-x-1/2 w-[820px] h-[580px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(95, 120, 235, 0.20) 0%, rgba(65, 85, 195, 0.12) 50%, transparent 80%)',
        }}
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 4. Secondary Faint Violet-Indigo Aurora Light Source Offset to the Right */}
      <motion.div
        className="absolute top-1/3 -right-36 w-[620px] h-[620px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(120, 95, 220, 0.12) 0%, rgba(85, 110, 235, 0.08) 50%, transparent 80%)',
        }}
        animate={{
          x: [0, -30, 15, 0],
          y: [0, 25, -20, 0],
          opacity: [0.75, 0.95, 0.75],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 5. Delicate Bottom-Left Cyan-Teal Sub-glow for Color Richness behind Glass */}
      <div
        className="absolute -bottom-32 -left-28 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(65, 145, 215, 0.10) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
