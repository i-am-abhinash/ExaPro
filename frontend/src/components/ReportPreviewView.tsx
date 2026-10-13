import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { IReportData } from '../types';
import { fetchProjectReport, getDownloadDocxUrl } from '../services/api';
import { GlassButton, GlassBadge } from './ui';

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
      <div className="py-32 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto border-3 border-electric border-t-transparent rounded-full animate-spin" />
        <p className="text-cool-primary font-semibold text-sm">Loading Project Evaluation Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="p-8 rounded-3xl bg-graphite-secondary border border-status-error-border shadow-glass-sm space-y-4">
          <p className="font-bold text-status-error text-lg">Unable to load report</p>
          <p className="text-xs sm:text-sm text-cool-muted">{error || 'Project report record was not found'}</p>
          <GlassButton variant="secondary" size="md" onClick={onBack}>
            Return to Dashboard
          </GlassButton>
        </div>
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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Bar Navigation & Actions Card */}
      <div className="p-6 rounded-3xl bg-graphite-elevated border border-white/[0.12] shadow-card-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="text-cool-muted hover:text-cool-primary p-1.5 rounded-xl hover:bg-white/[0.08] transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-black text-cool-primary tracking-tight">{report.projectName}</h1>
              <GlassBadge variant="success" dot size="sm">
                DOCX VERIFIED
              </GlassBadge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-cool-muted pl-8">
              <span className="inline-flex items-center space-x-1.5 font-medium text-cool-primary">
                {report.submissionType === 'github' ? <Github className="w-3.5 h-3.5 text-cool-primary" /> : <UploadCloud className="w-3.5 h-3.5 text-electric" />}
                <span className="font-mono">{report.repositoryUrl || report.uploadedFileName}</span>
              </span>
              {report.commitSha && (
                <span>• Commit: <code className="font-mono text-cool-primary font-bold">{report.commitSha}</code></span>
              )}
              <span>• Generated: {new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Download DOCX Button */}
          <div className="flex items-center space-x-3 pl-8 sm:pl-0">
            <a
              href={getDownloadDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-electric hover:bg-electric-hover active:bg-electric-active text-white font-bold text-sm shadow-electric-sm hover:shadow-electric-md border border-electric/40 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download DOCX Report</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Sticky TOC Sidebar + Editorial Technical Document */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-1 space-y-2 sticky top-20">
          <div className="p-4 rounded-2xl bg-graphite-secondary border border-white/[0.10] shadow-glass-sm space-y-1.5">
            <h3 className="text-xs font-bold text-cool-muted uppercase tracking-wider px-3 py-1.5">
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
                    className={`w-full text-left flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-electric/15 text-electric border border-electric/30 font-bold shadow-sm'
                        : 'text-cool-muted hover:text-cool-primary hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* High-Contrast Document Content View */}
        <div className="lg:col-span-3 space-y-8">
          {/* SECTION 5: SYSTEM ARCHITECTURE DIAGRAM */}
          <div id="section-architecture" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.10] pb-4">
              <div>
                <GlassBadge variant="electric" dot size="sm" className="mb-2">
                  Figure 6.1 Synthesized Architecture
                </GlassBadge>
                <h2 className="text-xl sm:text-2xl font-black text-cool-primary tracking-tight">5. System Architecture & Component Diagram</h2>
              </div>
              <span className="text-xs text-cool-muted font-mono font-medium">Dynamic SVG</span>
            </div>

            {/* Embedded High-Resolution SVG Canvas */}
            <div className="rounded-2xl overflow-hidden bg-graphite border border-white/[0.10] p-4 sm:p-6 shadow-inner">
              <div
                className="w-full overflow-x-auto flex justify-center py-2"
                dangerouslySetInnerHTML={{ __html: report.architectureDiagramSvg }}
              />
            </div>

            {/* Architecture Narrative */}
            <div className="p-5 rounded-2xl bg-graphite border border-white/[0.10] text-xs sm:text-sm text-cool-primary leading-relaxed whitespace-pre-line font-normal">
              {report.architectureDescription}
            </div>
          </div>

          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <div id="section-summary" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">1. Executive Summary & Project Profile</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.executiveSummary}
            </div>
          </div>

          {/* SECTION 2: PROJECT OVERVIEW */}
          <div id="section-overview" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">2. Project Overview & Capabilities</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.projectOverview}
            </div>
          </div>

          {/* SECTION 3: TECHNOLOGY STACK */}
          <div id="section-tech" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-6">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">3. Technology Stack & Dependencies</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-graphite-elevated border border-white/[0.10]">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Languages</span>
                <p className="text-xs font-bold text-cool-primary mt-1 font-mono">
                  {report.detectedTechnologies.languages.join(', ') || 'Auto-detected'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-graphite-elevated border border-white/[0.10]">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Frontend</span>
                <p className="text-xs font-bold text-electric mt-1">
                  {report.detectedTechnologies.frontend.join(', ') || 'N/A'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-graphite-elevated border border-white/[0.10]">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Authentication</span>
                <p className="text-xs font-bold text-cool-primary mt-1">
                  {report.detectedTechnologies.auth?.join(', ') || 'None declared'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-graphite-elevated border border-white/[0.10]">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Database & Storage</span>
                <p className="text-xs font-bold text-status-success mt-1">
                  {report.detectedTechnologies.database.join(', ') || 'None declared'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-graphite-elevated border border-white/[0.10]">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Server Runtime</span>
                <p className="text-xs font-bold text-cool-primary mt-1">
                  {report.detectedTechnologies.backend.join(', ') || 'None (Client BaaS / SPA)'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-graphite-elevated border border-white/[0.10]">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Build Tools</span>
                <p className="text-xs font-bold text-cool-primary mt-1">
                  {report.detectedTechnologies.buildTools.join(', ') || 'Standard'}
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line pt-2">
              {report.documentation.technologyStackDescription}
            </div>
          </div>

          {/* SECTION 4: PROJECT STRUCTURE */}
          <div id="section-structure" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">4. Directory Structure (ASCII Code Tree)</h2>
            <div className="bg-graphite p-5 rounded-2xl border border-white/[0.10] font-mono text-[11px] text-cool-primary overflow-x-auto leading-relaxed max-h-96">
              <pre>{report.documentation.projectStructureTree}</pre>
            </div>
          </div>

          {/* SECTION 6: MODULE & COMPONENT DETAILS */}
          <div id="section-modules" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">6. Module & Component Details</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.moduleDetails}
            </div>
          </div>

          {/* SECTION 7: DATA FLOW */}
          <div id="section-dataflow" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">7. Data Flow & Communication</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.dataFlowDescription}
            </div>
          </div>

          {/* SECTION 8: DATABASE DESIGN */}
          <div id="section-database" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">8. Database Design & Schemas</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.databaseDesignDescription}
            </div>
          </div>

          {/* SECTION 9: API DOCUMENTATION */}
          <div id="section-api" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">9. API Documentation & Endpoints</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.apiDocumentationDescription}
            </div>
          </div>

          {/* SECTION 10: SETUP & EXECUTION */}
          <div id="section-setup" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">10. Setup & Execution Guide</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.setupAndExecutionInstructions}
            </div>
          </div>

          {/* SECTION 11: TESTING & QUALITY */}
          <div id="section-testing" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">11. Testing & Quality Verification</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.testingAndQualityDescription}
            </div>
          </div>

          {/* SECTION 12: LIMITATIONS */}
          <div id="section-limitations" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">12. Limitations & Observations</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.limitationsAndObservations}
            </div>
          </div>

          {/* SECTION 13: APPENDIX */}
          <div id="section-appendix" className="p-6 sm:p-8 rounded-3xl bg-graphite-secondary border border-white/[0.10] shadow-card-elevated space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">13. Appendix & File Inventory</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.appendix}
            </div>
          </div>

          {/* Bottom Export Action Card */}
          <div className="p-8 rounded-3xl bg-graphite-elevated border border-white/[0.12] shadow-card-elevated flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-cool-primary">Camera-Ready Document Package</h3>
              <p className="text-xs sm:text-sm text-cool-muted">
                Download the complete typeset Word DOCX deliverable including embedded vector architecture topology.
              </p>
            </div>
            <a
              href={getDownloadDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-electric hover:bg-electric-hover active:bg-electric-active text-white font-bold text-sm shadow-electric-sm hover:shadow-electric-md border border-electric/40 transition-all transform hover:-translate-y-0.5 flex-shrink-0"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download DOCX Report</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
