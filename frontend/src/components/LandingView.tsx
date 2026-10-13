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
  CheckCircle2,
  Code2,
  Terminal,
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
    <div className="relative min-h-[90vh] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 py-10 z-10 overflow-hidden">
      {/* Top Identity / Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center space-x-3 pt-2"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/[0.08] text-xs font-semibold text-graphite shadow-glass-sm">
          <span className="w-2 h-2 rounded-full bg-cobalt animate-subtle-pulse" />
          <span className="tracking-wide uppercase text-[11px] text-graphite-700">ExaPro Evaluation Platform</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-muted font-mono text-[10px]">v2.4 Technical Evaluator</span>
        </div>
      </motion.div>

      {/* Main Hero Centerpiece */}
      <div className="relative max-w-4xl mx-auto text-center space-y-8 my-auto py-8">
        {/* Central Logo Symbol with layoutId */}
        <motion.div
          layoutId="brand-logo-icon"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, type: 'spring', stiffness: 260 }}
          className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-cobalt flex items-center justify-center text-white shadow-cobalt-md group cursor-pointer"
          onClick={onGetStarted}
        >
          <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-105 transition-transform duration-300" />
        </motion.div>

        {/* Central Heading: "Examine Project" */}
        <div className="space-y-4">
          <motion.h1
            layoutId="brand-examine-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black text-graphite tracking-tight leading-[1.05] select-none"
          >
            Examine <span className="text-cobalt">Project</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-slate-muted text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Evidence-grounded software architecture evaluation and professional technical report generation.
            Inspects polyglot repositories, verifies runtimes and routes, and renders camera-ready Word documentation.
          </motion.p>
        </div>

        {/* Primary Action Button: "Get Started" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 sm:px-10 sm:py-4.5 rounded-2xl bg-cobalt hover:bg-cobalt-hover active:bg-cobalt-active text-white font-bold text-base sm:text-lg shadow-cobalt-md hover:shadow-cobalt-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center space-x-3 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Secondary Quick-Jump Ingestion Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs"
        >
          <span className="text-[11px] uppercase tracking-wider text-slate-muted font-bold">Instant Ingestion:</span>
          <button
            onClick={() => onDirectUpload('zip')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-ivory-50 border border-black/[0.08] hover:border-black/[0.16] text-graphite font-semibold shadow-glass-sm transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cobalt" />
            <span>Upload ZIP Archive</span>
          </button>
          <button
            onClick={() => onDirectUpload('github')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-ivory-50 border border-black/[0.08] hover:border-black/[0.16] text-graphite font-semibold shadow-glass-sm transition-all"
          >
            <Github className="w-3.5 h-3.5 text-graphite" />
            <span>Import GitHub Repository</span>
          </button>
        </motion.div>

        {/* Editorial Software Analysis Demonstration Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="pt-6 max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-black/[0.06] shadow-glass-sm space-y-1">
              <div className="flex items-center space-x-2 text-cobalt font-mono text-[11px] font-bold">
                <Cpu className="w-4 h-4" />
                <span>01. Static AST Tree</span>
              </div>
              <p className="text-xs text-slate-muted leading-relaxed">
                Deconstructs manifests, routes, and components without unverified runtime execution.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-black/[0.06] shadow-glass-sm space-y-1">
              <div className="flex items-center space-x-2 text-cobalt font-mono text-[11px] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>02. Topology Synthesis</span>
              </div>
              <p className="text-xs text-slate-400 text-slate-muted leading-relaxed">
                Generates high-resolution SVG architecture diagrams embedded in report packages.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-black/[0.06] shadow-glass-sm space-y-1">
              <div className="flex items-center space-x-2 text-lime-dark font-mono text-[11px] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>03. Zero Hallucinations</span>
              </div>
              <p className="text-xs text-slate-muted leading-relaxed">
                Guaranteed evidence grounding with strictly reconciled file coverage accounting.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Information Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-muted border-t border-black/[0.06] pt-6"
      >
        <div className="flex items-center space-x-2">
          <Binary className="w-4 h-4 text-cobalt" />
          <span className="font-semibold text-graphite">Autonomous Codebase Intelligence</span>
          <span>•</span>
          <span>Polyglot Fullstack & BaaS Architecture Support</span>
        </div>

        <div className="flex items-center space-x-2.5">
          {health?.database.isConnected ? (
            <GlassBadge variant="lime" dot size="sm">
              MongoDB Connected
            </GlassBadge>
          ) : (
            <GlassBadge variant="amber" dot size="sm">
              Connecting Database...
            </GlassBadge>
          )}

          {health?.geminiConfigured ? (
            <GlassBadge variant="cobalt" dot size="sm">
              Gemini AI Active
            </GlassBadge>
          ) : (
            <GlassBadge variant="neutral" dot size="sm">
              Static Deterministic Engine
            </GlassBadge>
          )}
        </div>
      </motion.div>
    </div>
  );
};
