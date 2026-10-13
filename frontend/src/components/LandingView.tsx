import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  UploadCloud,
  Github,
  Layers,
  Sparkles,
  Cpu,
  Binary,
  CheckCircle2,
} from 'lucide-react';
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
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-obsidian-card/90 border border-white/[0.08] text-xs font-semibold text-cream-primary shadow-glass-sm">
          <span className="w-2 h-2 rounded-full bg-amber animate-subtle-pulse" />
          <span className="tracking-wide uppercase text-[11px] text-cream-secondary">ExaPro Evaluation Platform</span>
          <span className="text-cream-muted/40">•</span>
          <span className="text-cream-muted font-mono text-[10px]">v2.4 Obsidian + Amber</span>
        </div>
      </motion.div>

      {/* Main Hero Centerpiece */}
      <div className="relative max-w-4xl mx-auto text-center space-y-8 my-auto py-8">
        {/* Central Logo Symbol */}
        <motion.div
          layoutId="brand-logo-icon"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, type: 'spring', stiffness: 260 }}
          className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber flex items-center justify-center text-obsidian shadow-amber-md group cursor-pointer"
          onClick={onGetStarted}
        >
          <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-obsidian group-hover:scale-105 transition-transform duration-300" />
        </motion.div>

        {/* Central Heading: "Examine Project" */}
        <div className="space-y-4">
          <motion.h1
            layoutId="brand-examine-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black text-cream-primary tracking-tight leading-[1.05] select-none"
          >
            Examine <span className="text-amber">Project</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-cream-secondary text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed font-normal"
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
            className="group px-8 py-4 sm:px-10 sm:py-4.5 rounded-2xl bg-amber hover:bg-amber-hover active:bg-amber-active text-obsidian font-bold text-base sm:text-lg shadow-amber-md hover:shadow-amber-sm border border-amber/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center space-x-3 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 text-obsidian group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Secondary Quick-Jump Ingestion Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs"
        >
          <span className="text-[11px] uppercase tracking-wider text-cream-muted font-bold">Instant Ingestion:</span>
          <button
            onClick={() => onDirectUpload('zip')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-obsidian-card hover:bg-obsidian-elevated border border-white/[0.08] hover:border-amber/40 text-cream-primary font-semibold shadow-glass-sm transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber" />
            <span>Upload ZIP Archive</span>
          </button>
          <button
            onClick={() => onDirectUpload('github')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-obsidian-card hover:bg-obsidian-elevated border border-white/[0.08] hover:border-amber/40 text-cream-primary font-semibold shadow-glass-sm transition-all"
          >
            <Github className="w-3.5 h-3.5 text-cream-primary" />
            <span>Import GitHub Repository</span>
          </button>
        </motion.div>

        {/* Software Analysis Demonstration Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="pt-6 max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            <div className="p-4 rounded-2xl bg-obsidian-card/85 backdrop-blur-md border border-white/[0.08] shadow-glass-sm space-y-1">
              <div className="flex items-center space-x-2 text-amber font-mono text-[11px] font-bold">
                <Cpu className="w-4 h-4 text-amber" />
                <span>01. Static AST Tree</span>
              </div>
              <p className="text-xs text-cream-secondary leading-relaxed">
                Deconstructs manifests, routes, and components without unverified runtime execution.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-obsidian-card/85 backdrop-blur-md border border-white/[0.08] shadow-glass-sm space-y-1">
              <div className="flex items-center space-x-2 text-amber font-mono text-[11px] font-bold">
                <Sparkles className="w-4 h-4 text-amber" />
                <span>02. Topology Synthesis</span>
              </div>
              <p className="text-xs text-cream-secondary leading-relaxed">
                Generates high-resolution SVG architecture diagrams embedded in report packages.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-obsidian-card/85 backdrop-blur-md border border-white/[0.08] shadow-glass-sm space-y-1">
              <div className="flex items-center space-x-2 text-status-success font-mono text-[11px] font-bold">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span>03. Zero Hallucinations</span>
              </div>
              <p className="text-xs text-cream-secondary leading-relaxed">
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
        className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream-muted border-t border-white/[0.08] pt-6"
      >
        <div className="flex items-center space-x-2">
          <Binary className="w-4 h-4 text-amber" />
          <span className="font-semibold text-cream-primary">Autonomous Codebase Intelligence</span>
          <span className="text-cream-muted/40">•</span>
          <span>Polyglot Fullstack & BaaS Architecture Support</span>
        </div>

        <div className="flex items-center space-x-2.5">
          {health?.database.isConnected ? (
            <GlassBadge variant="lime" dot size="sm">
              MongoDB Connected
            </GlassBadge>
          ) : (
            <GlassBadge variant="warning" dot size="sm">
              Connecting Database...
            </GlassBadge>
          )}

          {health?.geminiConfigured ? (
            <GlassBadge variant="amber" dot size="sm">
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
