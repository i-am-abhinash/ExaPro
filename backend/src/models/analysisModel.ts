export type FindingStatus = 'confirmed' | 'probable' | 'not_detected' | 'unknown';
export type EvidenceLevel = 'declared_in_manifest' | 'imported_in_code' | 'configured_in_file' | 'runtime_verified';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// 17-field Evidence Schema specified in Section 3.2
export type EvidenceFindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type EvidenceFindingStatus = 'confirmed' | 'suspected' | 'informational' | 'needs-review';
export type EvidenceFindingCategory =
  | 'syntax'
  | 'type'
  | 'dependency'
  | 'configuration'
  | 'api'
  | 'database'
  | 'security'
  | 'maintainability'
  | 'startup'
  | 'performance';

export type EvidenceAnalysisType = 'deterministic' | 'compiler' | 'linter' | 'heuristic' | 'ai-assisted';

export interface IEvidenceFindingItem {
  id: string;
  type: 'log' | 'screenshot' | 'http_response' | 'test_output' | 'code_snippet';
  title: string;
  data: string;
  filePath?: string;
  lineNumber?: number;
  timestamp: string;
}

export interface IEvidenceFinding {
  id: string;
  title: string;
  description: string;
  severity: EvidenceFindingSeverity;
  confidence: ConfidenceLevel;
  status: EvidenceFindingStatus;
  category: EvidenceFindingCategory;
  analysisType: EvidenceAnalysisType;
  filePath?: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
  lineRange?: { start: number; end: number };
  codeExcerpt?: string;
  ruleId: string;
  evidence: IEvidenceFindingItem[];
  reasoning: string;
  impact: string;
  recommendation: string;
  limitations?: string;
}

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
  architectureType: 'client_baas' | 'client_server_db' | 'frontend_spa_only' | 'server_api_only' | 'custom_multi_tier' | 'polyglot_fullstack';
  architectureSummary: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  inferences: string[];
}

export type AnalysisRunStatus = 'completed' | 'completed_with_warnings' | 'partial' | 'failed' | 'unsupported';

export interface CoverageReport {
  totalDiscoveredFiles: number;
  inspectedFilesCount: number;
  inspectedFiles: string[];
  skippedByPolicyCount: number;
  skippedByPolicySample: string[];
  unreadableFilesCount: number;
  sizeExceededFilesCount: number;
  cappedOmittedFilesCount: number;
  parseFailedFilesCount: number;
  parseFailedFiles: string[];
  unsupportedFilesCount: number;
  unsupportedFiles: string[];
  excludedDirectories: string[];
  languagesAnalyzed: string[];
  rulesExecuted: string[];
  typeChecksPerformed: boolean;
  dependencyChecksPerformed: boolean;
  coveragePercentage: number;
  analysisStatus: AnalysisRunStatus;
  findingsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  findingsByCategory: Record<string, number>;
  warnings: string[];
  errors: string[];
  partialReasons: string[];
  isPartial: boolean;
  limitationNotice: string;
  inventoryReconciled: boolean;
}

export interface ModuleAnalysis {
  name: string;
  path: string;
  type:
    | 'entry_point'
    | 'page'
    | 'ui_component'
    | 'context'
    | 'service'
    | 'hook'
    | 'utility'
    | 'route_handler'
    | 'model'
    | 'config'
    | 'script'
    | 'test'
    | 'other';
  exports: string[];
  importedServices: string[];
  hooksUsed: string[];
  externalIntegrations: string[];
  role: string;
  responsibilities: string[];
  evidenceSources: string[];
  confidence: ConfidenceLevel;
  lineCount?: number;
}

export interface FirestoreCollectionDetail {
  name: string;
  category: 'active_sdk_reference' | 'security_rule_only' | 'dynamic_unresolved' | 'orm_model';
  observedOperations: string[]; // e.g. ['read/query', 'create/write'] for SDK, or ['permission_rule_declared']
  fields: Array<{ name: string; type: string; required?: boolean }>;
  isSchemaFullyInferred: boolean;
  evidenceSources: string[];
  confidence: ConfidenceLevel;
  limitations?: string;
  runtimeUsageEstablished: boolean;
}

export interface DatabaseAnalysis {
  databaseType: 'cloud_firestore' | 'mongodb' | 'postgresql' | 'mysql' | 'sqlite' | 'redis' | 'none_detected' | 'unclear';
  sdkUsed: string[];
  isBaaS: boolean;
  activeSdkCollections: FirestoreCollectionDetail[];
  ruleOnlyCollectionPaths: FirestoreCollectionDetail[];
  unresolvedOrDynamicPaths: FirestoreCollectionDetail[];
  detectedCollectionsOrTables: FirestoreCollectionDetail[]; // backward compatibility
  securityRules?: {
    rulesFilePath: string;
    rulesSnippet: string;
    scope: string;
    isStaticallyInspected: boolean;
    deploymentVerified: boolean;
    analysisNote?: string;
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

export interface LanguageInventory {
  language: string;
  role: 'primary_application_runtime' | 'backend_service_runtime' | 'markup_styling' | 'offline_utility_script' | 'build_configuration' | 'other';
  fileCount: number;
  evidenceFiles: string[];
}

export interface StructuredProjectModel {
  projectName: string;
  projectDescription: string;
  submissionType: 'zip' | 'github';
  coverage: CoverageReport;
  findings: Finding[];
  technologies: {
    primaryRuntime: string;
    backendRuntime?: string;
    languages: string[];
    sourceLanguages: LanguageInventory[];
    frontend: string[];
    backend: string[];
    database: string[];
    auth: string[];
    frameworks: string[];
    buildTools: string[];
    testTools: string[];
    packageManagers: string[];
  };
  subsystems?: {
    frontend?: string;
    backend?: string;
    communicationStatus: string;
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
  sourceFindings: IEvidenceFinding[];
  limitations: string[];
}
