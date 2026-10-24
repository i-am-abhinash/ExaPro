export type SubmissionType = 'zip' | 'github';
export type AnalysisStatus =
  | 'queued'
  | 'inspecting'
  | 'analyzing'
  | 'planning_tests'
  | 'preparing_environment'
  | 'running_tests'
  | 'generating_reports'
  | 'generating_docx'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed';

export type FindingCategory =
  | 'static_analysis'
  | 'build'
  | 'startup'
  | 'runtime'
  | 'ui'
  | 'api'
  | 'security'
  | 'configuration'
  | 'test_failure';

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type FindingConfidence = 'high' | 'medium' | 'low';

export type FindingVerificationStatus =
  | 'confirmed'     // Reproduced or directly established by reliable test evidence
  | 'potential'     // Detected through static analysis or heuristic inspection, not confirmed at runtime
  | 'blocked'       // Could not verify because of missing dependencies, configuration, or environment
  | 'not_tested';   // No suitable test was performed

export interface IFindingEvidence {
  id: string;
  type: 'log' | 'screenshot' | 'http_response' | 'test_output' | 'code_snippet';
  title: string;
  data: string;
  filePath?: string;
  lineNumber?: number;
  timestamp: string;
}

export interface IFaultFinding {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  verificationStatus: FindingVerificationStatus;
  filePath?: string;
  lineRange?: {
    start: number;
    end: number;
  };
  affectedRouteOrEndpoint?: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  evidence: IFindingEvidence[];
  suggestedFix: string;
  associatedTestCaseId?: string;
  ruleId?: string;
  timestamp: string;
}

export type TestCaseType =
  | 'startup'
  | 'http_readiness'
  | 'route_accessibility'
  | 'blank_page'
  | 'console_errors'
  | 'network_integrity'
  | 'ui_interaction'
  | 'api_endpoint'
  | 'project_unit_test'
  | 'configuration_sanity';

export type TestCaseStatus = 'passed' | 'failed' | 'blocked' | 'not_tested' | 'pending';

export interface ITestCase {
  id: string;
  name: string;
  category: TestCaseType;
  target: string;
  description: string;
  expectedOutcome: string;
  actualOutcome?: string;
  status: TestCaseStatus;
  durationMs?: number;
  exitCode?: number;
  errorDetails?: string;
  evidenceIds: string[];
  blockingReason?: string;
}

export interface ISandboxEnvironmentStatus {
  isAvailable: boolean;
  runtimeType: 'docker' | 'none';
  version?: string;
  securityProfile: string;
  reason?: string;
  remediation?: string;
  resourceLimits: {
    cpuLimit: string;
    memoryLimit: string;
    timeoutSeconds: number;
    networkRestricted: boolean;
    nonRoot: boolean;
  };
}

export interface ITestRunSummary {
  totalTests: number;
  passed: number;
  failed: number;
  blocked: number;
  notTested: number;
  totalFindings: number;
  confirmedFaults: number;
  potentialFaults: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  qualityScore: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  qualityScoreRationale: string;
  testCoveragePercent: number;
}

export interface ITestRunData {
  _id: string;
  projectId: string;
  stage: string;
  progress: number;
  statusMessage: string;
  environment: ISandboxEnvironmentStatus;
  testPlan: ITestCase[];
  findings: IFaultFinding[];
  summary: ITestRunSummary;
  faultReportDocxPath?: string;
  faultReportDocxName?: string;
  faultReportDocxSize?: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface IDetectedTechnologies {
  languages: string[];
  frontend: string[];
  backend: string[];
  database: string[];
  auth?: string[];
  frameworks: string[];
  buildTools: string[];
  testTools: string[];
  packageManagers: string[];
}

export interface IProjectComponent {
  name: string;
  type: string;
  path: string;
  description: string;
  responsibilities: string[];
  endpoints?: string[];
  dependencies?: string[];
}

export interface IDatabaseSchemaInfo {
  modelName: string;
  filePath: string;
  fields: Array<{ name: string; type: string; required?: boolean }>;
  relationships?: string[];
}

export interface IApiEndpointInfo {
  method: string;
  path: string;
  handler?: string;
  filePath: string;
  description?: string;
}

export interface IEvidenceFinding {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  status: 'confirmed' | 'suspected' | 'informational' | 'needs-review';
  category: string;
  analysisType: 'deterministic' | 'compiler' | 'linter' | 'heuristic' | 'ai-assisted';
  filePath?: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
  lineRange?: { start: number; end: number };
  codeExcerpt?: string;
  ruleId: string;
  evidence: IFindingEvidence[];
  reasoning: string;
  impact: string;
  recommendation: string;
  limitations?: string;
}

export interface IDocumentationSections {
  executiveSummary: string;
  projectOverview: string;
  purposeAndFunctionality?: string;
  problemStatement?: string;
  technologyStackDescription: string;
  projectStructureTree: string;
  systemArchitectureDescription: string;
  moduleDetails: string;
  entryPointsAndStartup?: string;
  dataFlowDescription: string;
  apiDocumentationDescription: string;
  databaseDesignDescription: string;
  authImplementation?: string;
  configurationAndEnvironment?: string;
  setupAndExecutionInstructions: string;
  buildAndDevelopment?: string;
  testingAndQualityDescription: string;
  externalIntegrations?: string;
  securityObservations?: string;
  limitationsAndObservations: string;
  coverageAndUnsupported?: string;
  appendix: string;
}

export interface IProjectListItem {
  _id: string;
  projectName: string;
  submissionType: SubmissionType;
  repositoryUrl?: string;
  uploadedFileName?: string;
  branch?: string;
  commitSha?: string;
  status: AnalysisStatus;
  progress: number;
  statusMessage: string;
  detectedTechnologies: IDetectedTechnologies;
  totalFilesCount: number;
  faultSummary?: {
    totalTests: number;
    passed: number;
    failed: number;
    blocked: number;
    confirmedFaults: number;
    potentialFaults: number;
    qualityScore: number;
    qualityGrade: string;
  };
  faultReportFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReportData {
  projectId: string;
  projectName: string;
  submissionType: SubmissionType;
  repositoryUrl?: string;
  uploadedFileName?: string;
  branch?: string;
  commitSha?: string;
  detectedTechnologies: IDetectedTechnologies;
  components: IProjectComponent[];
  databaseSchemas: IDatabaseSchemaInfo[];
  apiEndpoints: IApiEndpointInfo[];
  architectureDiagramSvg: string;
  architectureDescription: string;
  documentation: IDocumentationSections;
  reportFileName?: string;
  reportFileSize?: number;
  faultReportFileName?: string;
  faultReportFileSize?: number;
  testRun?: ITestRunData;
  aiProviderUsed?: string;
  aiModelUsed?: string;
  usedAiFallback: boolean;
  structuredAnalysis?: any;
  createdAt: string;
}

export interface IHealthStatus {
  status: string;
  timestamp: string;
  service: string;
  database: {
    isConnected: boolean;
    connectionType: string;
    uri: string;
  };
  geminiConfigured: boolean;
  githubTokenConfigured: boolean;
}
