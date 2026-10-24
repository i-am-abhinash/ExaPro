import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  elevation?: 'flat' | 'elevated' | 'floating' | 'solid';
  onClick?: () => void;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt = 2.5,
  glare = true,
  elevation = 'elevated',
  onClick,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canTilt, setCanTilt] = useState(true);

  // Disable tilt on touch screens or reduced motion
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) {
      setCanTilt(false);
    }
  }, []);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 24, stiffness: 240, mass: 0.35 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [0, 1], [-maxTilt, maxTilt]);

  const glareX = useTransform(smoothX, [0, 1], ['0%', '100%']);
  const glareY = useTransform(smoothY, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  const elevationClass =
    elevation === 'floating'
      ? 'glass-panel-elevated shadow-glass-xl'
      : elevation === 'elevated'
      ? 'glass-panel shadow-glass-md hover:shadow-glass-lg'
      : elevation === 'solid'
      ? 'workspace-card shadow-glass-sm hover:shadow-glass-md'
      : 'glass-panel-subtle';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: 1200,
        rotateX: canTilt ? rotateX : 0,
        rotateY: canTilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      whileHover={canTilt ? { y: -2.5, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } : {}}
      whileTap={onClick ? { scale: 0.985, y: 0, transition: { duration: 0.12 } } : {}}
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${elevationClass} ${className}`}
      {...(rest as any)}
    >
      {/* Subtle Iridescent Specular Refraction on Hover */}
      {glare && canTilt && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 opacity-40 mix-blend-screen transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 280px at ${glareX.get()} ${glareY.get()}, rgba(255,255,255,0.40) 0%, rgba(168,221,244,0.22) 30%, rgba(200,181,255,0.16) 60%, transparent 80%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
};
