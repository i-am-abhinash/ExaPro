import mongoose, { Document, Schema } from 'mongoose';

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
  target: string; // URL path, component file, endpoint, or script name
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

export type PipelineStage =
  | 'uploaded'
  | 'analyzing_source'
  | 'planning_tests'
  | 'preparing_environment'
  | 'running_tests'
  | 'generating_reports'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed';

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
  qualityScore: number; // 0 - 100
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  qualityScoreRationale: string;
  testCoveragePercent: number;
}

export interface ITestRunDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  stage: PipelineStage;
  progress: number;
  statusMessage: string;
  environment: ISandboxEnvironmentStatus;
  testPlan: ITestCase[];
  findings: IFaultFinding[];
  summary: ITestRunSummary;
  faultReportDocxPath?: string;
  faultReportDocxName?: string;
  faultReportDocxSize?: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FindingEvidenceSchema = new Schema<IFindingEvidence>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['log', 'screenshot', 'http_response', 'test_output', 'code_snippet'], required: true },
    title: { type: String, required: true },
    data: { type: String, required: true },
    filePath: { type: String },
    lineNumber: { type: Number },
    timestamp: { type: String, required: true },
  },
  { _id: false }
);

export const FaultFindingSchema = new Schema<IFaultFinding>(
  {
    id: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['static_analysis', 'build', 'startup', 'runtime', 'ui', 'api', 'security', 'configuration', 'test_failure'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      required: true,
      index: true,
    },
    confidence: { type: String, enum: ['high', 'medium', 'low'], required: true },
    verificationStatus: {
      type: String,
      enum: ['confirmed', 'potential', 'blocked', 'not_tested'],
      required: true,
      index: true,
    },
    filePath: { type: String },
    lineRange: {
      start: { type: Number },
      end: { type: Number },
    },
    affectedRouteOrEndpoint: { type: String },
    stepsToReproduce: { type: [String], default: [] },
    expectedBehavior: { type: String, default: '' },
    actualBehavior: { type: String, default: '' },
    evidence: { type: [FindingEvidenceSchema], default: [] },
    suggestedFix: { type: String, default: '' },
    associatedTestCaseId: { type: String },
    ruleId: { type: String },
    timestamp: { type: String, required: true },
  },
  { _id: false, timestamps: true }
);

const TestCaseSchema = new Schema<ITestCase>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'startup',
        'http_readiness',
        'route_accessibility',
        'blank_page',
        'console_errors',
        'network_integrity',
        'ui_interaction',
        'api_endpoint',
        'project_unit_test',
        'configuration_sanity',
      ],
      required: true,
    },
    target: { type: String, required: true },
    description: { type: String, required: true },
    expectedOutcome: { type: String, required: true },
    actualOutcome: { type: String },
    status: {
      type: String,
      enum: ['passed', 'failed', 'blocked', 'not_tested', 'pending'],
      default: 'pending',
      required: true,
    },
    durationMs: { type: Number },
    exitCode: { type: Number },
    errorDetails: { type: String },
    evidenceIds: { type: [String], default: [] },
    blockingReason: { type: String },
  },
  { _id: false }
);

const TestRunSchema = new Schema<ITestRunDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    stage: {
      type: String,
      enum: [
        'uploaded',
        'analyzing_source',
        'planning_tests',
        'preparing_environment',
        'running_tests',
        'generating_reports',
        'completed',
        'completed_with_warnings',
        'failed',
      ],
      default: 'uploaded',
      required: true,
    },
    progress: { type: Number, default: 0 },
    statusMessage: { type: String, default: 'Test run initialized.' },
    environment: {
      isAvailable: { type: Boolean, default: false },
      runtimeType: { type: String, enum: ['docker', 'none'], default: 'none' },
      version: { type: String },
      securityProfile: { type: String, default: 'Isolated sandbox profile' },
      reason: { type: String },
      remediation: { type: String },
      resourceLimits: {
        cpuLimit: { type: String, default: '1.0' },
        memoryLimit: { type: String, default: '1024m' },
        timeoutSeconds: { type: Number, default: 120 },
        networkRestricted: { type: Boolean, default: true },
        nonRoot: { type: Boolean, default: true },
      },
    },
    testPlan: { type: [TestCaseSchema], default: [] },
    findings: { type: [FaultFindingSchema], default: [] },
    summary: {
      totalTests: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      blocked: { type: Number, default: 0 },
      notTested: { type: Number, default: 0 },
      totalFindings: { type: Number, default: 0 },
      confirmedFaults: { type: Number, default: 0 },
      potentialFaults: { type: Number, default: 0 },
      severityBreakdown: {
        critical: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
        informational: { type: Number, default: 0 },
      },
      qualityScore: { type: Number, default: 0 },
      qualityGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'C' },
      qualityScoreRationale: { type: String, default: '' },
      testCoveragePercent: { type: Number, default: 0 },
    },
    faultReportDocxPath: { type: String },
    faultReportDocxName: { type: String },
    faultReportDocxSize: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const TestRun = mongoose.model<ITestRunDocument>('TestRun', TestRunSchema);

export const FaultFinding = mongoose.model<any>('FaultFinding', FaultFindingSchema);
