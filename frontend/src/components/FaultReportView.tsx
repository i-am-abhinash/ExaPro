import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Download,
  FileCode,
  Search,
  Filter,
  Terminal,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code2,
  Activity,
  FileJson,
  FileText,
} from 'lucide-react';
import { ITestRunData, IFaultFinding, ITestCase, FindingSeverity, FindingVerificationStatus } from '../types';
import { getDownloadFaultReportDocxUrl, getDownloadFaultReportJsonUrl } from '../services/api';
import { GlassButton, GlassBadge, GlassInput } from './ui';

interface FaultReportViewProps {
  projectId: string;
  projectName: string;
  testRun: ITestRunData;
}

export const FaultReportView: React.FC<FaultReportViewProps> = ({
  projectId,
  projectName,
  testRun,
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'tests' | 'environment'>('findings');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  const summary = testRun.summary || {
    totalTests: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    notTested: 0,
    totalFindings: 0,
    confirmedFaults: 0,
    potentialFaults: 0,
    severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
    qualityScore: 100,
    qualityGrade: 'A',
    qualityScoreRationale: 'All verification checks passed.',
    testCoveragePercent: 0,
  };

  const environment = testRun.environment || {
    isAvailable: false,
    runtimeType: 'none',
    securityProfile: 'Strict host-isolation sandbox profile',
    reason: 'Container runtime daemon unavailable',
    remediation: 'Install and start Docker Desktop to enable live application execution tests.',
    resourceLimits: {
      cpuLimit: '1.0',
      memoryLimit: '1024m',
      timeoutSeconds: 120,
      networkRestricted: true,
      nonRoot: true,
    },
  };

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    let list = testRun.findings || [];

    if (severityFilter !== 'all') {
      list = list.filter((f) => f.severity.toLowerCase() === severityFilter.toLowerCase());
    }

    if (statusFilter !== 'all') {
      list = list.filter((f) => f.verificationStatus.toLowerCase() === statusFilter.toLowerCase());
    }

    if (categoryFilter !== 'all') {
      list = list.filter((f) => f.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          (f.filePath && f.filePath.toLowerCase().includes(q)) ||
          (f.ruleId && f.ruleId.toLowerCase().includes(q)) ||
          (f.affectedRouteOrEndpoint && f.affectedRouteOrEndpoint.toLowerCase().includes(q))
      );
    }

    return list;
  }, [testRun.findings, severityFilter, statusFilter, categoryFilter, searchQuery]);

  // Filtered Test Cases
  const filteredTests = useMemo(() => {
    let list = testRun.testPlan || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.target.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [testRun.testPlan, searchQuery]);

  // Quality Grade Theme styling
  const gradeColor =
    summary.qualityGrade === 'A'
      ? 'text-[#54D6A0] bg-[#54D6A0]/15 border-[#54D6A0]/40'
      : summary.qualityGrade === 'B'
      ? 'text-[#8295FF] bg-[#8295FF]/15 border-[#8295FF]/40'
      : summary.qualityGrade === 'C'
      ? 'text-[#FFC66D] bg-[#FFC66D]/15 border-[#FFC66D]/40'
      : summary.qualityGrade === 'D'
      ? 'text-[#FF9F5A] bg-[#FF9F5A]/15 border-[#FF9F5A]/40'
      : 'text-[#FF8195] bg-[#FF8195]/15 border-[#FF8195]/40';

  return (
    <div className="space-y-8">
      {/* 1. Executive Quality Scorecard & Summary Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card-elevated space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-white/[0.10] pb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <GlassBadge variant="aurora" dot size="sm">
                Software Quality & Fault Evaluation
              </GlassBadge>
              <span className="text-xs text-cool-muted font-mono">
                {testRun.findings?.length || 0} findings recorded
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-cool-primary tracking-tight">
              Software Quality & Fault Report
            </h2>
            <p className="text-xs sm:text-sm text-cool-secondary max-w-2xl leading-relaxed">
              Synthesized automated defect analysis, execution matrix, and transparent quality grading based on verifiable line-level inspection.
            </p>
          </div>

          {/* Action Downloads */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={getDownloadFaultReportDocxUrl(projectId)}
              download
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-aurora hover:bg-aurora-hover text-[#151C32] font-bold text-xs shadow-aurora-sm border border-aurora/50 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 text-[#151C32]" />
              <span>Download Fault DOCX</span>
            </a>

            <a
              href={getDownloadFaultReportJsonUrl(projectId)}
              download
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl glass-tile-interactive text-cool-primary border border-white/[0.15] text-xs font-bold transition-colors"
            >
              <FileJson className="w-4 h-4 text-teal" />
              <span>Raw JSON</span>
            </a>
          </div>
        </div>

        {/* Quality Score HUD Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Quality Score Meter */}
          <div className="p-5 rounded-2xl bg-[rgba(21,28,50,0.85)] border border-white/[0.12] flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-mono font-black ${gradeColor}`}>
              <span className="text-2xl leading-none">{summary.qualityGrade}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider mt-0.5">Grade</span>
            </div>
            <div>
              <p className="text-xs text-cool-muted font-medium">Quality Score</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-cool-primary">{summary.qualityScore}</span>
                <span className="text-xs text-cool-muted font-mono">/ 100</span>
              </div>
              <p className="text-[11px] text-cool-muted truncate max-w-[150px]">
                {summary.qualityScore >= 80 ? 'Production Ready' : summary.qualityScore >= 60 ? 'Needs Attention' : 'Critical Defects'}
              </p>
            </div>
          </div>

          {/* Confirmed vs Potential Faults */}
          <div className="p-5 rounded-2xl bg-[rgba(21,28,50,0.85)] border border-white/[0.12] space-y-1">
            <p className="text-xs text-cool-muted font-medium">Fault Verification</p>
            <div className="flex items-center space-x-4 pt-1">
              <div>
                <span className="text-2xl font-black text-[#FF8195]">{summary.confirmedFaults}</span>
                <p className="text-[10px] text-cool-muted uppercase font-bold">Confirmed</p>
              </div>
              <div className="h-8 w-px bg-white/[0.10]" />
              <div>
                <span className="text-2xl font-black text-[#FFC66D]">{summary.potentialFaults}</span>
                <p className="text-[10px] text-cool-muted uppercase font-bold">Potential</p>
              </div>
            </div>
          </div>

          {/* Test Execution Stats */}
          <div className="p-5 rounded-2xl bg-[rgba(21,28,50,0.85)] border border-white/[0.12] space-y-1">
            <p className="text-xs text-cool-muted font-medium">Automated Tests</p>
            <div className="flex items-center space-x-3 pt-1">
              <div>
                <span className="text-2xl font-black text-[#54D6A0]">{summary.passed}</span>
                <p className="text-[10px] text-cool-muted uppercase font-bold">Passed</p>
              </div>
              <div className="h-8 w-px bg-white/[0.10]" />
              <div>
                <span className="text-2xl font-black text-[#FF8195]">{summary.failed}</span>
                <p className="text-[10px] text-cool-muted uppercase font-bold">Failed</p>
              </div>
              <div className="h-8 w-px bg-white/[0.10]" />
              <div>
                <span className="text-2xl font-black text-cool-muted">{summary.blocked}</span>
                <p className="text-[10px] text-cool-muted uppercase font-bold">Blocked</p>
              </div>
            </div>
          </div>

          {/* Sandbox Status Tile */}
          <div className="p-5 rounded-2xl bg-[rgba(21,28,50,0.85)] border border-white/[0.12] space-y-1">
            <p className="text-xs text-cool-muted font-medium">Execution Sandbox</p>
            <div className="flex items-center space-x-2 pt-1">
              {environment.isAvailable ? (
                <ShieldCheck className="w-5 h-5 text-[#54D6A0]" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#FFC66D]" />
              )}
              <span className="text-sm font-bold text-cool-primary">
                {environment.isAvailable ? 'Docker Isolated' : 'Host Protection Active'}
              </span>
            </div>
            <p className="text-[11px] text-cool-muted">
              {environment.isAvailable
                ? `Memory limit: ${environment.resourceLimits.memoryLimit}`
                : 'Untrusted host execution blocked'}
            </p>
          </div>
        </div>

        {/* Quality Score Rationale Banner */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-cool-secondary flex items-start space-x-3">
          <Activity className="w-4 h-4 text-aurora flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-cool-primary">Score Derivation Rationale</p>
            <p className="font-mono text-[11px] leading-relaxed">{summary.qualityScoreRationale}</p>
          </div>
        </div>
      </div>

      {/* 2. Host Isolation & Security Profile Notice (If Docker Unavailable) */}
      {!environment.isAvailable && (
        <div className="p-6 rounded-3xl bg-[rgba(255,198,109,0.06)] border border-[#FFC66D]/30 space-y-3 backdrop-blur-md">
          <div className="flex items-center space-x-3 text-[#FFC66D]">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Host Security Protection Enforced: Container Sandbox Blocked
            </h3>
          </div>
          <p className="text-xs text-cool-secondary leading-relaxed">
            ExaPro enforces a strict zero-trust sandbox policy. To protect the host operating system from untrusted code, runtime tests were reported as <span className="font-bold text-[#FFC66D]">blocked</span> rather than executed directly on the host machine.
          </p>
          {environment.reason && (
            <div className="p-3 rounded-xl bg-[rgba(21,28,50,0.70)] border border-white/[0.10] text-[11px] font-mono text-cool-muted space-y-1">
              <p><span className="text-cool-primary font-bold">Diagnostic:</span> {environment.reason}</p>
              {environment.remediation && (
                <p><span className="text-aurora font-bold">Remediation:</span> {environment.remediation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Sub-Navigation Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex p-1 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.10] backdrop-blur-md w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'findings'
                ? 'bg-aurora/15 text-aurora border border-aurora/30 shadow-sm'
                : 'text-cool-muted hover:text-cool-primary'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Defect Findings ({filteredFindings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tests'
                ? 'bg-aurora/15 text-aurora border border-aurora/30 shadow-sm'
                : 'text-cool-muted hover:text-cool-primary'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Execution Matrix ({filteredTests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('environment')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'environment'
                ? 'bg-aurora/15 text-aurora border border-aurora/30 shadow-sm'
                : 'text-cool-muted hover:text-cool-primary'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Sandbox Configuration</span>
          </button>
        </div>

        {/* Global Search Input */}
        <div className="w-full sm:w-72">
          <GlassInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, routes, files..."
            icon={<Search className="w-3.5 h-3.5 text-cool-muted" />}
          />
        </div>
      </div>

      {/* 4. TAB 1: DEFECT FINDINGS VIEW */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl glass-card flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-cool-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </span>

            {/* Severity Filter */}
            <div className="flex items-center space-x-1 bg-[rgba(21,28,50,0.60)] p-1 rounded-xl border border-white/[0.10]">
              {['all', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                    severityFilter.toLowerCase() === sev.toLowerCase()
                      ? 'bg-aurora/20 text-aurora font-bold'
                      : 'text-cool-muted hover:text-cool-primary'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Verification Status Filter */}
            <div className="flex items-center space-x-1 bg-[rgba(21,28,50,0.60)] p-1 rounded-xl border border-white/[0.10]">
              {['all', 'confirmed', 'potential', 'blocked'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                    statusFilter.toLowerCase() === st.toLowerCase()
                      ? 'bg-aurora/20 text-aurora font-bold'
                      : 'text-cool-muted hover:text-cool-primary'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-card space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#54D6A0] mx-auto" />
              <p className="font-bold text-cool-primary text-base">No defects matched current criteria</p>
              <p className="text-xs text-cool-muted">Try clearing the search query or adjusting your severity filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFindings.map((finding) => {
                const isExpanded = expandedFindingId === finding.id;

                const sevBadge =
                  finding.severity === 'Critical'
                    ? 'text-[#FF8195] bg-[#FF8195]/15 border-[#FF8195]/40'
                    : finding.severity === 'High'
                    ? 'text-[#FF9F5A] bg-[#FF9F5A]/15 border-[#FF9F5A]/40'
                    : finding.severity === 'Medium'
                    ? 'text-[#FFC66D] bg-[#FFC66D]/15 border-[#FFC66D]/40'
                    : 'text-[#8295FF] bg-[#8295FF]/15 border-[#8295FF]/40';

                const statusBadge =
                  finding.verificationStatus === 'confirmed'
                    ? 'text-[#54D6A0] bg-[#54D6A0]/15 border-[#54D6A0]/30'
                    : finding.verificationStatus === 'potential'
                    ? 'text-[#FFC66D] bg-[#FFC66D]/15 border-[#FFC66D]/30'
                    : 'text-cool-muted bg-white/[0.06] border-white/[0.10]';

                return (
                  <div
                    key={finding.id}
                    className="rounded-2xl glass-card-elevated border border-white/[0.12] overflow-hidden transition-all duration-200"
                  >
                    {/* Finding Header Bar */}
                    <div
                      onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                      className="p-5 cursor-pointer hover:bg-white/[0.04] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase border ${sevBadge}`}>
                            {finding.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase border ${statusBadge}`}>
                            {finding.verificationStatus}
                          </span>
                          {finding.ruleId && (
                            <span className="text-[10px] text-cool-muted font-mono font-medium">
                              Rule: {finding.ruleId}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-cool-primary tracking-tight">
                          {finding.title}
                        </h4>

                        {/* File Coordinates / Line Reference */}
                        {finding.filePath && (
                          <div className="flex items-center space-x-2 text-xs text-cool-muted font-mono">
                            <Code2 className="w-3.5 h-3.5 text-aurora flex-shrink-0" />
                            <span className="text-cool-primary font-semibold">{finding.filePath}</span>
                            {finding.lineRange?.start && (
                              <span className="text-aurora">
                                :L{finding.lineRange.start}
                                {finding.lineRange.end && finding.lineRange.end !== finding.lineRange.start
                                  ? `-L${finding.lineRange.end}`
                                  : ''}
                              </span>
                            )}
                            {finding.affectedRouteOrEndpoint && (
                              <span className="text-teal pl-2">• Route: {finding.affectedRouteOrEndpoint}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <span className="text-xs font-semibold text-cool-muted">
                          {isExpanded ? 'Collapse' : 'Details'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-cool-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cool-muted" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Finding Details Body */}
                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-white/[0.08] space-y-5 bg-[rgba(15,21,35,0.40)]">
                        {/* Description */}
                        <div className="space-y-1 pt-4">
                          <p className="text-xs font-bold text-cool-muted uppercase tracking-wider">Description</p>
                          <p className="text-xs sm:text-sm text-cool-primary leading-relaxed">
                            {finding.description}
                          </p>
                        </div>

                        {/* Behavior Expectation vs Actual */}
                        {(finding.expectedBehavior || finding.actualBehavior) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                              <p className="font-bold text-[#54D6A0]">Expected Behavior</p>
                              <p className="text-cool-secondary leading-relaxed">
                                {finding.expectedBehavior || 'Standard compliant execution.'}
                              </p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                              <p className="font-bold text-[#FF8195]">Actual Behavior</p>
                              <p className="text-cool-secondary leading-relaxed">
                                {finding.actualBehavior || 'Defect manifestation identified.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Evidence & Snippet */}
                        {finding.evidence && finding.evidence.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-cool-muted uppercase tracking-wider">
                              Verifiable Evidence
                            </p>
                            {finding.evidence.map((ev) => (
                              <div
                                key={ev.id}
                                className="rounded-xl overflow-hidden bg-[rgba(10,13,22,0.90)] border border-white/[0.12] p-3 text-xs font-mono"
                              >
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.10] text-[11px] text-cool-muted">
                                  <span>{ev.title}</span>
                                  {ev.lineNumber && <span>Line: {ev.lineNumber}</span>}
                                </div>
                                <pre className="overflow-x-auto text-cool-primary whitespace-pre-wrap leading-relaxed text-[11px]">
                                  {ev.data}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Steps to Reproduce */}
                        {finding.stepsToReproduce && finding.stepsToReproduce.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-cool-muted uppercase tracking-wider">
                              Steps to Reproduce
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-xs text-cool-secondary font-mono">
                              {finding.stepsToReproduce.map((step, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Prescriptive Suggested Fix */}
                        {finding.suggestedFix && (
                          <div className="p-4 rounded-xl bg-aurora/10 border border-aurora/30 space-y-1">
                            <p className="text-xs font-bold text-aurora uppercase tracking-wider flex items-center space-x-1.5">
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Prescriptive Remediation Fix</span>
                            </p>
                            <p className="text-xs text-cool-primary leading-relaxed whitespace-pre-line font-mono">
                              {finding.suggestedFix}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: TEST EXECUTION MATRIX VIEW */}
      {activeTab === 'tests' && (
        <div className="p-6 rounded-3xl glass-card-elevated space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.10] pb-4">
            <div>
              <h3 className="text-lg font-bold text-cool-primary tracking-tight">
                Automated Test Execution Matrix
              </h3>
              <p className="text-xs text-cool-muted">
                Inspection results across application lifecycle: startup, readiness, blank-page detection, console errors, network integrity, and API routes.
              </p>
            </div>
            <span className="text-xs text-cool-muted font-mono">{filteredTests.length} test cases</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[rgba(21,28,50,0.85)] text-cool-muted border-b border-white/[0.12] uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Test Case & Target</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expected Outcome</th>
                  <th className="py-3 px-4">Outcome / Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-cool-primary">
                {filteredTests.map((test) => {
                  const statusPill =
                    test.status === 'passed'
                      ? 'text-[#54D6A0] bg-[#54D6A0]/15 border-[#54D6A0]/30'
                      : test.status === 'failed'
                      ? 'text-[#FF8195] bg-[#FF8195]/15 border-[#FF8195]/30'
                      : test.status === 'blocked'
                      ? 'text-[#FFC66D] bg-[#FFC66D]/15 border-[#FFC66D]/30'
                      : 'text-cool-muted bg-white/[0.06] border-white/[0.10]';

                  return (
                    <tr key={test.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 font-semibold max-w-[240px]">
                        <p className="truncate font-bold text-cool-primary">{test.name}</p>
                        <p className="text-[11px] text-cool-muted font-mono truncate">{test.target}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-cool-muted font-mono">{test.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase border ${statusPill}`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-cool-secondary max-w-[220px]">
                        <p className="line-clamp-2 text-[11px]">{test.expectedOutcome}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <p className="text-[11px] text-cool-muted truncate font-mono">
                          {test.actualOutcome || test.blockingReason || test.errorDetails || '—'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 3: SANDBOX ENVIRONMENT & SECURITY PROFILE */}
      {activeTab === 'environment' && (
        <div className="p-6 sm:p-8 rounded-3xl glass-card-elevated space-y-6">
          <div className="border-b border-white/[0.10] pb-4 space-y-1">
            <h3 className="text-xl font-black text-cool-primary tracking-tight">
              Isolated Sandbox Execution Profile
            </h3>
            <p className="text-xs text-cool-secondary">
              Execution boundaries, security hardening parameters, and diagnostic container profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.12] space-y-1">
              <p className="text-xs text-cool-muted">Container Runtime Engine</p>
              <p className="text-sm font-bold text-cool-primary font-mono">{environment.runtimeType}</p>
              <p className="text-[11px] text-cool-muted">
                {environment.isAvailable ? 'Docker container engine detected' : 'Engine daemon unreachable'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.12] space-y-1">
              <p className="text-xs text-cool-muted">Security Constraint Profile</p>
              <p className="text-sm font-bold text-cool-primary font-mono">{environment.securityProfile}</p>
              <p className="text-[11px] text-cool-muted">Non-root container user enforced</p>
            </div>

            <div className="p-4 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.12] space-y-1">
              <p className="text-xs text-cool-muted">Allocated Resource Limits</p>
              <p className="text-sm font-bold text-cool-primary font-mono">
                {environment.resourceLimits.cpuLimit} CPU / {environment.resourceLimits.memoryLimit} RAM
              </p>
              <p className="text-[11px] text-cool-muted">
                Timeout cap: {environment.resourceLimits.timeoutSeconds} seconds
              </p>
            </div>
          </div>

          {/* Remediation Guide if Blocked */}
          {!environment.isAvailable && (
            <div className="p-5 rounded-2xl bg-[rgba(21,28,50,0.85)] border border-[#FFC66D]/30 space-y-3">
              <h4 className="text-xs font-bold text-[#FFC66D] uppercase tracking-wider flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span>How to Enable Isolated Dynamic Testing</span>
              </h4>
              <p className="text-xs text-cool-secondary leading-relaxed">
                To execute applications in an isolated container sandbox without endangering the host:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-cool-primary font-mono">
                <li>Install Docker Desktop for Windows from the official Docker website.</li>
                <li>Start Docker Desktop and ensure the daemon is running (<code className="text-aurora">docker info</code>).</li>
                <li>Re-run the ExaPro project analysis. ExaPro will automatically detect the container runtime and safely execute dynamic test cases.</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
