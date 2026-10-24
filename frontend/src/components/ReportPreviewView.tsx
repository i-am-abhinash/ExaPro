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
import { IReportData, ITestRunData } from '../types';
import { fetchProjectReport, fetchTestRun, getDownloadDocxUrl, getDownloadFaultReportDocxUrl, getDownloadFaultReportJsonUrl } from '../services/api';
import { GlassButton, GlassBadge } from './ui';
import { FaultReportView } from './FaultReportView';

interface ReportPreviewViewProps {
  projectId: string;
  onBack: () => void;
}

export const ReportPreviewView: React.FC<ReportPreviewViewProps> = ({ projectId, onBack }) => {
  const [report, setReport] = useState<IReportData | null>(null);
  const [testRun, setTestRun] = useState<ITestRunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'architecture' | 'faults'>('architecture');
  const [activeSection, setActiveSection] = useState<string>('architecture');

  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      try {
        setLoading(true);
        const [data, tr] = await Promise.all([
          fetchProjectReport(projectId),
          fetchTestRun(projectId).catch(() => null),
        ]);
        if (isMounted) {
          setReport(data);
          if (tr) setTestRun(tr);
          else if (data.testRun) setTestRun(data.testRun);
        }
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
        <div className="w-12 h-12 mx-auto border-3 border-aurora border-t-transparent rounded-full animate-spin" />
        <p className="text-cool-primary font-semibold text-sm">Loading Project Evaluation Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="p-8 rounded-3xl glass-card border border-status-error-border shadow-glass-sm space-y-4">
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
      <div className="p-6 rounded-3xl glass-card-elevated">
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
                {report.submissionType === 'github' ? <Github className="w-3.5 h-3.5 text-teal" /> : <UploadCloud className="w-3.5 h-3.5 text-aurora" />}
                <span className="font-mono">{report.repositoryUrl || report.uploadedFileName}</span>
              </span>
              {report.commitSha && (
                <span>• Commit: <code className="font-mono text-cool-primary font-bold">{report.commitSha}</code></span>
              )}
              <span>• Generated: {new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Download Buttons Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 pl-8 sm:pl-0">
            <a
              href={getDownloadDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-aurora hover:bg-aurora-hover active:bg-aurora-active text-[#151C32] font-bold text-xs shadow-aurora-sm border border-aurora/50 transition-all transform hover:-translate-y-0.5"
              title="Download 14-section Technical Architecture DOCX"
            >
              <FileText className="w-3.5 h-3.5 text-[#151C32]" />
              <span>Docx Architecture</span>
            </a>

            <a
              href={getDownloadFaultReportDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl glass-tile-interactive text-cool-primary border border-white/[0.15] text-xs font-bold transition-colors"
              title="Download Software Quality & Fault Report DOCX"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF8998]" />
              <span>Fault DOCX</span>
            </a>

            <a
              href={getDownloadFaultReportJsonUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-3 py-2.5 rounded-xl glass-tile-interactive text-cool-muted hover:text-cool-primary border border-white/[0.10] text-xs font-mono transition-colors"
              title="Export Findings as JSON"
            >
              <span>JSON</span>
            </a>
          </div>
        </div>

        {/* Primary Dual View Switcher */}
        <div className="pt-6 border-t border-white/[0.10] flex justify-center">
          <div className="flex p-1.5 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.12] w-full max-w-xl backdrop-blur-md shadow-sm">
            <button
              type="button"
              onClick={() => setActiveReportTab('architecture')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeReportTab === 'architecture'
                  ? 'bg-aurora/20 text-aurora border border-aurora/35 shadow-sm'
                  : 'text-cool-muted hover:text-cool-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Report A: Architecture</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReportTab('faults')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeReportTab === 'faults'
                  ? 'bg-aurora/20 text-aurora border border-aurora/35 shadow-sm'
                  : 'text-cool-muted hover:text-cool-primary'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-[#FF8998]" />
              <span>Report B: Quality & Faults</span>
              {testRun?.summary && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFC66D]/20 text-[#FFC66D] border border-[#FFC66D]/30">
                  {testRun.summary.qualityScore}/100 ({testRun.summary.qualityGrade})
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Report A or Report B */}
      {activeReportTab === 'faults' && testRun ? (
        <FaultReportView projectId={report.projectId} projectName={report.projectName} testRun={testRun} />
      ) : activeReportTab === 'faults' && !testRun ? (
        <div className="p-12 text-center rounded-3xl glass-card space-y-3">
          <ShieldAlert className="w-8 h-8 text-[#FFC66D] mx-auto" />
          <p className="font-bold text-cool-primary text-base">Fault Report Ingestion in Progress</p>
          <p className="text-xs text-cool-muted">The test run evaluation is currently processing or no test run was recorded for this project.</p>
        </div>
      ) : (
        /* Report A: Sticky TOC Sidebar + Editorial Technical Document */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-1 space-y-2 sticky top-20">
          <div className="p-4 rounded-2xl glass-card space-y-1.5">
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
                        ? 'bg-aurora/15 text-aurora border border-aurora/35 font-bold shadow-sm'
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
          <div id="section-architecture" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.10] pb-4">
              <div>
                <GlassBadge variant="aurora" dot size="sm" className="mb-2">
                  Figure 6.1 Synthesized Architecture
                </GlassBadge>
                <h2 className="text-xl sm:text-2xl font-black text-cool-primary tracking-tight">5. System Architecture & Component Diagram</h2>
              </div>
              <span className="text-xs text-cool-muted font-mono font-medium">Dynamic SVG</span>
            </div>

            {/* Embedded High-Resolution SVG Canvas */}
            <div className="rounded-2xl overflow-hidden bg-[rgba(21,28,50,0.85)] border border-white/[0.12] p-4 sm:p-6 shadow-inner backdrop-blur-md">
              <div
                className="w-full overflow-x-auto flex justify-center py-2"
                dangerouslySetInnerHTML={{ __html: report.architectureDiagramSvg }}
              />
            </div>

            {/* Architecture Narrative */}
            <div className="p-5 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.12] text-xs sm:text-sm text-cool-primary leading-relaxed whitespace-pre-line font-normal backdrop-blur-sm">
              {report.architectureDescription}
            </div>
          </div>

          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <div id="section-summary" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">1. Executive Summary & Project Profile</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.executiveSummary}
            </div>
          </div>

          {/* SECTION 2: PROJECT OVERVIEW */}
          <div id="section-overview" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">2. Project Overview & Capabilities</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.projectOverview}
            </div>
          </div>

          {/* SECTION 3: TECHNOLOGY STACK */}
          <div id="section-tech" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-6">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">3. Technology Stack & Dependencies</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl glass-stat-tile">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Languages</span>
                <p className="text-xs font-bold text-cool-primary mt-1 font-mono">
                  {report.detectedTechnologies.languages.join(', ') || 'Auto-detected'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl glass-stat-tile">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Frontend</span>
                <p className="text-xs font-bold text-aurora mt-1">
                  {report.detectedTechnologies.frontend.join(', ') || 'N/A'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl glass-stat-tile">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Authentication</span>
                <p className="text-xs font-bold text-cool-primary mt-1">
                  {report.detectedTechnologies.auth?.join(', ') || 'None declared'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl glass-stat-tile">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Database & Storage</span>
                <p className="text-xs font-bold text-status-success mt-1">
                  {report.detectedTechnologies.database.join(', ') || 'None declared'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl glass-stat-tile">
                <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Server Runtime</span>
                <p className="text-xs font-bold text-cool-primary mt-1">
                  {report.detectedTechnologies.backend.join(', ') || 'None (Client BaaS / SPA)'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl glass-stat-tile">
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
          <div id="section-structure" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">4. Directory Structure (ASCII Code Tree)</h2>
            <div className="bg-[rgba(21,28,50,0.85)] p-5 rounded-2xl border border-white/[0.12] font-mono text-[11px] text-cool-primary overflow-x-auto leading-relaxed max-h-96 backdrop-blur-md">
              <pre>{report.documentation.projectStructureTree}</pre>
            </div>
          </div>

          {/* SECTION 6: MODULE & COMPONENT DETAILS */}
          <div id="section-modules" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">6. Module & Component Details</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.moduleDetails}
            </div>
          </div>

          {/* SECTION 7: DATA FLOW */}
          <div id="section-dataflow" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">7. Data Flow & Communication</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.dataFlowDescription}
            </div>
          </div>

          {/* SECTION 8: DATABASE DESIGN */}
          <div id="section-database" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">8. Database Design & Schemas</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.databaseDesignDescription}
            </div>
          </div>

          {/* SECTION 9: API DOCUMENTATION */}
          <div id="section-api" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">9. API Documentation & Endpoints</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.apiDocumentationDescription}
            </div>
          </div>

          {/* SECTION 10: SETUP & EXECUTION */}
          <div id="section-setup" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">10. Setup & Execution Guide</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.setupAndExecutionInstructions}
            </div>
          </div>

          {/* SECTION 11: TESTING & QUALITY */}
          <div id="section-testing" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">11. Testing & Quality Verification</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.testingAndQualityDescription}
            </div>
          </div>

          {/* SECTION 12: LIMITATIONS */}
          <div id="section-limitations" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">12. Limitations & Observations</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.limitationsAndObservations}
            </div>
          </div>

          {/* SECTION 13: APPENDIX */}
          <div id="section-appendix" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
            <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">13. Appendix & File Inventory</h2>
            <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
              {report.documentation.appendix}
            </div>
          </div>

          {/* Bottom Export Action Card */}
          <div className="p-8 rounded-3xl glass-card-elevated flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-cool-primary">Camera-Ready Document Package</h3>
              <p className="text-xs sm:text-sm text-cool-muted">
                Download the complete typeset Word DOCX deliverable including embedded vector architecture topology.
              </p>
            </div>
            <a
              href={getDownloadDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-aurora hover:bg-aurora-hover active:bg-aurora-active text-[#151C32] font-extrabold text-sm shadow-aurora-sm hover:shadow-aurora-md border border-aurora/50 transition-all transform hover:-translate-y-0.5 flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.40)]"
            >
              <Download className="w-4 h-4 text-[#151C32]" />
              <span>Download DOCX Report</span>
            </a>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
