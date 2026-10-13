import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  UploadCloud,
  Github,
  FileText,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Download,
  CheckCircle,
  Database,
  Sparkles,
  ExternalLink,
  Code2,
  GitBranch,
  Layers,
  Search,
} from 'lucide-react';
import { IProjectListItem, IHealthStatus } from '../types';
import { getDownloadDocxUrl } from '../services/api';
import {
  TiltCard,
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassEmptyState,
} from './ui';

interface DashboardViewProps {
  onStartSubmission: (type: 'zip' | 'github') => void;
  onViewReport: (id: string) => void;
  recentProjects: IProjectListItem[];
  health: IHealthStatus | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartSubmission,
  onViewReport,
  recentProjects,
  health,
}) => {
  const [tableSearch, setTableSearch] = useState('');

  const completedProjectsCount = recentProjects.filter((p) => p.status === 'completed').length;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
  };

  const filteredProjects = recentProjects.filter((p) => {
    const q = tableSearch.toLowerCase();
    return (
      p.projectName.toLowerCase().includes(q) ||
      (p.repositoryUrl && p.repositoryUrl.toLowerCase().includes(q)) ||
      (p.uploadedFileName && p.uploadedFileName.toLowerCase().includes(q)) ||
      p.detectedTechnologies.languages.some((l) => l.toLowerCase().includes(q))
    );
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* 1. Asymmetric Spatial Hero Grid: Primary Action (8-col) + Telemetry HUD (4-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Primary "Examine Project" Command Card (8 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
          <GlassCard
            elevation="floating"
            className="p-6 sm:p-8 relative flex-1 flex flex-col justify-between border-cyan-500/30 overflow-hidden"
          >
            {/* Luminous corner brackets */}
            <div className="corner-bracket-tl" />
            <div className="corner-bracket-br" />

            {/* Ambient Radial Highlights */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center space-x-2">
                <GlassBadge variant="cyan" dot pulse size="sm">
                  Examine Project Command Center
                </GlassBadge>
                <span className="text-[10px] text-slate-400 font-mono">v2.4 Architecture Engine</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Examine Software{' '}
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-400 bg-clip-text text-transparent">
                    Architecture & Codebases
                  </span>
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
                  Statically inspects project archives and public GitHub repositories, uncovers technology stacks and cross-service communication channels, synthesizes verified architecture diagrams, and exports camera-ready Word documentation reports.
                </p>
              </div>

              {/* Dual Ingestion Launchpad */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => onStartSubmission('zip')}
                  className="p-4 rounded-xl glass-surface hover:glass-surface-elevated border border-slate-700/60 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                        Upload ZIP Archive
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Local source packages & multi-service archives
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => onStartSubmission('github')}
                  className="p-4 rounded-xl glass-surface hover:glass-surface-elevated border border-slate-700/60 hover:border-violet-500/50 cursor-pointer transition-all duration-300 group shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-105 transition-transform">
                      <Github className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors">
                        Import GitHub URL
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Public Git repositories & remote branches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Launch Button */}
            <div className="relative z-10 pt-5 mt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Execution Risk • Safe Static Inspection</span>
              </div>

              <GlassButton
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4 text-slate-950" />}
                onClick={() => onStartSubmission('zip')}
              >
                Begin Project Examination
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Telemetry HUD & Status Card (4 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
          <GlassCard
            elevation="elevated"
            className="p-6 relative flex-1 flex flex-col justify-between border-violet-500/25 space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Telemetry & System Status
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Real Project Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Evaluations</p>
                  <p className="text-2xl font-black text-white mt-0.5">{recentProjects.length}</p>
                  <p className="text-[10px] text-cyan-400 font-medium mt-0.5">Recorded Repos</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">DOCX Reports</p>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">{completedProjectsCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Camera-Ready</p>
                </div>
              </div>

              {/* Real Backend Infrastructure Strip */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-slate-300 font-medium text-[11px]">Database Instance</span>
                  </div>
                  {health?.database.isConnected ? (
                    <GlassBadge variant="emerald" dot size="sm">
                      MongoDB Active
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="amber" dot size="sm">
                      Connecting
                    </GlassBadge>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300 font-medium text-[11px]">AI Synthesis</span>
                  </div>
                  {health?.geminiConfigured ? (
                    <GlassBadge variant="violet" dot size="sm">
                      Gemini Flash Active
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="cyan" dot size="sm">
                      Deterministic Engine
                    </GlassBadge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action link */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Recent Analysis Records</span>
              <button
                onClick={() => onStartSubmission('zip')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 transition-colors"
              >
                <span>New Inspection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* 2. Asymmetric Capability Insights (7-col vs 5-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Topology & Architecture Engine (7 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col">
          <TiltCard elevation="elevated" className="p-6 relative flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-300">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Synthesized Topology & Architecture Engine</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically maps client SPAs, backend microservices, serverless BaaS, and databases into a high-resolution SVG diagram embedded directly in the camera-ready Word document.
                </p>
              </div>

              {/* Architecture Style Pills */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/25 text-cyan-300 font-mono">
                  client_baas
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-violet-500/25 text-violet-300 font-mono">
                  polyglot_fullstack
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-sky-500/25 text-sky-300 font-mono">
                  client_server_db
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                  frontend_spa_only
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Vector SVG Embedded Directly into DOCX</span>
              <span className="text-cyan-400 font-medium">Automatic Layout</span>
            </div>
          </TiltCard>
        </motion.div>

        {/* 14 Camera-Ready Deliverables (5 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col">
          <TiltCard elevation="elevated" className="p-6 relative flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-300">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">14 Camera-Ready Report Sections</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generates executive summaries, ASCII directory trees, component modules, schema definitions, endpoints, and setup scripts with reconciled coverage.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Strict Reconciled Coverage</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Navy & Slate Theme</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Active vs Rule Collections</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero Hallucinations</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Standardized Technical Typography</span>
              <span className="text-violet-400 font-medium">Camera-Ready</span>
            </div>
          </TiltCard>
        </motion.div>
      </div>

      {/* 3. Recent Project Evaluations Table Workspace */}
      <motion.div variants={itemVariants}>
        <GlassCard elevation="elevated" className="overflow-hidden">
          {/* Header & Search */}
          <div className="p-5 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Project Evaluations</h2>
              <p className="text-xs text-slate-400">
                Previously analyzed software repositories and DOCX deliverable downloads
              </p>
            </div>

            <div className="w-full sm:w-72">
              <GlassInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filter by name, repo, or stack..."
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>

          {recentProjects.length === 0 ? (
            <GlassEmptyState
              icon={<FileText className="w-7 h-7" />}
              title="No project evaluations yet"
              description="Submit a project ZIP archive or public GitHub repository to generate your first technical evaluation report."
              actionText="Examine First Project"
              actionIcon={<UploadCloud className="w-4 h-4 text-slate-950" />}
              onAction={() => onStartSubmission('zip')}
            />
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No evaluated projects match &ldquo;{tableSearch}&rdquo;
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Project Name</th>
                    <th className="py-3.5 px-6">Source</th>
                    <th className="py-3.5 px-6">Detected Stack</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Evaluated Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredProjects.map((proj) => (
                    <tr key={proj._id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:border-cyan-500/40 transition-colors shadow-sm">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate max-w-[220px] font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {proj.projectName}
                            </p>
                            {proj.branch && (
                              <p className="text-[10px] text-slate-400 flex items-center space-x-1 font-mono">
                                <GitBranch className="w-2.5 h-2.5" />
                                <span>{proj.branch}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center space-x-1.5 text-slate-400">
                          {proj.submissionType === 'github' ? (
                            <>
                              <Github className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px] font-mono text-[11px]">GitHub</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px] text-[11px]">ZIP Archive</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {proj.detectedTechnologies.languages.slice(0, 3).map((l) => (
                            <GlassBadge key={l} variant="neutral" size="sm">
                              {l}
                            </GlassBadge>
                          ))}
                          {proj.detectedTechnologies.languages.length > 3 && (
                            <span className="text-[10px] text-slate-500 self-center">
                              +{proj.detectedTechnologies.languages.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {proj.status === 'completed' ? (
                          <GlassBadge variant="emerald" dot size="sm">
                            Ready
                          </GlassBadge>
                        ) : proj.status === 'failed' ? (
                          <GlassBadge variant="rose" dot size="sm">
                            Failed
                          </GlassBadge>
                        ) : (
                          <GlassBadge variant="cyan" dot pulse size="sm">
                            {proj.statusMessage || 'Analyzing...'}
                          </GlassBadge>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                        {new Date(proj.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        {proj.status === 'completed' && (
                          <>
                            <GlassButton
                              variant="secondary"
                              size="sm"
                              onClick={() => onViewReport(proj._id)}
                            >
                              Preview Report
                            </GlassButton>
                            <a
                              href={getDownloadDocxUrl(proj._id)}
                              download
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>DOCX</span>
                            </a>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};
