import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  UploadCloud,
  Github,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  FileText,
  Binary,
} from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { GlassBadge } from './ui/GlassBadge';
import { IHealthStatus } from '../types';

interface LandingViewProps {
  onGetStarted: () => void;
  onDirectUpload: (type: 'zip' | 'github') => void;
  health: IHealthStatus | null;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onGetStarted,
  onDirectUpload,
  health,
}) => {
  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 py-10 z-10 overflow-hidden">
      {/* Top Identity / Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center space-x-3 pt-2"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-surface-subtle border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow-glass-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="tracking-wide uppercase text-[11px]">ExaPro Analysis Platform</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono text-[10px]">v2.4 Technical Evaluator</span>
        </div>
      </motion.div>

      {/* Floating 3D Depth Elements in Background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
        {/* Floating Technical Feature Pills */}
        <motion.div
          initial={{ opacity: 0, x: -80, y: -60 }}
          animate={{ opacity: 0.7, x: -140, y: -100 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="hidden lg:flex items-center space-x-2 px-3.5 py-2 rounded-2xl glass-surface-elevated border border-cyan-500/20 text-xs text-slate-300 shadow-xl"
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[11px]">Static AST Tree Analysis</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 80, y: -80 }}
          animate={{ opacity: 0.7, x: 160, y: -120 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="hidden lg:flex items-center space-x-2 px-3.5 py-2 rounded-2xl glass-surface-elevated border border-violet-500/20 text-xs text-slate-300 shadow-xl"
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="font-mono text-[11px]">Synthesized SVG Architecture</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -90, y: 100 }}
          animate={{ opacity: 0.7, x: -180, y: 120 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="hidden lg:flex items-center space-x-2 px-3.5 py-2 rounded-2xl glass-surface-elevated border border-blue-500/20 text-xs text-slate-300 shadow-xl"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-[11px]">Zero Hallucination Guarantee</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 90, y: 90 }}
          animate={{ opacity: 0.7, x: 150, y: 130 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="hidden lg:flex items-center space-x-2 px-3.5 py-2 rounded-2xl glass-surface-elevated border border-cyan-500/20 text-xs text-slate-300 shadow-xl"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[11px]">Typeset DOCX Deliverables</span>
        </motion.div>
      </div>

      {/* Main Hero Centerpiece */}
      <div className="relative max-w-4xl mx-auto text-center space-y-8 my-auto py-8">
        {/* Central Logo Symbol */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-violet-600 p-0.5 shadow-2xl shadow-cyan-500/30 flex items-center justify-center group"
        >
          <div className="w-full h-full rounded-[22px] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center">
            <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </motion.div>

        {/* Central Heading: "Examine Project" */}
        <div className="space-y-4">
          <motion.h1
            layoutId="brand-examine-title"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none drop-shadow-[0_10px_35px_rgba(6,182,212,0.25)] select-none"
          >
            Examine{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-400 bg-clip-text text-transparent">
              Project
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Evidence-grounded software architecture evaluation and professional technical report generation.
            Inspects polyglot repositories, verifies runtimes and routes, and renders camera-ready Word documentation.
          </motion.p>
        </div>

        {/* Primary Action Button: "Get Started" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={onGetStarted}
            className="group relative px-8 py-4 sm:px-10 sm:py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black text-base sm:text-lg shadow-2xl shadow-cyan-500/35 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center space-x-3 cursor-pointer"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Secondary Quick-Jump Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400"
        >
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Instant Ingestion:</span>
          <button
            onClick={() => onDirectUpload('zip')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload ZIP Archive</span>
          </button>
          <button
            onClick={() => onDirectUpload('github')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-violet-300 transition-colors"
          >
            <Github className="w-3.5 h-3.5 text-violet-400" />
            <span>Import GitHub URL</span>
          </button>
        </motion.div>
      </div>

      {/* Bottom Information Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.65 }}
        className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-white/5 pt-6"
      >
        <div className="flex items-center space-x-2">
          <Binary className="w-4 h-4 text-cyan-400" />
          <span className="font-medium text-slate-400">Autonomous Codebase Intelligence</span>
          <span>•</span>
          <span>Polyglot Fullstack & BaaS Architecture Support</span>
        </div>

        <div className="flex items-center space-x-3">
          {health?.database.isConnected ? (
            <GlassBadge variant="emerald" dot size="sm">
              MongoDB Connected
            </GlassBadge>
          ) : (
            <GlassBadge variant="amber" dot size="sm">
              Database Connecting...
            </GlassBadge>
          )}

          {health?.geminiConfigured ? (
            <GlassBadge variant="violet" dot size="sm">
              Gemini AI Active
            </GlassBadge>
          ) : (
            <GlassBadge variant="cyan" dot size="sm">
              Deterministic Static Engine
            </GlassBadge>
          )}
        </div>
      </motion.div>
    </div>
  );
};
