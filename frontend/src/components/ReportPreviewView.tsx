import React, { useState, useEffect, useMemo } from 'react';
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
  Lock,
  Settings,
  Cpu,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Target,
  Wrench,
  Boxes,
  Activity,
  Search,
} from 'lucide-react';
import { IReportData, ITestRunData, IEvidenceFinding } from '../types';
import {
  fetchProjectReport,
  fetchTestRun,
  getDownloadDocxUrl,
  getDownloadFaultReportDocxUrl,
  getDownloadFaultReportJsonUrl,
} from '../services/api';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [findingSearchQuery, setFindingSearchQuery] = useState('');
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('all');

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sourceFindings: IEvidenceFinding[] = useMemo(() => {
    if (report?.structuredAnalysis?.sourceFindings) {
      return report.structuredAnalysis.sourceFindings;
    }
    return [];
  }, [report]);

  const filteredSourceFindings = useMemo(() => {
    let list = sourceFindings;
    if (findingSeverityFilter !== 'all') {
      list = list.filter((f) => f.severity.toLowerCase() === findingSeverityFilter.toLowerCase());
    }
    if (findingSearchQuery.trim()) {
      const q = findingSearchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          (f.filePath && f.filePath.toLowerCase().includes(q)) ||
          f.ruleId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sourceFindings, findingSeverityFilter, findingSearchQuery]);

  const coverage = report?.structuredAnalysis?.coverage;

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
    { id: 'purpose', title: '3. Purpose & Problem', icon: Target },
    { id: 'tech', title: '4. Technology Stack', icon: Layers },
    { id: 'structure', title: '5. Directory Structure', icon: Code },
    { id: 'architecture', title: '6. System Architecture', icon: Sparkles },
    { id: 'modules', title: '7. Module Breakdown', icon: Boxes },
    { id: 'entrypoints', title: '8. Entry Points & Startup', icon: Terminal },
    { id: 'dataflow', title: '9. Data Flow Models', icon: Route },
    { id: 'api', title: '10. API Documentation', icon: Route },
    { id: 'database', title: '11. Database Design', icon: Database },
    { id: 'auth', title: '12. Auth & Security', icon: Lock },
    { id: 'config', title: '13. Configuration & Env', icon: Settings },
    { id: 'setup', title: '14. Setup & Execution', icon: Terminal },
    { id: 'build', title: '15. Build & Development', icon: Wrench },
    { id: 'testing', title: '16. Testing & Quality', icon: CheckCircle },
    { id: 'integrations', title: '17. External Integrations', icon: ExternalLink },
    { id: 'security', title: '18. Security Observations', icon: ShieldAlert },
    { id: 'limitations', title: '19. Limitations & Debt', icon: AlertTriangle },
    { id: 'findings', title: '20. Verified Source Findings', icon: FileCode, count: sourceFindings.length },
    { id: 'coverage', title: '21. Coverage & Scope', icon: Activity },
    { id: 'appendix', title: '22. Appendix & Inventory', icon: FileText },
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
                {report.submissionType === 'github' ? (
                  <Github className="w-3.5 h-3.5 text-teal" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-aurora" />
                )}
                <span className="font-mono">{report.repositoryUrl || report.uploadedFileName}</span>
              </span>
              {report.commitSha && (
                <span>
                  • Commit: <code className="font-mono text-cool-primary font-bold">{report.commitSha}</code>
                </span>
              )}
              <span>• Generated: {new Date(report.createdAt).toLocaleDateString()}</span>
              {report.usedAiFallback && (
                <GlassBadge variant="warning" size="sm">
                  Deterministic Verified Fallback
                </GlassBadge>
              )}
            </div>
          </div>

          {/* Download Buttons Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 pl-8 sm:pl-0">
            <a
              href={getDownloadDocxUrl(report.projectId)}
              download
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-aurora hover:bg-aurora-hover active:bg-aurora-active text-[#151C32] font-bold text-xs shadow-aurora-sm border border-aurora/50 transition-all transform hover:-translate-y-0.5"
              title="Download 20-section Technical Architecture DOCX"
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
              <span>Report A: Architecture & Verification</span>
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
            <div className="p-4 rounded-2xl glass-card space-y-1.5 max-h-[85vh] overflow-y-auto">
              <h3 className="text-xs font-bold text-cool-muted uppercase tracking-wider px-3 py-1.5">
                Report Sections ({sectionsList.length})
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
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-aurora/15 text-aurora border border-aurora/35 font-bold shadow-sm'
                          : 'text-cool-muted hover:text-cool-primary hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{sec.title}</span>
                      </div>
                      {typeof sec.count === 'number' && sec.count > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-aurora/20 text-aurora font-bold ml-1">
                          {sec.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* High-Contrast Document Content View */}
          <div className="lg:col-span-3 space-y-8">
            {/* SECTION 6: SYSTEM ARCHITECTURE DIAGRAM */}
            <div id="section-architecture" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.10] pb-4">
                <div>
                  <GlassBadge variant="aurora" dot size="sm" className="mb-2">
                    Figure 6.1 Synthesized Architecture
                  </GlassBadge>
                  <h2 className="text-xl sm:text-2xl font-black text-cool-primary tracking-tight">
                    6. System Architecture & Topology Diagram
                  </h2>
                </div>
                <span className="text-xs text-cool-muted font-mono font-medium">Verified Static SVG</span>
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
                {report.documentation.systemArchitectureDescription || report.architectureDescription}
              </div>
            </div>

            {/* SECTION 1: EXECUTIVE SUMMARY */}
            <div id="section-summary" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                1. Executive Summary & Project Profile
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.executiveSummary}
              </div>
            </div>

            {/* SECTION 2: PROJECT OVERVIEW */}
            <div id="section-overview" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                2. Project Overview & Scope
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.projectOverview}
              </div>
            </div>

            {/* SECTION 3: PURPOSE & TARGET PROBLEM */}
            <div id="section-purpose" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                3. Purpose, Core Functionality & Target Problem
              </h2>
              <div className="space-y-4 text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.purposeAndFunctionality && (
                  <div>{report.documentation.purposeAndFunctionality}</div>
                )}
                {report.documentation.problemStatement && (
                  <div className="p-4 rounded-2xl bg-[rgba(21,28,50,0.50)] border border-white/[0.08]">
                    {report.documentation.problemStatement}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: TECHNOLOGY STACK */}
            <div id="section-tech" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-6">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                4. Technology Stack & Dependencies
              </h2>

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

            {/* SECTION 5: PROJECT DIRECTORY STRUCTURE */}
            <div id="section-structure" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.10] pb-3">
                <h2 className="text-xl font-bold text-cool-primary tracking-tight">5. Project Directory Structure</h2>
                <button
                  onClick={() => handleCopy(report.documentation.projectStructureTree, 'tree')}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono glass-tile-interactive text-cool-muted hover:text-cool-primary"
                >
                  {copiedId === 'tree' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tree' ? 'Copied' : 'Copy Tree'}</span>
                </button>
              </div>
              <div className="bg-[rgba(21,28,50,0.85)] p-5 rounded-2xl border border-white/[0.12] font-mono text-[11px] text-cool-primary overflow-x-auto leading-relaxed max-h-96 backdrop-blur-md">
                <pre>{report.documentation.projectStructureTree}</pre>
              </div>
            </div>

            {/* SECTION 7: MODULE BREAKDOWN */}
            <div id="section-modules" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                7. Detailed Module & Subsystem Breakdown
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.moduleDetails}
              </div>
            </div>

            {/* SECTION 8: ENTRY POINTS & APPLICATION STARTUP */}
            <div id="section-entrypoints" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                8. Entry Points & Application Startup Flow
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.entryPointsAndStartup ||
                  'No specialized startup orchestration detected outside primary package manifests.'}
              </div>
            </div>

            {/* SECTION 9: DATA FLOW */}
            <div id="section-dataflow" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                9. Data Flow & Communication Models
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.dataFlowDescription}
              </div>
            </div>

            {/* SECTION 10: API DOCUMENTATION */}
            <div id="section-api" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                10. API Documentation & Endpoints
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.apiDocumentationDescription}
              </div>
            </div>

            {/* SECTION 11: DATABASE DESIGN */}
            <div id="section-database" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                11. Database Design & Data Models
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.databaseDesignDescription}
              </div>
            </div>

            {/* SECTION 12: AUTH & SECURITY */}
            <div id="section-auth" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                12. Authentication, Authorization & Security Architecture
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.authImplementation ||
                  'No dedicated user authentication modules identified in scanned manifest dependencies.'}
              </div>
            </div>

            {/* SECTION 13: CONFIGURATION & ENVIRONMENT */}
            <div id="section-config" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                13. Configuration & Environment Variables
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.configurationAndEnvironment ||
                  'No specialized environment variables or .env schema declared in project manifests.'}
              </div>
            </div>

            {/* SECTION 14: SETUP & EXECUTION */}
            <div id="section-setup" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                14. Setup, Installation & Execution Guide
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.setupAndExecutionInstructions}
              </div>
            </div>

            {/* SECTION 15: BUILD & DEVELOPMENT */}
            <div id="section-build" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                15. Build, Bundling & Development Workflows
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.buildAndDevelopment ||
                  'Standard build workflows inferred from project manifest scripts.'}
              </div>
            </div>

            {/* SECTION 16: TESTING & QUALITY */}
            <div id="section-testing" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                16. Testing, Verification & Quality Assessment
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.testingAndQualityDescription}
              </div>
            </div>

            {/* SECTION 17: EXTERNAL INTEGRATIONS */}
            <div id="section-integrations" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                17. External Integrations & 3rd-Party Services
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.externalIntegrations ||
                  'No active external webhooks or third-party cloud SDKs observed in inspected source code.'}
              </div>
            </div>

            {/* SECTION 18: SECURITY OBSERVATIONS */}
            <div id="section-security" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                18. Security Observations & Code Hygiene
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.securityObservations ||
                  'No security issues detected during static AST evaluation.'}
              </div>
            </div>

            {/* SECTION 19: LIMITATIONS & DEBT */}
            <div id="section-limitations" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                19. Known Limitations, Architecture Smells & Constraints
              </h2>
              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.limitationsAndObservations}
              </div>
            </div>

            {/* SECTION 20: VERIFIED SOURCE FINDINGS (17-FIELD EVIDENCE AST) */}
            <div id="section-findings" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.10] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <GlassBadge variant="aurora" size="sm">
                      AST & Compiler Inspection
                    </GlassBadge>
                    <span className="text-xs text-cool-muted font-mono">
                      {sourceFindings.length} verified finding{sourceFindings.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-cool-primary tracking-tight mt-1">
                    20. Verified Source Defect Findings & Traceable Evidence
                  </h2>
                </div>
              </div>

              {/* Finding Controls */}
              {sourceFindings.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cool-muted" />
                    <input
                      type="text"
                      placeholder="Search findings by rule, message, or file path..."
                      value={findingSearchQuery}
                      onChange={(e) => setFindingSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[rgba(21,28,50,0.60)] border border-white/[0.12] text-xs text-cool-primary placeholder-cool-muted focus:outline-none focus:border-aurora/50"
                    />
                  </div>
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                    {['all', 'critical', 'high', 'medium', 'low', 'informational'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setFindingSeverityFilter(sev)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                          findingSeverityFilter === sev
                            ? 'bg-aurora/20 text-aurora border border-aurora/40'
                            : 'bg-white/[0.04] text-cool-muted hover:text-cool-primary border border-white/[0.06]'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Finding Cards List */}
              {filteredSourceFindings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[rgba(21,28,50,0.40)] border border-white/[0.08] space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-status-success mx-auto" />
                  <p className="font-bold text-cool-primary text-sm">
                    {sourceFindings.length === 0
                      ? 'No Syntax or Static Defect Findings Detected'
                      : 'No findings match current search filter'}
                  </p>
                  <p className="text-xs text-cool-muted max-w-md mx-auto">
                    {sourceFindings.length === 0
                      ? 'All analyzed source modules passed compiler syntax checks, import resolution, and safety rules without defect alerts.'
                      : 'Try resetting your search query or severity filter.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSourceFindings.map((finding) => {
                    const isCopied = copiedId === finding.id;
                    const sevLower = String(finding.severity).toLowerCase();
                    const sevColor =
                      sevLower === 'critical'
                        ? 'border-status-error-border text-status-error bg-[#FF8998]/10'
                        : sevLower === 'high'
                        ? 'border-[#FF8998]/40 text-[#FF8998] bg-[#FF8998]/10'
                        : sevLower === 'medium'
                        ? 'border-[#FFC66D]/40 text-[#FFC66D] bg-[#FFC66D]/10'
                        : 'border-aurora/40 text-aurora bg-aurora/10';

                    return (
                      <div
                        key={finding.id}
                        className="p-5 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.12] space-y-3.5 backdrop-blur-sm"
                      >
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${sevColor}`}>
                              {finding.severity}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.06] text-cool-muted border border-white/[0.08]">
                              {finding.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-teal bg-teal/10 border border-teal/20">
                              {finding.analysisType}
                            </span>
                            <span className="text-xs font-mono font-bold text-cool-muted">
                              {finding.ruleId}
                            </span>
                          </div>

                          {finding.filePath && (
                            <div className="flex items-center space-x-1.5 text-xs font-mono text-cool-primary bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.08]">
                              <FileCode className="w-3.5 h-3.5 text-aurora" />
                              <span className="truncate max-w-xs">{finding.filePath}</span>
                              {finding.startLine && (
                                <span className="text-aurora font-bold">
                                  :{finding.startLine}
                                  {finding.startColumn ? `:${finding.startColumn}` : ''}
                                  {finding.endLine && finding.endLine !== finding.startLine ? `-${finding.endLine}` : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Finding Title & Description */}
                        <div>
                          <h4 className="text-sm font-bold text-cool-primary">{finding.title}</h4>
                          <p className="text-xs text-cool-secondary mt-1 leading-relaxed">{finding.description}</p>
                        </div>

                        {/* Verified Code Excerpt */}
                        {finding.codeExcerpt && (
                          <div className="rounded-xl overflow-hidden border border-white/[0.10] bg-[#0c1222]">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.06] text-[10px] text-cool-muted font-mono">
                              <span>Verified Source Excerpt</span>
                              <button
                                onClick={() => handleCopy(finding.codeExcerpt!, finding.id)}
                                className="flex items-center space-x-1 hover:text-cool-primary transition-colors"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-3 text-[11px] font-mono text-cool-primary overflow-x-auto leading-relaxed">
                              {finding.codeExcerpt}
                            </pre>
                          </div>
                        )}

                        {/* Impact & Recommendation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                          {finding.impact && (
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                              <span className="text-[10px] font-bold text-cool-muted uppercase tracking-wider">Impact</span>
                              <p className="text-cool-secondary">{finding.impact}</p>
                            </div>
                          )}
                          {finding.recommendation && (
                            <div className="p-3 rounded-xl bg-aurora/[0.04] border border-aurora/20 space-y-1">
                              <span className="text-[10px] font-bold text-aurora uppercase tracking-wider">Recommendation</span>
                              <p className="text-cool-primary">{finding.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 21: COVERAGE ACCOUNTING & SCOPE */}
            <div id="section-coverage" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-6">
              <div className="border-b border-white/[0.10] pb-3">
                <GlassBadge variant="teal" size="sm" className="mb-2">
                  Scope Accounting & Integrity Verification
                </GlassBadge>
                <h2 className="text-xl sm:text-2xl font-black text-cool-primary tracking-tight">
                  21. Analysis Coverage Accounting & Scope Limitations
                </h2>
              </div>

              {coverage && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-2xl glass-stat-tile">
                    <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Discovered</span>
                    <p className="text-lg font-black text-cool-primary mt-1 font-mono">{coverage.totalDiscoveredFiles}</p>
                    <span className="text-[10px] text-cool-muted">repository files</span>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-stat-tile">
                    <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Inspected</span>
                    <p className="text-lg font-black text-status-success mt-1 font-mono">{coverage.inspectedFilesCount}</p>
                    <span className="text-[10px] text-status-success font-semibold">{coverage.coveragePercentage}% ratio</span>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-stat-tile">
                    <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Excluded</span>
                    <p className="text-lg font-black text-cool-muted mt-1 font-mono">{coverage.excludedFilesCount}</p>
                    <span className="text-[10px] text-cool-muted">policy ignores</span>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-stat-tile">
                    <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Unreadable/Large</span>
                    <p className="text-lg font-black text-cool-primary mt-1 font-mono">
                      {(coverage.unreadableFilesCount || 0) + (coverage.oversizedFilesCount || 0)}
                    </p>
                    <span className="text-[10px] text-cool-muted">bypassed</span>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-stat-tile">
                    <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Parse Errors</span>
                    <p className="text-lg font-black text-[#FF8998] mt-1 font-mono">
                      {coverage.parseFailedFilesCount || 0}
                    </p>
                    <span className="text-[10px] text-cool-muted">AST diagnostics</span>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-stat-tile">
                    <span className="text-[10px] text-cool-muted uppercase font-bold tracking-wider">Rules Executed</span>
                    <p className="text-lg font-black text-aurora mt-1 font-mono">
                      {coverage.rulesExecuted?.length || 15}
                    </p>
                    <span className="text-[10px] text-aurora font-semibold">static checks</span>
                  </div>
                </div>
              )}

              <div className="text-xs sm:text-sm text-cool-secondary leading-relaxed whitespace-pre-line">
                {report.documentation.coverageAndUnsupported ||
                  'Complete repository inspection successfully executed across discovered modules.'}
              </div>
            </div>

            {/* SECTION 22: APPENDIX */}
            <div id="section-appendix" className="p-6 sm:p-8 rounded-3xl workspace-card space-y-4">
              <h2 className="text-xl font-bold text-cool-primary border-b border-white/[0.10] pb-3 tracking-tight">
                22. Appendix & File Inventory
              </h2>
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
