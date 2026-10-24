import mongoose, { Document, Schema } from 'mongoose';
import { StructuredProjectModel } from './analysisModel';

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

export interface IDetectedTechnologies {
  languages: string[];
  frontend: string[];
  backend: string[];
  database: string[];
  auth: string[];
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

export interface IDocumentationSections {
  executiveSummary: string; // Retained for backwards compatibility & quick summary
  projectOverview: string; // Section 1: Project overview
  purposeAndFunctionality: string; // Section 2: Purpose and apparent functionality
  problemStatement: string; // Section 3: Problem statement and intended solution
  technologyStackDescription: string; // Section 4: Technology stack
  projectStructureTree: string; // Section 5: Repository and directory structure
  systemArchitectureDescription: string; // Section 6: Architecture overview
  moduleDetails: string; // Section 7: Major modules and responsibilities
  entryPointsAndStartup: string; // Section 8: Application entry points and startup workflow
  dataFlowDescription: string; // Section 9: Internal module dependencies and data flow
  apiDocumentationDescription: string; // Section 10: API documentation
  databaseDesignDescription: string; // Section 11: Database models, schemas, and relationships
  authImplementation: string; // Section 12: Authentication and authorization implementation
  configurationAndEnvironment: string; // Section 13: Configuration and environment variables
  setupAndExecutionInstructions: string; // Section 14: Installation and setup instructions
  buildAndDevelopment: string; // Section 15: Build and development commands
  testingAndQualityDescription: string; // Section 16: Testing setup and discovered test files
  externalIntegrations: string; // Section 17: External integrations
  securityObservations: string; // Section 18: Security-relevant observations
  limitationsAndObservations: string; // Section 19: Findings, limitations, and evidence
  coverageAndUnsupported: string; // Section 20: Analysis coverage and unsupported areas
  appendix: string; // Detailed inventories & reference appendix
}

export interface IProjectDocument extends Document {
  projectName: string;
  submissionType: SubmissionType;
  repositoryUrl?: string;
  uploadedFileName?: string;
  branch?: string;
  commitSha?: string;
  status: AnalysisStatus;
  progress: number;
  statusMessage: string;
  errorMessage?: string;

  detectedTechnologies: IDetectedTechnologies;
  inspectedFiles: string[];
  totalFilesCount: number;

  components: IProjectComponent[];
  databaseSchemas: IDatabaseSchemaInfo[];
  apiEndpoints: IApiEndpointInfo[];

  architectureDiagramSvg: string;
  architectureDescription: string;

  documentation: IDocumentationSections;

  reportFilePath?: string;
  reportFileName?: string;
  reportFileSize?: number;

  faultReportFilePath?: string;
  faultReportFileName?: string;
  faultReportFileSize?: number;
  testRunId?: mongoose.Types.ObjectId;
  faultSummary?: {
    totalTests: number;
    passed: number;
    failed: number;
    blocked: number;
    notTested: number;
    confirmedFaults: number;
    potentialFaults: number;
    qualityScore: number;
    qualityGrade: string;
  };

  aiProviderUsed?: string;
  aiModelUsed?: string;
  usedAiFallback: boolean;

  structuredAnalysis?: StructuredProjectModel;

  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    projectName: { type: String, required: true },
    submissionType: { type: String, enum: ['zip', 'github'], required: true },
    repositoryUrl: { type: String },
    uploadedFileName: { type: String },
    branch: { type: String },
    commitSha: { type: String },
    status: {
      type: String,
      enum: [
        'queued',
        'inspecting',
        'analyzing',
        'planning_tests',
        'preparing_environment',
        'running_tests',
        'generating_reports',
        'generating_docx',
        'completed',
        'completed_with_warnings',
        'failed',
      ],
      default: 'queued',
      required: true,
    },
    progress: { type: Number, default: 0 },
    statusMessage: { type: String, default: 'Project queued for analysis.' },
    errorMessage: { type: String },
    faultReportFilePath: { type: String },
    faultReportFileName: { type: String },
    faultReportFileSize: { type: Number, default: 0 },
    testRunId: { type: Schema.Types.ObjectId, ref: 'TestRun' },
    faultSummary: {
      totalTests: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      blocked: { type: Number, default: 0 },
      notTested: { type: Number, default: 0 },
      confirmedFaults: { type: Number, default: 0 },
      potentialFaults: { type: Number, default: 0 },
      qualityScore: { type: Number, default: 0 },
      qualityGrade: { type: String, default: 'C' },
    },

    detectedTechnologies: {
      languages: { type: [String], default: [] },
      frontend: { type: [String], default: [] },
      backend: { type: [String], default: [] },
      database: { type: [String], default: [] },
      auth: { type: [String], default: [] },
      frameworks: { type: [String], default: [] },
      buildTools: { type: [String], default: [] },
      testTools: { type: [String], default: [] },
      packageManagers: { type: [String], default: [] },
    },

    inspectedFiles: { type: [String], default: [] },
    totalFilesCount: { type: Number, default: 0 },

    components: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        path: { type: String, required: true },
        description: { type: String, required: true },
        responsibilities: { type: [String], default: [] },
        endpoints: { type: [String], default: [] },
        dependencies: { type: [String], default: [] },
      },
    ],

    databaseSchemas: [
      {
        modelName: { type: String, required: true },
        filePath: { type: String, required: true },
        fields: [
          {
            name: { type: String, required: true },
            type: { type: String, required: true },
            required: { type: Boolean, default: false },
          },
        ],
        relationships: { type: [String], default: [] },
      },
    ],

    apiEndpoints: [
      {
        method: { type: String, required: true },
        path: { type: String, required: true },
        handler: { type: String },
        filePath: { type: String, required: true },
        description: { type: String },
      },
    ],

    architectureDiagramSvg: { type: String, default: '' },
    architectureDescription: { type: String, default: '' },

    documentation: {
      executiveSummary: { type: String, default: '' },
      projectOverview: { type: String, default: '' },
      purposeAndFunctionality: { type: String, default: '' },
      problemStatement: { type: String, default: '' },
      technologyStackDescription: { type: String, default: '' },
      projectStructureTree: { type: String, default: '' },
      systemArchitectureDescription: { type: String, default: '' },
      moduleDetails: { type: String, default: '' },
      entryPointsAndStartup: { type: String, default: '' },
      dataFlowDescription: { type: String, default: '' },
      apiDocumentationDescription: { type: String, default: '' },
      databaseDesignDescription: { type: String, default: '' },
      authImplementation: { type: String, default: '' },
      configurationAndEnvironment: { type: String, default: '' },
      setupAndExecutionInstructions: { type: String, default: '' },
      buildAndDevelopment: { type: String, default: '' },
      testingAndQualityDescription: { type: String, default: '' },
      externalIntegrations: { type: String, default: '' },
      securityObservations: { type: String, default: '' },
      limitationsAndObservations: { type: String, default: '' },
      coverageAndUnsupported: { type: String, default: '' },
      appendix: { type: String, default: '' },
    },

    reportFilePath: { type: String },
    reportFileName: { type: String },
    reportFileSize: { type: Number, default: 0 },

    aiProviderUsed: { type: String, default: 'none' },
    aiModelUsed: { type: String, default: 'none' },
    usedAiFallback: { type: Boolean, default: false },

    structuredAnalysis: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model<IProjectDocument>('Project', ProjectSchema);
