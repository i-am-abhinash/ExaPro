export type FindingStatus = 'confirmed' | 'probable' | 'not_detected' | 'unknown';
export type EvidenceLevel = 'declared_in_manifest' | 'imported_in_code' | 'configured_in_file' | 'runtime_verified';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  category:
    | 'language'
    | 'frontend_framework'
    | 'server_framework'
    | 'database'
    | 'auth'
    | 'storage'
    | 'external_service'
    | 'build_tool'
    | 'test_tool'
    | 'component'
    | 'route'
    | 'schema'
    | 'config';
  name: string;
  value: string;
  status: FindingStatus;
  evidenceSources: string[];
  lineReferences?: string[];
  evidenceLevel: EvidenceLevel;
  detectionRule: string;
  confidence: ConfidenceLevel;
  limitations?: string;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  sublabel: string;
  category: 'client_ui' | 'server_runtime' | 'baas_auth' | 'baas_database' | 'database' | 'service_module' | 'external_api' | 'hosting';
  tech: string;
  evidenceSources: string[];
  isConfirmed: boolean;
  tierNumber: number;
}

export interface ArchitectureEdge {
  sourceId: string;
  targetId: string;
  label: string;
  protocol: 'direct_call' | 'sdk_client' | 'http_rest' | 'event_stream' | 'db_driver';
  isConfirmed: boolean;
  evidenceSources: string[];
}

export interface ArchitectureModel {
  architectureType: 'client_baas' | 'client_server_db' | 'frontend_spa_only' | 'server_api_only' | 'custom_multi_tier';
  architectureSummary: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  inferences: string[];
}

export interface CoverageReport {
  totalDiscoveredFiles: number;
  inspectedFilesCount: number;
  inspectedFiles: string[];
  skippedByPolicyCount: number;
  skippedByPolicySample: string[];
  unreadableFilesCount: number;
  sizeExceededFilesCount: number;
  cappedOmittedFilesCount: number;
  coveragePercentage: number;
  isPartial: boolean;
  limitationNotice: string;
}

export interface ModuleAnalysis {
  name: string;
  path: string;
  type: 'page' | 'ui_component' | 'context' | 'service' | 'hook' | 'utility' | 'route_handler' | 'model' | 'config' | 'test' | 'other';
  exports: string[];
  importedServices: string[];
  hooksUsed: string[];
  externalIntegrations: string[];
  role: string;
  responsibilities: string[];
  evidenceSources: string[];
  confidence: ConfidenceLevel;
}

export interface DatabaseAnalysis {
  databaseType: 'cloud_firestore' | 'mongodb' | 'postgresql' | 'mysql' | 'sqlite' | 'redis' | 'none_detected' | 'unclear';
  sdkUsed: string[];
  isBaaS: boolean;
  detectedCollectionsOrTables: Array<{
    name: string;
    source: 'sdk_reference' | 'security_rules' | 'orm_model';
    operations: string[]; // e.g. ['read', 'query', 'write', 'update', 'delete']
    fields: Array<{ name: string; type: string; required?: boolean }>;
    isSchemaFullyInferred: boolean;
    evidenceSources: string[];
  }>;
  securityRules?: {
    rulesFilePath: string;
    rulesSnippet: string;
    scope: string;
  };
  summary: string;
  schemaConfidence: 'none' | 'partial' | 'inferred' | 'full';
}

export interface ApiAnalysis {
  communicationModel: 'client_baas_sdk' | 'custom_rest_endpoints' | 'graphql' | 'external_http_only' | 'none_detected';
  serverRestEndpoints: Array<{
    method: string;
    path: string;
    filePath: string;
    handler?: string;
    description?: string;
  }>;
  clientSdkOperations: Array<{
    service: string;
    operation: string;
    target: string;
    filePath: string;
  }>;
  externalHttpCalls: Array<{
    method: string;
    urlPattern: string;
    filePath: string;
  }>;
  summary: string;
}

export interface StructuredProjectModel {
  projectName: string;
  projectDescription: string;
  submissionType: 'zip' | 'github';
  coverage: CoverageReport;
  findings: Finding[];
  technologies: {
    languages: string[];
    frontend: string[];
    backend: string[];
    database: string[];
    auth: string[];
    frameworks: string[];
    buildTools: string[];
    testTools: string[];
    packageManagers: string[];
  };
  modules: ModuleAnalysis[];
  database: DatabaseAnalysis;
  api: ApiAnalysis;
  architecture: ArchitectureModel;
  environmentVariables: string[];
  packageScripts: Record<string, string>;
  dependenciesList: Array<{ name: string; version: string; isDev: boolean }>;
  folderTree: string;
  readmeSnippet?: string;
  limitations: string[];
}
