import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  UploadCloud,
  Github,
  FileText,
  Cpu,
  Download,
  CheckCircle,
  Database,
  Sparkles,
  GitBranch,
  Search,
} from 'lucide-react';
import { IProjectListItem, IHealthStatus } from '../types';
import { getDownloadDocxUrl } from '../services/api';
import {
  TiltCard,
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
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
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
      className="space-y-8 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* 1. Primary Action & Overview Hero Glass Panel */}
      <motion.div variants={itemVariants}>
        <div className="rounded-3xl glass-hero p-6 sm:p-10 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Command & Ingestion */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[rgba(15,21,35,0.60)] border border-white/[0.12] text-xs font-semibold text-cool-secondary shadow-sm backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-aurora animate-subtle-pulse" />
                <span>Examine Project Workspace</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl font-black text-cool-primary tracking-tight leading-tight">
                  Software Architecture <span className="text-aurora">Evaluation</span>
                </h1>
                <p className="text-cool-secondary text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                  Statically inspects project archives and public GitHub repositories, uncovers technology stacks and cross-service communication channels, synthesizes verified architecture diagrams, and exports camera-ready Word documentation reports.
                </p>
              </div>

              {/* Primary Dual Ingestion Launchpad - Distinct Interactive Glass Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div
                  onClick={() => onStartSubmission('zip')}
                  className="p-4 rounded-2xl glass-tile-interactive cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-aurora/15 text-aurora flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-bold text-cool-primary group-hover:text-aurora transition-colors">
                        Upload ZIP Archive
                      </p>
                      <p className="text-xs text-cool-muted truncate">
                        Local source packages up to 50MB
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => onStartSubmission('github')}
                  className="p-4 rounded-2xl glass-tile-interactive cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.08] text-cool-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                      <Github className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-bold text-cool-primary group-hover:text-aurora transition-colors">
                        Import GitHub Repository
                      </p>
                      <p className="text-xs text-cool-muted truncate">
                        Public Git URLs and branches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Real Project Telemetry HUD (Distinct Stat Tiles) */}
            <div className="lg:col-span-4 lg:border-l lg:border-white/[0.10] lg:pl-8 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cool-muted">
                System Telemetry & Status
              </h3>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl glass-stat-tile">
                  <p className="text-xs uppercase font-bold text-cool-muted tracking-wider">Evaluations</p>
                  <p className="text-3xl font-black text-cool-primary mt-1">{recentProjects.length}</p>
                  <p className="text-[11px] text-cool-muted mt-0.5">Recorded Repos</p>
                </div>

                <div className="p-4 rounded-2xl glass-stat-tile">
                  <p className="text-xs uppercase font-bold text-cool-muted tracking-wider">Reports</p>
                  <p className="text-3xl font-black text-cool-primary mt-1">{completedProjectsCount}</p>
                  <p className="text-[11px] text-status-success font-medium mt-0.5">Camera-Ready</p>
                </div>
              </div>

              {/* Health Info */}
              <div className="space-y-2 text-xs pt-1">
                <div className="p-3 rounded-xl glass-stat-tile flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-cool-muted" />
                    <span className="font-semibold text-cool-primary text-[11px]">Database Instance</span>
                  </div>
                  {health?.database.isConnected ? (
                    <GlassBadge variant="success" dot size="sm">
                      MongoDB Active
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="warning" dot size="sm">
                      Connecting
                    </GlassBadge>
                  )}
                </div>

                <div className="p-3 rounded-xl glass-stat-tile flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-aurora" />
                    <span className="font-semibold text-cool-primary text-[11px]">AI Synthesis</span>
                  </div>
                  {health?.geminiConfigured ? (
                    <GlassBadge variant="aurora" dot size="sm">
                      Gemini Flash
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="neutral" dot size="sm">
                      Deterministic
                    </GlassBadge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Key Architecture Capabilities (Distinct Elevated Glass Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Topology Engine (7 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col">
          <TiltCard
            elevation="floating"
            className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-aurora/15 text-aurora flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-cool-primary text-lg tracking-tight">Synthesized Architecture Topology Engine</h3>
                <p className="text-xs sm:text-sm text-cool-secondary leading-relaxed">
                  Automatically maps client SPAs, backend microservices, serverless BaaS, and databases into a high-resolution SVG diagram embedded directly in camera-ready Word reports.
                </p>
              </div>

              {/* Supported Models */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-[rgba(15,21,35,0.50)] border border-white/[0.08] text-cool-secondary font-mono font-medium backdrop-blur-sm">
                  client_baas
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[rgba(15,21,35,0.50)] border border-white/[0.08] text-cool-secondary font-mono font-medium backdrop-blur-sm">
                  polyglot_fullstack
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[rgba(15,21,35,0.50)] border border-white/[0.08] text-cool-secondary font-mono font-medium backdrop-blur-sm">
                  client_server_db
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[rgba(15,21,35,0.50)] border border-white/[0.08] text-cool-secondary font-mono font-medium backdrop-blur-sm">
                  frontend_spa_only
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.10] text-xs text-cool-muted flex items-center justify-between">
              <span>Dynamic Vector SVG Embedded Directly into DOCX</span>
              <span className="text-aurora font-semibold">Zero Hallucinations</span>
            </div>
          </TiltCard>
        </motion.div>

        {/* 14 Camera-Ready Deliverables (5 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col">
          <TiltCard
            elevation="floating"
            className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] text-cool-primary flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-cool-primary text-lg tracking-tight">14 Camera-Ready Sections</h3>
                <p className="text-xs sm:text-sm text-cool-secondary leading-relaxed">
                  Covers Executive Summary, Tech Stack, ASCII Directory Tree, Modules, Data Flow, Schemas, API Endpoints, and Setup scripts with reconciled coverage.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-cool-primary font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                  <span>Strict File Coverage</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                  <span>Active Collections</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                  <span>Editorial Navy Theme</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                  <span>Verified Word Output</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.10] text-xs text-cool-muted flex items-center justify-between">
              <span>Standardized Technical Typography</span>
              <span className="text-cool-primary font-semibold">Production Ready</span>
            </div>
          </TiltCard>
        </motion.div>
      </div>

      {/* 3. Recent Project Evaluations Table Workspace */}
      <motion.div variants={itemVariants}>
        <div className="rounded-3xl glass-card overflow-hidden">
          {/* Table Header & Search Filter */}
          <div className="p-6 border-b border-white/[0.09] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-cool-primary tracking-tight">Recent Project Evaluations</h2>
              <p className="text-xs sm:text-sm text-cool-muted">
                Previously examined software repositories and camera-ready DOCX deliverable downloads
              </p>
            </div>

            <div className="w-full sm:w-80">
              <GlassInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filter by name, repo, or stack..."
                icon={<Search className="w-4 h-4 text-cool-muted" />}
              />
            </div>
          </div>

          {recentProjects.length === 0 ? (
            <GlassEmptyState
              icon={<FileText className="w-7 h-7" />}
              title="No project evaluations yet"
              description="Submit a project ZIP archive or public GitHub repository to generate your first technical evaluation report."
              actionText="Examine First Project"
              actionIcon={<UploadCloud className="w-4 h-4 text-[#090D16]" />}
              onAction={() => onStartSubmission('zip')}
            />
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-xs sm:text-sm text-cool-muted">
              No evaluated projects match &ldquo;{tableSearch}&rdquo;
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[rgba(15,21,35,0.70)] text-cool-muted border-b border-white/[0.09] uppercase tracking-wider font-bold text-[11px] backdrop-blur-md">
                  <tr>
                    <th className="py-3.5 px-6">Project Name</th>
                    <th className="py-3.5 px-6">Source</th>
                    <th className="py-3.5 px-6">Detected Stack</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Evaluated Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-cool-primary">
                  {filteredProjects.map((proj) => (
                    <tr key={proj._id} className="hover:bg-[rgba(75,94,143,0.18)] transition-colors group">
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(39,51,78,0.50)] border border-white/[0.10] flex items-center justify-center text-aurora flex-shrink-0 group-hover:border-aurora/40 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate max-w-[220px] font-bold text-cool-primary group-hover:text-aurora transition-colors">
                              {proj.projectName}
                            </p>
                            {proj.branch && (
                              <p className="text-[11px] text-cool-muted flex items-center space-x-1 font-mono">
                                <GitBranch className="w-3 h-3 text-cool-muted" />
                                <span>{proj.branch}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center space-x-1.5 text-cool-secondary">
                          {proj.submissionType === 'github' ? (
                            <>
                              <Github className="w-3.5 h-3.5 text-cool-primary flex-shrink-0" />
                              <span className="truncate max-w-[140px] font-mono text-[11px]">GitHub</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5 text-aurora flex-shrink-0" />
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
                            <span className="text-[10px] text-cool-muted self-center">
                              +{proj.detectedTechnologies.languages.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {proj.status === 'completed' ? (
                          <GlassBadge variant="success" dot size="sm">
                            Ready
                          </GlassBadge>
                        ) : proj.status === 'failed' ? (
                          <GlassBadge variant="error" dot size="sm">
                            Failed
                          </GlassBadge>
                        ) : (
                          <GlassBadge variant="aurora" dot pulse size="sm">
                            {proj.statusMessage || 'Analyzing...'}
                          </GlassBadge>
                        )}
                      </td>

                      <td className="py-4 px-6 text-cool-muted whitespace-nowrap text-xs">
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
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-aurora hover:bg-aurora-hover text-[#090D16] text-xs font-bold shadow-aurora-sm transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-[#090D16]" />
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
        </div>
      </motion.div>
    </motion.div>
  );
};
