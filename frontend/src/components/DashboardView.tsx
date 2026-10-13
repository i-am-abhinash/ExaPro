import React from 'react';
import { UploadCloud, Github, FileText, ArrowRight, ShieldCheck, Cpu, Download, CheckCircle, Clock } from 'lucide-react';
import { IProjectListItem } from '../types';
import { getDownloadDocxUrl } from '../services/api';

interface DashboardViewProps {
  onStartSubmission: (type: 'zip' | 'github') => void;
  onViewReport: (id: string) => void;
  recentProjects: IProjectListItem[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartSubmission,
  onViewReport,
  recentProjects,
}) => {
  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-panel border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950/80">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-cyan-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Automated Technical Documentation Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Generate Comprehensive <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">DOCX Documentation</span> with Architecture Diagrams
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Exapro inspects your project archives and public GitHub repositories, analyzes technology stacks, routes, and schemas, synthesizes an architecture diagram, and compiles a complete Word report in seconds.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => onStartSubmission('zip')}
              className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Project ZIP</span>
            </button>

            <button
              onClick={() => onStartSubmission('github')}
              className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-medium text-sm transition-all transform hover:-translate-y-0.5"
            >
              <Github className="w-4 h-4 text-slate-300" />
              <span>Import from GitHub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base">Synthesized Architecture Diagram</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every generated report includes a custom, high-resolution SVG diagram rendered and embedded directly into the Word document.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base">14 Structured Sections</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Covers Executive Summary, Project Overview, Tech Stack, ASCII Directory Tree, Modules, Data Flow, Schemas, API Endpoints, and Setup scripts.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base">Safe Static Inspection</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Source code is strictly inspected without execution. Path traversal defenses and automated cleanup protect your workspace.
          </p>
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Project Reports</h2>
            <p className="text-xs text-slate-400 mt-0.5">Explore previously analyzed software projects and download their reports</p>
          </div>
          <button
            onClick={() => onStartSubmission('zip')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <span>Analyze New Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300">No project evaluations yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit a project ZIP file or a public GitHub repository above to generate your first technical documentation report.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6">Project Name</th>
                  <th className="py-3 px-6">Source</th>
                  <th className="py-3 px-6">Detected Stack</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentProjects.map((proj) => (
                  <tr key={proj._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{proj.projectName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 text-slate-400">
                        {proj.submissionType === 'github' ? (
                          <>
                            <Github className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>ZIP Archive</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {proj.detectedTechnologies.languages.slice(0, 3).map((l) => (
                          <span key={l} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {proj.status === 'completed' ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Ready</span>
                        </span>
                      ) : proj.status === 'failed' ? (
                        <span className="text-red-400 font-medium">Failed</span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-cyan-400">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>{proj.statusMessage}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      {proj.status === 'completed' && (
                        <>
                          <button
                            onClick={() => onViewReport(proj._id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-medium transition-colors"
                          >
                            Preview Report
                          </button>
                          <a
                            href={getDownloadDocxUrl(proj._id)}
                            download
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
                          >
                            <Download className="w-3 h-3" />
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
    </div>
  );
};
