import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#151C32]">
      {/* 1. Rich Midnight Sapphire Foundation with Gentle Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 110% 80% at 50% -10%, #20284A 0%, #151C32 55%, #0F1424 100%)',
        }}
      />

      {/* 2. Subtle Iridescent Technical Grid Texture */}
      <div className="absolute inset-0 bg-grid-liquid opacity-80" />

      {/* 3. Deep Plum Ambient Lighting Source (Center / Upper Right) */}
      <motion.div
        className="absolute -top-32 right-1/4 w-[750px] h-[650px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(57, 44, 80, 0.45) 0%, rgba(45, 34, 65, 0.25) 50%, transparent 80%)',
        }}
        animate={{
          x: [0, 25, -20, 0],
          y: [0, -20, 15, 0],
          scale: [1, 1.06, 0.96, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 4. Primary Soft Lavender / Indigo Light behind the Hero Center */}
      <motion.div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[880px] h-[620px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(154, 171, 255, 0.22) 0%, rgba(200, 181, 255, 0.14) 40%, rgba(35, 45, 80, 0.10) 70%, transparent 85%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 5. Ice-Blue Refraction Light Offset to the Upper Left */}
      <motion.div
        className="absolute top-1/4 -left-28 w-[640px] h-[640px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168, 221, 244, 0.18) 0%, rgba(130, 185, 230, 0.09) 50%, transparent 75%)',
        }}
        animate={{
          x: [0, 30, -15, 0],
          y: [0, 25, -20, 0],
          opacity: [0.75, 0.95, 0.75],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 6. Pearl-Pink Subtle Warm Ambient Reflection in Lower Right */}
      <motion.div
        className="absolute -bottom-28 -right-20 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(240, 188, 225, 0.15) 0%, rgba(200, 150, 195, 0.07) 50%, transparent 75%)',
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 0.9, 0.7],
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
