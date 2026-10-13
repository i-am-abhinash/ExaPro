import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionType = 'zip' | 'github';
export type AnalysisStatus = 'queued' | 'inspecting' | 'analyzing' | 'generating_docx' | 'completed' | 'failed';

export interface IDetectedTechnologies {
  languages: string[];
  frontend: string[];
  backend: string[];
  database: string[];
  frameworks: string[];
  buildTools: string[];
  testTools: string[];
  packageManagers: string[];
}

export interface IProjectComponent {
  name: string;
  type: 'client' | 'server' | 'database' | 'service' | 'model' | 'router' | 'utility' | 'config' | 'test' | 'other';
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
  executiveSummary: string;
  projectOverview: string;
  technologyStackDescription: string;
  projectStructureTree: string;
  systemArchitectureDescription: string;
  moduleDetails: string;
  dataFlowDescription: string;
  databaseDesignDescription: string;
  apiDocumentationDescription: string;
  setupAndExecutionInstructions: string;
  testingAndQualityDescription: string;
  limitationsAndObservations: string;
  appendix: string;
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
  
  aiProviderUsed?: string;
  aiModelUsed?: string;
  usedAiFallback: boolean;
  
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
      enum: ['queued', 'inspecting', 'analyzing', 'generating_docx', 'completed', 'failed'],
      default: 'queued',
      required: true,
    },
    progress: { type: Number, default: 0 },
    statusMessage: { type: String, default: 'Project queued for analysis.' },
    errorMessage: { type: String },

    detectedTechnologies: {
      languages: { type: [String], default: [] },
      frontend: { type: [String], default: [] },
      backend: { type: [String], default: [] },
      database: { type: [String], default: [] },
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
      technologyStackDescription: { type: String, default: '' },
      projectStructureTree: { type: String, default: '' },
      systemArchitectureDescription: { type: String, default: '' },
      moduleDetails: { type: String, default: '' },
      dataFlowDescription: { type: String, default: '' },
      databaseDesignDescription: { type: String, default: '' },
      apiDocumentationDescription: { type: String, default: '' },
      setupAndExecutionInstructions: { type: String, default: '' },
      testingAndQualityDescription: { type: String, default: '' },
      limitationsAndObservations: { type: String, default: '' },
      appendix: { type: String, default: '' },
    },

    reportFilePath: { type: String },
    reportFileName: { type: String },
    reportFileSize: { type: Number, default: 0 },

    aiProviderUsed: { type: String, default: 'none' },
    aiModelUsed: { type: String, default: 'none' },
    usedAiFallback: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model<IProjectDocument>('Project', ProjectSchema);
