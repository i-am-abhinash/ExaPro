import { motion, Variants } from 'framer-motion';

// Icons ...
import {
  UploadCloud,
  Github,
  FileText,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Download,
  CheckCircle,
  Clock,
  Layers,
  Database,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { IProjectListItem, IHealthStatus } from '../types';
import { getDownloadDocxUrl } from '../services/api';
import { TiltCard } from './ui/TiltCard';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { GlassBadge } from './ui/GlassBadge';

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
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Hero Command Center Header */}
      <motion.div variants={itemVariants}>
        <GlassCard elevation="floating" className="p-8 sm:p-12 relative overflow-hidden">
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-surface-subtle border border-cyan-500/30 text-xs text-cyan-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Project Analysis Command Center</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Software Architecture{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                Evaluation & DOCX Generation
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Statically inspects project archives and public GitHub repositories, uncovers technology stacks and cross-service communication channels, synthesizes verified architecture diagrams, and exports camera-ready Word documentation reports.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-3">
              <GlassButton
                variant="primary"
                size="lg"
                icon={<UploadCloud className="w-5 h-5 text-slate-950" />}
                onClick={() => onStartSubmission('zip')}
              >
                Upload Project ZIP
              </GlassButton>

              <GlassButton
                variant="secondary"
                size="lg"
                icon={<Github className="w-5 h-5 text-slate-300" />}
                onClick={() => onStartSubmission('github')}
              >
                Import from GitHub
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Real Verified Metrics Strip */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard elevation="flat" className="p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Evaluated Projects</p>
            <p className="text-2xl font-black text-white">{recentProjects.length}</p>
          </div>
        </GlassCard>

        <GlassCard elevation="flat" className="p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Completed Reports</p>
            <p className="text-2xl font-black text-white">{completedProjectsCount}</p>
          </div>
        </GlassCard>

        <GlassCard elevation="flat" className="p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Project Store</p>
            <p className="text-sm font-bold text-slate-200 truncate">
              {health?.database.isConnected ? 'MongoDB Active' : 'Connecting DB'}
            </p>
          </div>
        </GlassCard>

        <GlassCard elevation="flat" className="p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Analysis Engine</p>
            <p className="text-sm font-bold text-slate-200 truncate">
              {health?.geminiConfigured ? 'Gemini AI + Static' : 'Static Deterministic'}
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Feature Highlights with 3D TiltCards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TiltCard elevation="elevated" className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-base">Synthesized Architecture Diagram</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically maps client SPAs, backend microservices, datastores, and communication flows into a high-resolution SVG diagram embedded in every report.
            </p>
          </div>
        </TiltCard>

        <TiltCard elevation="elevated" className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-base">14 Evidence-Grounded Sections</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Covers Executive Summary, Tech Stack, ASCII Directory Tree, Modules, Data Flow, Schemas, API Endpoints, and Setup scripts with zero hallucinations.
            </p>
          </div>
        </TiltCard>

        <TiltCard elevation="elevated" className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-base">Safe Static Codebase Inspection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Source code is inspected without running unverified commands. Path traversal defenses and automated cleanup maintain environment hygiene.
            </p>
          </div>
        </TiltCard>
      </motion.div>

      {/* Recent Evaluations Section */}
      <motion.div variants={itemVariants}>
        <GlassCard elevation="elevated" className="overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Project Evaluations</h2>
              <p className="text-xs text-slate-400">Previously analyzed software repositories and DOCX deliverable downloads</p>
            </div>
            <button
              onClick={() => onStartSubmission('zip')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>Examine New Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-sm font-bold text-slate-200">No project evaluations yet</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Submit a project ZIP archive or public GitHub repository to generate your first technical evaluation report.
                </p>
              </div>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<UploadCloud className="w-4 h-4 text-slate-950" />}
                onClick={() => onStartSubmission('zip')}
              >
                Examine First Project
              </GlassButton>
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
                  {recentProjects.map((proj) => (
                    <tr key={proj._id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:border-cyan-500/40 transition-colors">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate max-w-[200px]">{proj.projectName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center space-x-1.5 text-slate-400">
                          {proj.submissionType === 'github' ? (
                            <>
                              <Github className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]">GitHub</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]">ZIP Archive</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {proj.detectedTechnologies.languages.slice(0, 3).map((l) => (
                            <GlassBadge key={l} variant="neutral" size="sm">
                              {l}
                            </GlassBadge>
                          ))}
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
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
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
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors shadow-sm"
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
