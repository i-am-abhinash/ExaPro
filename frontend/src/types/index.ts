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
  aiProviderUsed?: string;
  aiModelUsed?: string;
  usedAiFallback: boolean;
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
