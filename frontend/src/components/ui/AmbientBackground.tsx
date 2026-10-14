import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#17243F]">
      {/* 1. Deep Midnight Sapphire Base with Rich Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 95% 70% at 50% -10%, #203358 0%, #17243F 70%, #131E35 100%)',
        }}
      />

      {/* 2. Technical Subtle Sapphire Grid */}
      <div className="absolute inset-0 bg-grid-sapphire opacity-90" />

      {/* 3. Primary Soft Indigo-Blue Aurora Radial Light behind the Hero */}
      <motion.div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[880px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(130, 149, 255, 0.25) 0%, rgba(95, 120, 235, 0.15) 50%, transparent 80%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 4. Secondary Faint Violet Supporting Radial Light Offset to the Right */}
      <motion.div
        className="absolute top-1/4 -right-28 w-[650px] h-[650px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(195, 165, 255, 0.18) 0%, rgba(145, 120, 245, 0.09) 50%, transparent 80%)',
        }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 25, -20, 0],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 5. Restrained Vibrant Teal Ambient Lighting in Selected Lower Left Area */}
      <motion.div
        className="absolute -bottom-24 -left-20 w-[580px] h-[580px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(57, 214, 192, 0.20) 0%, rgba(35, 165, 150, 0.08) 50%, transparent 75%)',
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.75, 0.95, 0.75],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
