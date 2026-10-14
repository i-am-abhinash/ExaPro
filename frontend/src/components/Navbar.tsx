import React from 'react';
import { motion } from 'framer-motion';
import { Layers, PlusCircle, History, Home, LayoutDashboard } from 'lucide-react';
import { IHealthStatus } from '../types';
import { GlassBadge } from './ui/GlassBadge';

interface NavbarProps {
  currentTab: 'landing' | 'dashboard' | 'new' | 'history' | 'report';
  setCurrentTab: (tab: 'landing' | 'dashboard' | 'new' | 'history' | 'report') => void;
  health: IHealthStatus | null;
  hasSeenLanding: boolean;
  onReturnToLanding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  health,
  onReturnToLanding,
}) => {
  return (
    <header className="sticky top-0 z-40 glass-nav-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <motion.div
            layoutId="brand-logo-icon"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-aurora flex items-center justify-center text-[#17243F] shadow-aurora-sm transition-transform duration-200"
          >
            <Layers className="w-5 h-5 text-[#17243F]" />
          </motion.div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <motion.span
                layoutId="brand-examine-title"
                className="font-extrabold text-lg sm:text-xl tracking-tight text-cool-primary group-hover:text-aurora transition-colors"
              >
                EXAPRO
              </motion.span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-aurora/18 text-aurora border border-aurora/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                PRO DOCX
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-cool-muted font-medium tracking-tight">
              Software Architecture Evaluator
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <motion.nav
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex items-center space-x-1 sm:space-x-1.5"
        >
          {/* Landing shortcut */}
          <button
            onClick={onReturnToLanding}
            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'landing'
                ? 'glass-tile-interactive text-cool-primary border border-white/[0.14] shadow-sm'
                : 'text-cool-secondary hover:text-cool-primary hover:bg-white/[0.08]'
            }`}
            title="Overview & Landing"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'dashboard'
                ? 'glass-tile-interactive text-cool-primary border border-white/[0.14] shadow-sm'
                : 'text-cool-secondary hover:text-cool-primary hover:bg-white/[0.08]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('new')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentTab === 'new'
                ? 'bg-aurora text-[#17243F] shadow-aurora-sm border border-aurora/50'
                : 'text-aurora bg-aurora/18 hover:bg-aurora/28 border border-aurora/40 shadow-sm'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Examine Project</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'history'
                ? 'glass-tile-interactive text-cool-primary border border-white/[0.14] shadow-sm'
                : 'text-cool-secondary hover:text-cool-primary hover:bg-white/[0.06]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </motion.nav>

        {/* Live System Health Indicators */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="hidden lg:flex items-center space-x-2 text-xs"
        >
          {health?.database.isConnected ? (
            <GlassBadge variant="success" dot size="sm">
              MongoDB Connected
            </GlassBadge>
          ) : (
            <GlassBadge variant="warning" dot size="sm">
              Connecting DB
            </GlassBadge>
          )}

          {health?.geminiConfigured ? (
            <GlassBadge variant="aurora" dot size="sm">
              Gemini AI
            </GlassBadge>
          ) : (
            <GlassBadge variant="neutral" dot size="sm">
              Static Engine
            </GlassBadge>
          )}
        </motion.div>
      </div>
    </header>
  );
};
