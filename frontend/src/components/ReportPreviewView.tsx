import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Layers,
  ArrowLeft,
  Github,
  UploadCloud,
  CheckCircle,
  Database,
  Route,
  Terminal,
  ShieldAlert,
  Code,
  Sparkles,
  Info,
  Maximize2,
} from 'lucide-react';
import { IReportData } from '../types';
import { fetchProjectReport, getDownloadDocxUrl } from '../services/api';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { GlassBadge } from './ui/GlassBadge';

interface ReportPreviewViewProps {
  projectId: string;
  onBack: () => void;
}

export const ReportPreviewView: React.FC<ReportPreviewViewProps> = ({ projectId, onBack }) => {
  const [report, setReport] = useState<IReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('architecture');

  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      try {
        setLoading(true);
        const data = await fetchProjectReport(projectId);
        if (isMounted) setReport(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load report preview.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReport();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="py-32 text-center space-y-4">
        <div className="w-12 h-12 mx-auto border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-200 font-semibold text-sm">Loading Project Evaluation Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <GlassCard elevation="elevated" className="p-8 text-center space-y-4 border-red-500/30">
          <p className="font-bold text-red-200 text-lg">Unable to load report</p>
          <p className="text-xs text-slate-400">{error || 'Project report record was not found'}</p>
          <GlassButton variant="secondary" size="md" onClick={onBack}>
            Return to Dashboard
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const sectionsList = [
    { id: 'summary', title: '1. Executive Summary', icon: FileText },
    { id: 'overview', title: '2. Project Overview', icon: Info },
    { id: 'tech', title: '3. Technology Stack', icon: Layers },
    { id: 'structure', title: '4. Project Structure', icon: Code },
    { id: 'architecture', title: '5. System Architecture', icon: Sparkles },
    { id: 'modules', title: '6. Module Details', icon: Layers },
    { id: 'dataflow', title: '7. Data Flow', icon: Route },
    { id: 'database', title: '8. Database Design', icon: Database },
    { id: 'api', title: '9. API Documentation', icon: Route },
    { id: 'setup', title: '10. Setup & Execution', icon: Terminal },
    { id: 'testing', title: '11. Testing & Quality', icon: CheckCircle },
    { id: 'limitations', title: '12. Limitations', icon: ShieldAlert },
    { id: 'appendix', title: '13. Appendix', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar Navigation & Actions */}
      <GlassCard elevation="elevated" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{report.projectName}</h1>
              <GlassBadge variant="cyan" dot size="sm">
                DOCX VERIFIED
              </GlassBadge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pl-8">
              <span className="inline-flex items-center space-x-1.5">
                {report.submissionType === 'github' ? <Github className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span className="font-mono text-slate-300">{report.repositoryUrl || report.uploadedFileName}</span>
              </span>
              {report.commitSha && <span>• Rev: <code className="font-mono text-slate-300">{report.commitSha}</code></span>}
              <span>• Generated: {new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex items-center space-x-3 pl-8 sm:pl-0">
            <a
              href={getDownloadDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download DOCX Report</span>
            </a>
          </div>
        </div>
      </GlassCard>

      {/* Main Grid: Sidebar TOC + High-Contrast Technical Document */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <GlassCard elevation="flat" className="p-4 sticky top-20 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
              Report Sections
            </h3>
            <div className="space-y-0.5">
              {sectionsList.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSection(sec.id);
                      const el = document.getElementById(`section-${sec.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-left flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* High-Contrast Document Content View */}
        <div className="lg:col-span-3 space-y-8">
          {/* SECTION 5: MANDATORY ARCHITECTURE DIAGRAM (Featured Prominently) */}
          <div id="section-architecture" className="glass-surface-elevated p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6 shadow-glow-cyan">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <GlassBadge variant="cyan" dot size="sm" className="mb-2">
                  Figure 6.1 Synthesized Architecture
                </GlassBadge>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">5. System Architecture & Component Diagram</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Dynamic SVG</span>
            </div>

            {/* Embedded High-Resolution Interactive SVG Canvas */}
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-white/10 p-3 sm:p-6 shadow-2xl">
              <div
                className="w-full overflow-x-auto flex justify-center py-2"
                dangerouslySetInnerHTML={{ __html: report.architectureDiagramSvg }}
              />
            </div>

            {/* Architecture Narrative */}
            <div className="p-5 rounded-2xl bg-midnight-900/80 border border-white/5 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.architectureDescription}
            </div>
          </div>

          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <div id="section-summary" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">1. Executive Summary & Project Profile</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.executiveSummary}
            </div>
          </div>

          {/* SECTION 2: PROJECT OVERVIEW */}
          <div id="section-overview" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">2. Project Overview & Capabilities</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.projectOverview}
            </div>
          </div>

          {/* SECTION 3: TECHNOLOGY STACK */}
          <div id="section-tech" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">3. Technology Stack & Dependencies</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Languages</span>
                <p className="text-xs font-semibold text-cyan-300 mt-1 font-mono">
                  {report.detectedTechnologies.languages.join(', ') || 'Auto-detected'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Frontend</span>
                <p className="text-xs font-semibold text-violet-300 mt-1">
                  {report.detectedTechnologies.frontend.join(', ') || 'N/A'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Authentication</span>
                <p className="text-xs font-semibold text-fuchsia-300 mt-1">
                  {report.detectedTechnologies.auth?.join(', ') || 'None declared'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Database & Storage</span>
                <p className="text-xs font-semibold text-emerald-300 mt-1">
                  {report.detectedTechnologies.database.join(', ') || 'None declared'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Server Runtime</span>
                <p className="text-xs font-semibold text-sky-300 mt-1">
                  {report.detectedTechnologies.backend.join(', ') || 'None (Client BaaS / SPA)'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Build Tools</span>
                <p className="text-xs font-semibold text-amber-300 mt-1">
                  {report.detectedTechnologies.buildTools.join(', ') || 'Standard'}
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line pt-2 font-normal">
              {report.documentation.technologyStackDescription}
            </div>
          </div>

          {/* SECTION 4: PROJECT STRUCTURE */}
          <div id="section-structure" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">4. Directory Structure (ASCII Code Tree)</h2>
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed max-h-96">
              <pre>{report.documentation.projectStructureTree}</pre>
            </div>
          </div>

          {/* SECTION 6: MODULE & COMPONENT DETAILS */}
          <div id="section-modules" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">6. Module & Component Details</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.moduleDetails}
            </div>
          </div>

          {/* SECTION 7: DATA FLOW */}
          <div id="section-dataflow" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">7. Data Flow & Communication</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.dataFlowDescription}
            </div>
          </div>

          {/* SECTION 8: DATABASE DESIGN */}
          <div id="section-database" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">8. Database Design & Schemas</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.databaseDesignDescription}
            </div>
          </div>

          {/* SECTION 9: API DOCUMENTATION */}
          <div id="section-api" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">9. API Documentation & Endpoints</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.apiDocumentationDescription}
            </div>
          </div>

          {/* SECTION 10: SETUP & EXECUTION */}
          <div id="section-setup" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">10. Setup & Execution Guide</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.setupAndExecutionInstructions}
            </div>
          </div>

          {/* SECTION 11: TESTING & QUALITY */}
          <div id="section-testing" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">11. Testing & Quality Verification</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.testingAndQualityDescription}
            </div>
          </div>

          {/* SECTION 12: LIMITATIONS */}
          <div id="section-limitations" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">12. Limitations & Observations</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.limitationsAndObservations}
            </div>
          </div>

          {/* SECTION 13: APPENDIX */}
          <div id="section-appendix" className="glass-surface-opaque p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">13. Appendix & File Inventory</h2>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.documentation.appendix}
            </div>
          </div>

          {/* Bottom Export Action Card */}
          <div className="glass-surface-elevated p-8 rounded-3xl border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-glass-lg">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-white">Camera-Ready Document Package</h3>
              <p className="text-xs text-slate-400">
                Download the complete typeset Word DOCX deliverable including embedded vector architecture topology.
              </p>
            </div>
            <a
              href={getDownloadDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 flex-shrink-0"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download DOCX Report</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
