import React from 'react';
import { motion } from 'framer-motion';
import { Layers, PlusCircle, History, Database, Sparkles, CheckCircle2, Home } from 'lucide-react';
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
    <header className="sticky top-0 z-40 glass-surface border-b border-white/5 bg-midnight-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo with Title Transition Target */}
        <div
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <motion.div
            layoutId="brand-logo-icon"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow duration-300"
          >
            <Layers className="w-5 h-5 text-slate-950" />
          </motion.div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <motion.span
                layoutId="brand-examine-title"
                className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors"
              >
                EXAPRO
              </motion.span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO DOCX
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-tight">
              Evidence-Based Architecture Evaluator
            </p>
          </div>
        </div>

        {/* Navigation Tabs with Coordinated Reveal */}
        <motion.nav
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
          className="flex items-center space-x-1 sm:space-x-2"
        >
          {/* Landing shortcut */}
          <button
            onClick={onReturnToLanding}
            className={`p-2 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'landing'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Overview & Landing"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-slate-800/90 text-white shadow-glass-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('new')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'new'
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-200 border border-cyan-400/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-cyan-300" />
            <span>Examine Project</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'history'
                ? 'bg-slate-800/90 text-white shadow-glass-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <History className="w-4 h-4 text-violet-400" />
            <span>History</span>
          </button>
        </motion.nav>

        {/* Live System Health Indicators */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: 'easeOut' }}
          className="hidden lg:flex items-center space-x-2 text-xs"
        >
          {health?.database.isConnected ? (
            <GlassBadge variant="emerald" dot size="sm">
              MongoDB Active
            </GlassBadge>
          ) : (
            <GlassBadge variant="amber" dot size="sm">
              Connecting DB...
            </GlassBadge>
          )}

          {health?.geminiConfigured ? (
            <GlassBadge variant="violet" dot size="sm">
              Gemini AI Ready
            </GlassBadge>
          ) : (
            <GlassBadge variant="cyan" dot size="sm">
              Static Deterministic Engine
            </GlassBadge>
          )}
        </motion.div>
      </div>
    </header>
  );
};
