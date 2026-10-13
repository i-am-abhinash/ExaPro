import path from 'path';
import fs from 'fs';
import {
  Finding,
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureModel,
  CoverageReport,
  ModuleAnalysis,
  DatabaseAnalysis,
  ApiAnalysis,
  StructuredProjectModel,
  FindingStatus,
  EvidenceLevel,
  ConfidenceLevel,
} from '../models/analysisModel';
import {
  IDetectedTechnologies,
  IProjectComponent,
  IDatabaseSchemaInfo,
  IApiEndpointInfo,
} from '../models/Project';

export interface AnalysisResult extends StructuredProjectModel {
  // Backwards compatibility mappings for older handlers
  detectedTechnologies: IDetectedTechnologies;
  components: IProjectComponent[];
  databaseSchemas: IDatabaseSchemaInfo[];
  apiEndpoints: IApiEndpointInfo[];
  inspectedFiles: string[];
  totalFilesCount: number;
}

const POLICY_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'out',
  'coverage',
  '.cache',
  'vendor',
  '.idea',
  '.vscode',
  '__pycache__',
]);

const POLICY_IGNORED_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.mp4',
  '.mp3',
  '.wav',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.iso',
  '.zip',
  '.tar',
  '.gz',
  '.pdf',
  '.ttf',
  '.woff',
  '.woff2',
  '.eot',
  '.xlsx',
  '.xls',
  '.csv',
]);

const MAX_INSPECTABLE_FILE_SIZE = 150 * 1024; // 150KB
const MAX_TOTAL_FILES_TO_INSPECT = 150;

export function analyzeProjectDirectory(rootDir: string, defaultName: string): AnalysisResult {
  const allDiscoveredFiles: string[] = [];
  const skippedByPolicy: string[] = [];
  const unreadableFiles: string[] = [];
  const sizeExceededFiles: string[] = [];
  const inspectedFiles: string[] = [];
  const findings: Finding[] = [];
  const limitations: string[] = [];

  // 1. Recursive scan of directory
  function scanDir(dir: string, relBase: string = '') {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err: any) {
      unreadableFiles.push(relBase || dir);
      return;
    }

    for (const entry of entries) {
      const relPath = path.join(relBase, entry.name).replace(/\\/g, '/');
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const lower = entry.name.toLowerCase();
        if (POLICY_IGNORED_DIRS.has(lower)) {
          skippedByPolicy.push(relPath + '/');
          continue;
        }
        scanDir(fullPath, relPath);
      } else if (entry.isFile()) {
        allDiscoveredFiles.push(relPath);
        const ext = path.extname(entry.name).toLowerCase();
        if (POLICY_IGNORED_EXTS.has(ext)) {
          skippedByPolicy.push(relPath);
        }
      }
    }
  }

  scanDir(rootDir);

  // File candidate ranking for static inspection
  const candidateFiles = allDiscoveredFiles.filter((p) => {
    const ext = path.extname(p).toLowerCase();
    return !POLICY_IGNORED_EXTS.has(ext);
  });

  function filePriority(p: string): number {
    const base = path.basename(p).toLowerCase();
    const lower = p.toLowerCase();
    if (base === 'package.json' || base === 'requirements.txt' || base === 'pom.xml' || base === 'cargo.toml') return 100;
    if (base === 'readme.md' || base === 'readme') return 95;
    if (base.includes('firebase') || base.includes('firestore.rules')) return 92;
    if (base.startsWith('vite.config') || base.startsWith('tsconfig') || base.startsWith('tailwind.config')) return 88;
    if (base === 'app.jsx' || base === 'app.tsx' || base === 'main.jsx' || base === 'main.tsx' || base === 'index.ts' || base === 'server.ts') return 85;
    if (lower.includes('/services/') || lower.includes('/context/') || lower.includes('/routes/') || lower.includes('/models/')) return 75;
    if (lower.includes('/pages/') || lower.includes('/components/')) return 65;
    return 50;
  }

  const sortedCandidates = [...candidateFiles].sort((a, b) => filePriority(b) - filePriority(a));
  const inspectableSubset = sortedCandidates.slice(0, MAX_TOTAL_FILES_TO_INSPECT);
  const cappedOmittedCount = sortedCandidates.length > MAX_TOTAL_FILES_TO_INSPECT ? sortedCandidates.length - MAX_TOTAL_FILES_TO_INSPECT : 0;

  // Read file contents cache
  const fileContents = new Map<string, string>();
  for (const relPath of inspectableSubset) {
    const fullPath = path.join(rootDir, relPath);
    try {
      const stats = fs.statSync(fullPath);
      if (stats.size > MAX_INSPECTABLE_FILE_SIZE) {
        sizeExceededFiles.push(relPath);
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      fileContents.set(relPath, content);
      inspectedFiles.push(relPath);
    } catch {
      unreadableFiles.push(relPath);
    }
  }

  // 2. Package manifest inspection
  let detectedProjectName = defaultName;
  let projectDescription = '';
  const packageScripts: Record<string, string> = {};
  const dependenciesList: Array<{ name: string; version: string; isDev: boolean }> = [];
  const declaredDeps = new Map<string, { version: string; isDev: boolean }>();

  for (const [relPath, content] of fileContents.entries()) {
    if (path.basename(relPath).toLowerCase() === 'package.json') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.name && (detectedProjectName === defaultName || !detectedProjectName)) {
          detectedProjectName = parsed.name;
        }
        if (parsed.description && !projectDescription) {
          projectDescription = parsed.description;
        }
        if (parsed.scripts) {
          Object.assign(packageScripts, parsed.scripts);
        }
        if (parsed.dependencies) {
          for (const [d, v] of Object.entries(parsed.dependencies)) {
            declaredDeps.set(d.toLowerCase(), { version: String(v), isDev: false });
            dependenciesList.push({ name: d, version: String(v), isDev: false });
          }
        }
        if (parsed.devDependencies) {
          for (const [d, v] of Object.entries(parsed.devDependencies)) {
            declaredDeps.set(d.toLowerCase(), { version: String(v), isDev: true });
            dependenciesList.push({ name: d, version: String(v), isDev: true });
          }
        }
      } catch (err: any) {
        limitations.push(`Error parsing package.json at ${relPath}: ${err.message}`);
      }
    }
  }

  // 3. Multi-Signal Technology Detection
  const languages = new Set<string>();
  const frontend = new Set<string>();
  const backend = new Set<string>();
  const database = new Set<string>();
  const auth = new Set<string>();
  const frameworks = new Set<string>();
  const buildTools = new Set<string>();
  const testTools = new Set<string>();
  const packageManagers = new Set<string>();

  // A. Languages from extensions and manifests
  for (const f of inspectedFiles) {
    const ext = path.extname(f).toLowerCase();
    if (ext === '.ts' || ext === '.tsx') languages.add('TypeScript');
    if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') languages.add('JavaScript');
    if (ext === '.py') languages.add('Python');
    if (ext === '.java') languages.add('Java');
    if (ext === '.go') languages.add('Go');
    if (ext === '.html') languages.add('HTML');
    if (ext === '.css' || ext === '.scss') languages.add('CSS');
  }

  // B. Manifest lockfiles
  if (allDiscoveredFiles.some((f) => f.endsWith('package-lock.json'))) packageManagers.add('npm');
  if (allDiscoveredFiles.some((f) => f.endsWith('yarn.lock'))) packageManagers.add('yarn');
  if (allDiscoveredFiles.some((f) => f.endsWith('pnpm-lock.yaml'))) packageManagers.add('pnpm');

  // C. Code import scanning for verified usage
  const allCodeText = Array.from(fileContents.values()).join('\n');

  // React
  if (declaredDeps.has('react') || allCodeText.includes("from 'react'") || allCodeText.includes('from "react"')) {
    frontend.add('React');
    findings.push({
      id: 'TECH-REACT',
      category: 'frontend_framework',
      name: 'React',
      value: 'Client UI Framework',
      status: 'confirmed',
      evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('react')),
      evidenceLevel: declaredDeps.has('react') ? 'imported_in_code' : 'imported_in_code',
      detectionRule: 'React import in source code and package.json manifest',
      confidence: 'high',
    });
  }

  // React Router
  if (declaredDeps.has('react-router-dom') || allCodeText.includes('react-router-dom')) {
    frameworks.add('React Router');
  }

  // Tailwind CSS
  if (declaredDeps.has('tailwindcss') || allDiscoveredFiles.some((f) => f.includes('tailwind.config'))) {
    frontend.add('Tailwind CSS');
  }

  // Vite
  if (declaredDeps.has('vite') || allDiscoveredFiles.some((f) => f.startsWith('vite.config'))) {
    buildTools.add('Vite');
  }

  // Recharts / Chart library
  if (declaredDeps.has('recharts') || allCodeText.includes('recharts')) {
    frontend.add('Recharts Data Visualization');
  }

  // Lucide Icons
  if (declaredDeps.has('lucide-react') || allCodeText.includes('lucide-react')) {
    frontend.add('Lucide Icons');
  }

  // Testing tools
  if (declaredDeps.has('jest') || allCodeText.includes('jest')) testTools.add('Jest');
  if (declaredDeps.has('vitest') || allCodeText.includes('vitest')) testTools.add('Vitest');
  if (declaredDeps.has('oxlint') || allDiscoveredFiles.some((f) => f.includes('.oxlintrc'))) testTools.add('oxlint Linter');

  // D. Firebase Services: Auth, Firestore, Storage, Hosting
  const hasFirebaseDep = declaredDeps.has('firebase') || declaredDeps.has('firebase-admin');
  const hasFirebaseAuthImport = allCodeText.includes('firebase/auth') || allCodeText.includes('getAuth(');
  const hasFirestoreImport = allCodeText.includes('firebase/firestore') || allCodeText.includes('getFirestore(');
  const hasFirebaseStorageImport = allCodeText.includes('firebase/storage') || allCodeText.includes('getStorage(');
  const hasFirebaseConfig = allDiscoveredFiles.some((f) => f.includes('firebase.json') || f.includes('.firebaserc'));

  if (hasFirebaseAuthImport || (hasFirebaseDep && allCodeText.includes('signInWithEmailAndPassword'))) {
    auth.add('Firebase Authentication');
    findings.push({
      id: 'TECH-FIREBASE-AUTH',
      category: 'auth',
      name: 'Firebase Authentication',
      value: 'Identity & Authentication BaaS',
      status: 'confirmed',
      evidenceSources: inspectedFiles.filter((f) => {
        const c = fileContents.get(f) || '';
        return c.includes('firebase/auth') || c.includes('getAuth');
      }),
      evidenceLevel: 'imported_in_code',
      detectionRule: 'firebase/auth SDK calls and auth token handling',
      confidence: 'high',
    });
  }

  if (hasFirestoreImport || allDiscoveredFiles.some((f) => f.includes('firestore.rules'))) {
    database.add('Cloud Firestore (Firebase)');
    findings.push({
      id: 'TECH-FIRESTORE',
      category: 'database',
      name: 'Cloud Firestore',
      value: 'NoSQL Document Store (BaaS)',
      status: 'confirmed',
      evidenceSources: inspectedFiles.filter((f) => {
        const c = fileContents.get(f) || '';
        return c.includes('firebase/firestore') || f.includes('firestore.rules') || f.includes('firebase.json');
      }),
      evidenceLevel: 'imported_in_code',
      detectionRule: 'firebase/firestore SDK operations and firestore.rules security configuration',
      confidence: 'high',
    });
  }

  if (hasFirebaseStorageImport) {
    database.add('Firebase Cloud Storage');
  }

  if (hasFirebaseConfig) {
    frameworks.add('Firebase Hosting & Tools');
  }

  // E. Server Frameworks (Express / Fastify / Nest) - STRICT PROOF REQUIRED
  // A server framework must NOT be inferred merely because JS/TS files exist or scripts/ exist!
  const hasExpressDep = declaredDeps.has('express');
  const hasExpressImport =
    allCodeText.includes("from 'express'") ||
    allCodeText.includes('from "express"') ||
    allCodeText.includes('require("express")') ||
    allCodeText.includes("require('express')");
  const hasExpressServerCall =
    allCodeText.includes('express()') &&
    (allCodeText.includes('.listen(') ||
     allCodeText.includes('Router(') ||
     allCodeText.includes('.use(') ||
     allCodeText.includes('.get(') ||
     allCodeText.includes('.post('));

  let hasConfirmedServer = false;
  if ((hasExpressDep || hasExpressImport) && hasExpressServerCall) {
    backend.add('Express');
    hasConfirmedServer = true;
    findings.push({
      id: 'TECH-EXPRESS',
      category: 'server_framework',
      name: 'Express',
      value: 'HTTP Application Server',
      status: 'confirmed',
      evidenceSources: inspectedFiles.filter((f) => {
        const c = fileContents.get(f) || '';
        return c.includes('express()') || c.includes("express'");
      }),
      evidenceLevel: 'imported_in_code',
      detectionRule: 'express() instantiation and route/server declaration',
      confidence: 'high',
    });
  } else {
    findings.push({
      id: 'TECH-SERVER-CHECK',
      category: 'server_framework',
      name: 'Express / Node Server',
      value: 'None detected in application runtime code',
      status: 'not_detected',
      evidenceSources: [],
      evidenceLevel: 'configured_in_file',
      detectionRule: 'Static scan verified no server initialization or HTTP listener',
      confidence: 'high',
      limitations: 'Application runs as a client-side SPA or serverless client',
    });
  }

  // MongoDB / Mongoose - STRICT PROOF REQUIRED
  const hasMongooseDep = declaredDeps.has('mongoose') || declaredDeps.has('mongodb');
  const hasMongooseImport = allCodeText.includes('mongoose') || allCodeText.includes('from "mongoose"');
  if (hasMongooseDep && hasMongooseImport) {
    database.add('MongoDB');
    findings.push({
      id: 'TECH-MONGODB',
      category: 'database',
      name: 'MongoDB / Mongoose',
      value: 'Document Database Driver',
      status: 'confirmed',
      evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('mongoose')),
      evidenceLevel: 'imported_in_code',
      detectionRule: 'Mongoose ODM schema declaration and database connection',
      confidence: 'high',
    });
  }

  // 4. Database Analysis (Firestore & Mongoose Schemas)
  const detectedCollections: Array<{
    name: string;
    source: 'sdk_reference' | 'security_rules' | 'orm_model';
    operations: string[];
    fields: Array<{ name: string; type: string; required?: boolean }>;
    isSchemaFullyInferred: boolean;
    evidenceSources: string[];
  }> = [];

  const legacyDatabaseSchemas: IDatabaseSchemaInfo[] = [];

  // A. Parse Firestore Collections from SDK calls: collection(db, 'name')
  for (const [relPath, code] of fileContents.entries()) {
    const collMatches = code.matchAll(/collection\(\s*[^,]+,\s*['"`]([a-zA-Z0-9_-]+)['"`]\)/g);
    for (const cm of collMatches) {
      const collName = cm[1];
      let existing = detectedCollections.find((c) => c.name.toLowerCase() === collName.toLowerCase());
      if (!existing) {
        existing = {
          name: collName,
          source: 'sdk_reference',
          operations: [],
          fields: [],
          isSchemaFullyInferred: false,
          evidenceSources: [],
        };
        detectedCollections.push(existing);
      }
      if (!existing.evidenceSources.includes(relPath)) existing.evidenceSources.push(relPath);

      // Detect operations in this file
      if (code.includes('getDocs') || code.includes('getDoc') || code.includes('onSnapshot')) {
        if (!existing.operations.includes('read/query')) existing.operations.push('read/query');
      }
      if (code.includes('setDoc') || code.includes('addDoc')) {
        if (!existing.operations.includes('create/write')) existing.operations.push('create/write');
      }
      if (code.includes('updateDoc')) {
        if (!existing.operations.includes('update')) existing.operations.push('update');
      }
      if (code.includes('deleteDoc')) {
        if (!existing.operations.includes('delete')) existing.operations.push('delete');
      }
    }

    // Direct doc references: doc(db, 'users', ...)
    const docMatches = code.matchAll(/doc\(\s*[^,]+,\s*['"`]([a-zA-Z0-9_-]+)['"`]/g);
    for (const dm of docMatches) {
      const collName = dm[1];
      let existing = detectedCollections.find((c) => c.name.toLowerCase() === collName.toLowerCase());
      if (!existing) {
        existing = {
          name: collName,
          source: 'sdk_reference',
          operations: ['read/write'],
          fields: [],
          isSchemaFullyInferred: false,
          evidenceSources: [relPath],
        };
        detectedCollections.push(existing);
      } else if (!existing.evidenceSources.includes(relPath)) {
        existing.evidenceSources.push(relPath);
      }
    }
  }

  // B. Parse firestore.rules for declared security rules scope
  let securityRulesInfo: { rulesFilePath: string; rulesSnippet: string; scope: string } | undefined;
  for (const [relPath, code] of fileContents.entries()) {
    if (relPath.endsWith('firestore.rules')) {
      const matchRules = code.matchAll(/match\s+\/([a-zA-Z0-9_-]+)\/\{[a-zA-Z0-9_]+\}/g);
      for (const mr of matchRules) {
        const collName = mr[1];
        if (!detectedCollections.some((c) => c.name.toLowerCase() === collName.toLowerCase())) {
          detectedCollections.push({
            name: collName,
            source: 'security_rules',
            operations: ['access_controlled_via_rules'],
            fields: [],
            isSchemaFullyInferred: false,
            evidenceSources: [relPath],
          });
        }
      }
      securityRulesInfo = {
        rulesFilePath: relPath,
        rulesSnippet: code.substring(0, 400).trim(),
        scope: `Security rules configure read/write permissions for ${detectedCollections.map((c) => c.name).join(', ')}.`,
      };
    }
  }

  // C. Parse Mongoose Schemas (if present)
  for (const [relPath, code] of fileContents.entries()) {
    if (code.includes('Schema(') && code.includes('mongoose')) {
      const modelName = path.basename(relPath, path.extname(relPath));
      const detectedFields: Array<{ name: string; type: string; required?: boolean }> = [];
      const fieldMatches = code.matchAll(/([a-zA-Z0-9_]+)\s*:\s*\{\s*type\s*:\s*([a-zA-Z0-9_.]+)/g);
      for (const fm of fieldMatches) {
        detectedFields.push({ name: fm[1], type: fm[2], required: code.includes('required: true') });
      }
      if (detectedFields.length === 0) {
        const shorthand = code.matchAll(/([a-zA-Z0-9_]+)\s*:\s*(String|Number|Boolean|Date|Array|ObjectId)/g);
        for (const sh of shorthand) {
          detectedFields.push({ name: sh[1], type: sh[2] });
        }
      }

      legacyDatabaseSchemas.push({
        modelName: modelName.charAt(0).toUpperCase() + modelName.slice(1),
        filePath: relPath,
        fields: detectedFields.length > 0 ? detectedFields : [{ name: 'id', type: 'ObjectId' }],
      });

      detectedCollections.push({
        name: modelName,
        source: 'orm_model',
        operations: ['CRUD'],
        fields: detectedFields,
        isSchemaFullyInferred: detectedFields.length > 0,
        evidenceSources: [relPath],
      });
    }
  }

  // Create legacy mappings for backwards-compatible views
  if (legacyDatabaseSchemas.length === 0 && detectedCollections.length > 0) {
    for (const c of detectedCollections) {
      legacyDatabaseSchemas.push({
        modelName: c.name.charAt(0).toUpperCase() + c.name.slice(1),
        filePath: c.evidenceSources[0] || 'firebase/firestore',
        fields: c.fields.length > 0 ? c.fields : [{ name: 'inferred_document_data', type: 'Firestore Document' }],
      });
    }
  }

  const databaseAnalysis: DatabaseAnalysis = {
    databaseType: database.has('Cloud Firestore (Firebase)')
      ? 'cloud_firestore'
      : database.has('MongoDB')
      ? 'mongodb'
      : 'none_detected',
    sdkUsed: Array.from(database),
    isBaaS: database.has('Cloud Firestore (Firebase)'),
    detectedCollectionsOrTables: detectedCollections,
    securityRules: securityRulesInfo,
    summary:
      detectedCollections.length > 0
        ? `Database integration active via ${Array.from(database).join(', ')}. Detected ${detectedCollections.length} collections/tables (${detectedCollections.map((c) => c.name).join(', ')}). Schema structure is partially inferred from client SDK operations and rules.`
        : 'No dedicated database or ORM schemas detected in inspected project files.',
    schemaConfidence: legacyDatabaseSchemas.some((s) => s.fields.length > 1) ? 'partial' : detectedCollections.length > 0 ? 'partial' : 'none',
  };

  // 5. API & Communication Analysis
  const serverRestEndpoints: IApiEndpointInfo[] = [];
  const clientSdkOperations: Array<{ service: string; operation: string; target: string; filePath: string }> = [];
  const externalHttpCalls: Array<{ method: string; urlPattern: string; filePath: string }> = [];

  for (const [relPath, code] of fileContents.entries()) {
    // Only detect server REST routes if file actually sets up an Express route
    if (hasConfirmedServer) {
      const routeMatches = code.matchAll(/(router|app)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g);
      for (const rm of routeMatches) {
        serverRestEndpoints.push({
          method: rm[2].toUpperCase(),
          path: rm[3],
          filePath: relPath,
          description: `Server route handling ${rm[2].toUpperCase()} requests for ${rm[3]}`,
        });
      }
    }

    // Client-side Firestore operations
    if (code.includes('firebase/firestore') || code.includes('getDocs(')) {
      clientSdkOperations.push({
        service: 'Cloud Firestore',
        operation: 'Document Query / Mutation',
        target: path.basename(relPath),
        filePath: relPath,
      });
    }

    // Client-side Firebase Auth operations
    if (code.includes('signInWithEmailAndPassword') || code.includes('createUserWithEmailAndPassword')) {
      clientSdkOperations.push({
        service: 'Firebase Auth',
        operation: 'User Credential Authentication',
        target: 'Auth Service',
        filePath: relPath,
      });
    }

    // External fetch / axios calls
    const fetchMatches = code.matchAll(/fetch\(\s*['"`](https?:\/\/[^'"`]+)['"`]/g);
    for (const fm of fetchMatches) {
      externalHttpCalls.push({
        method: 'GET/POST',
        urlPattern: fm[1].substring(0, 60),
        filePath: relPath,
      });
    }
  }

  const apiAnalysis: ApiAnalysis = {
    communicationModel:
      serverRestEndpoints.length > 0
        ? 'custom_rest_endpoints'
        : clientSdkOperations.length > 0
        ? 'client_baas_sdk'
        : externalHttpCalls.length > 0
        ? 'external_http_only'
        : 'none_detected',
    serverRestEndpoints,
    clientSdkOperations,
    externalHttpCalls,
    summary:
      serverRestEndpoints.length > 0
        ? `Application declares ${serverRestEndpoints.length} custom server REST endpoints.`
        : clientSdkOperations.length > 0
        ? `Application communicates directly with cloud backend services via client SDK calls (Firebase Authentication & Cloud Firestore). No custom Express REST endpoints are required or declared.`
        : 'No network API endpoints or client SDK operations detected in inspected files.',
  };

  // 6. Detailed Module Analysis (replacing generic repetitive descriptions)
  const modules: ModuleAnalysis[] = [];
  const legacyComponents: IProjectComponent[] = [];

  for (const [relPath, code] of fileContents.entries()) {
    const ext = path.extname(relPath).toLowerCase();
    if (!['.js', '.jsx', '.ts', '.tsx', '.py'].includes(ext)) continue;

    const lower = relPath.toLowerCase();
    const baseName = path.basename(relPath, ext);

    // Determine module type
    let modType: ModuleAnalysis['type'] = 'other';
    if (lower.includes('/pages/') || lower.includes('/views/')) modType = 'page';
    else if (lower.includes('/context/')) modType = 'context';
    else if (lower.includes('/services/')) modType = 'service';
    else if (lower.includes('/hooks/')) modType = 'hook';
    else if (lower.includes('/utils/')) modType = 'utility';
    else if (lower.includes('/routes/')) modType = 'route_handler';
    else if (lower.includes('/models/')) modType = 'model';
    else if (lower.includes('/components/')) modType = 'ui_component';

    // Scan exports
    const exportMatches = code.matchAll(/export\s+(?:default\s+)?(?:const|function|class)\s+([a-zA-Z0-9_]+)/g);
    const exports = Array.from(exportMatches).map((m) => m[1]);
    if (code.includes('export default') && !exports.includes('default')) exports.push('default');

    // Scan imported services and hooks
    const hooksUsed: string[] = [];
    ['useState', 'useEffect', 'useContext', 'useAuth', 'useNavigate', 'useParams', 'useMemo', 'useCallback'].forEach((h) => {
      if (code.includes(h)) hooksUsed.push(h);
    });

    const importedServices: string[] = [];
    ['authService', 'attendanceService', 'memberService', 'teamService', 'configService', 'firebase', 'api'].forEach((s) => {
      if (code.includes(s)) importedServices.push(s);
    });

    const externalIntegrations: string[] = [];
    if (code.includes('firebase')) externalIntegrations.push('Firebase SDK');
    if (code.includes('recharts')) externalIntegrations.push('Recharts');
    if (code.includes('xlsx')) externalIntegrations.push('SheetJS (XLSX)');

    // Formulate evidence-based role & responsibilities
    let role = '';
    const responsibilities: string[] = [];

    if (modType === 'page') {
      role = `Page view presenting ${baseName.replace(/([A-Z])/g, ' $1').trim()} interface.`;
      responsibilities.push('Renders top-level view container');
      if (hooksUsed.length > 0) responsibilities.push(`Manages view state with ${hooksUsed.slice(0, 3).join(', ')}`);
      if (importedServices.length > 0) responsibilities.push(`Interacts with ${importedServices.join(', ')}`);
    } else if (modType === 'context') {
      role = `React Context state provider managing application-wide ${baseName.replace('Context', '')} state.`;
      responsibilities.push('Exposes shared context hook to child components');
      responsibilities.push('Maintains persistent reactive state across route transitions');
    } else if (modType === 'service') {
      role = `Backend communication service handling ${baseName.replace('Service', '')} operations.`;
      responsibilities.push('Abstracts SDK operations and business operations');
      if (externalIntegrations.length > 0) responsibilities.push(`Integrates with ${externalIntegrations.join(', ')}`);
    } else if (modType === 'hook') {
      role = `Custom reusable React hook encapsulating ${baseName} logic.`;
      responsibilities.push('Encapsulates component state and lifecycle side effects');
    } else if (modType === 'utility') {
      role = `Utility helper functions supporting ${baseName} transformations.`;
      responsibilities.push('Data formatting and helper calculations');
    } else if (modType === 'ui_component') {
      role = `Reusable interface component rendering ${baseName}.`;
      responsibilities.push('Presents UI controls and emits user interaction events');
    } else {
      role = `Application source module: ${baseName}.`;
      responsibilities.push('Provides application logic');
    }

    const mod: ModuleAnalysis = {
      name: baseName,
      path: relPath,
      type: modType,
      exports: exports.length > 0 ? exports : [baseName],
      importedServices,
      hooksUsed,
      externalIntegrations,
      role,
      responsibilities,
      evidenceSources: [relPath],
      confidence: 'high',
    };
    modules.push(mod);

    legacyComponents.push({
      name: baseName,
      type: modType === 'ui_component' || modType === 'page' ? 'client' : modType === 'service' ? 'service' : 'other',
      path: relPath,
      description: role,
      responsibilities,
    });
  }

  // 7. Dynamic Architecture Model Generation
  const archNodes: ArchitectureNode[] = [];
  const archEdges: ArchitectureEdge[] = [];
  const inferences: string[] = [];

  let architectureType: ArchitectureModel['architectureType'] = 'frontend_spa_only';

  // Node 1: Client UI Tier
  const topPages = modules.filter((m) => m.type === 'page').map((m) => m.name).slice(0, 4);
  archNodes.push({
    id: 'client_ui',
    label: 'Client User Interface',
    sublabel: 'Single Page Application',
    category: 'client_ui',
    tech: Array.from(frontend).join(', ') || 'Web Client',
    evidenceSources: inspectedFiles.filter((f) => f.includes('src/')),
    isConfirmed: true,
    tierNumber: 1,
  });

  // Check architecture style
  if (hasConfirmedServer) {
    architectureType = 'client_server_db';
    // Server Node
    archNodes.push({
      id: 'server_runtime',
      label: 'Server Application',
      sublabel: 'REST API Gateway',
      category: 'server_runtime',
      tech: 'Node.js / Express',
      evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('express()')),
      isConfirmed: true,
      tierNumber: 2,
    });
    archEdges.push({
      sourceId: 'client_ui',
      targetId: 'server_runtime',
      label: 'HTTP REST / JSON',
      protocol: 'http_rest',
      isConfirmed: true,
      evidenceSources: serverRestEndpoints.map((e) => e.filePath),
    });

    if (database.has('MongoDB')) {
      archNodes.push({
        id: 'database_layer',
        label: 'MongoDB Database',
        sublabel: 'Document Datastore',
        category: 'database',
        tech: 'MongoDB / Mongoose',
        evidenceSources: legacyDatabaseSchemas.map((s) => s.filePath),
        isConfirmed: true,
        tierNumber: 3,
      });
      archEdges.push({
        sourceId: 'server_runtime',
        targetId: 'database_layer',
        label: 'Mongoose ODM Driver',
        protocol: 'db_driver',
        isConfirmed: true,
        evidenceSources: legacyDatabaseSchemas.map((s) => s.filePath),
      });
    }
  } else if (auth.has('Firebase Authentication') || database.has('Cloud Firestore (Firebase)')) {
    architectureType = 'client_baas';

    // Firebase Auth Node
    if (auth.has('Firebase Authentication')) {
      archNodes.push({
        id: 'firebase_auth',
        label: 'Firebase Authentication',
        sublabel: 'Identity & Access BaaS',
        category: 'baas_auth',
        tech: 'Firebase Auth SDK',
        evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('firebase/auth')),
        isConfirmed: true,
        tierNumber: 2,
      });
      archEdges.push({
        sourceId: 'client_ui',
        targetId: 'firebase_auth',
        label: 'Auth SDK (Credentials & Tokens)',
        protocol: 'sdk_client',
        isConfirmed: true,
        evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('firebase/auth')),
      });
    }

    // Cloud Firestore Node
    if (database.has('Cloud Firestore (Firebase)')) {
      archNodes.push({
        id: 'cloud_firestore',
        label: 'Cloud Firestore',
        sublabel: 'NoSQL Document Store (BaaS)',
        category: 'baas_database',
        tech: 'Firebase Firestore SDK',
        evidenceSources: detectedCollections.flatMap((c) => c.evidenceSources),
        isConfirmed: true,
        tierNumber: 2,
      });
      archEdges.push({
        sourceId: 'client_ui',
        targetId: 'cloud_firestore',
        label: 'Firestore SDK (Queries & Mutations)',
        protocol: 'sdk_client',
        isConfirmed: true,
        evidenceSources: detectedCollections.flatMap((c) => c.evidenceSources),
      });
    }
  } else {
    architectureType = 'frontend_spa_only';
    inferences.push('Static frontend application verified; no server or database integration present in codebase.');
  }

  const architecture: ArchitectureModel = {
    architectureType,
    architectureSummary:
      architectureType === 'client_baas'
        ? `${detectedProjectName} implements a modern Serverless / BaaS architecture. The ${Array.from(frontend).join(', ') || 'React'} client application interfaces directly with managed cloud services (Firebase Authentication and Cloud Firestore) via client-side SDKs, operating securely without an intermediate custom Express server.`
        : architectureType === 'client_server_db'
        ? `${detectedProjectName} implements a classic multi-tier architecture with a client interface, custom Express.js server routing tier, and ${Array.from(database).join(', ') || 'database'} persistence.`
        : `${detectedProjectName} is structured as a client-side frontend application with no declared server backend or database tier.`,
    nodes: archNodes,
    edges: archEdges,
    inferences,
  };

  // 8. Coverage Report
  const totalDiscovered = allDiscoveredFiles.length;
  const inspectedCount = inspectedFiles.length;
  const skippedCount = skippedByPolicy.length;
  const coveragePercentage = totalDiscovered > 0 ? Math.round((inspectedCount / totalDiscovered) * 100) : 100;
  const isPartial = totalDiscovered > inspectedCount;

  const coverageReport: CoverageReport = {
    totalDiscoveredFiles: totalDiscovered,
    inspectedFilesCount: inspectedCount,
    inspectedFiles,
    skippedByPolicyCount: skippedCount,
    skippedByPolicySample: skippedByPolicy.slice(0, 15),
    unreadableFilesCount: unreadableFiles.length,
    sizeExceededFilesCount: sizeExceededFiles.length,
    cappedOmittedFilesCount: cappedOmittedCount,
    coveragePercentage,
    isPartial,
    limitationNotice: isPartial
      ? `Analysis is based on ${inspectedCount} of ${totalDiscovered} total repository files (${coveragePercentage}% coverage). Static inspection excluded ${skippedCount} dependency/build/binary artifacts and prioritized core source modules. Inferences are bounded by this inspected subset.`
      : `Full repository coverage achieved (${inspectedCount} of ${totalDiscovered} files analyzed).`,
  };

  // 9. Readme Content
  let readmeSnippet = '';
  const readmeFile = inspectedFiles.find((f) => path.basename(f).toLowerCase() === 'readme.md');
  if (readmeFile) {
    readmeSnippet = fileContents.get(readmeFile)?.substring(0, 1500) || '';
  }

  // 10. Environment Variables
  const envVariables: string[] = [];
  for (const [f, c] of fileContents.entries()) {
    if (path.basename(f).startsWith('.env.')) {
      c.split('\n').forEach((l) => {
        const trimmed = l.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const varName = trimmed.split('=')[0].trim();
          if (varName && !envVariables.includes(varName)) envVariables.push(varName);
        }
      });
    }
  }

  const folderTree = generateAsciiTree(allDiscoveredFiles);

  const structuredModel: StructuredProjectModel = {
    projectName: detectedProjectName,
    projectDescription:
      projectDescription ||
      `Software project built with ${Array.from(languages).join(', ') || 'modern web technologies'}.`,
    submissionType: 'zip',
    coverage: coverageReport,
    findings,
    technologies: {
      languages: Array.from(languages),
      frontend: Array.from(frontend),
      backend: Array.from(backend),
      database: Array.from(database),
      auth: Array.from(auth),
      frameworks: Array.from(frameworks),
      buildTools: Array.from(buildTools),
      testTools: Array.from(testTools),
      packageManagers: Array.from(packageManagers),
    },
    modules,
    database: databaseAnalysis,
    api: apiAnalysis,
    architecture,
    environmentVariables: envVariables,
    packageScripts,
    dependenciesList,
    folderTree,
    readmeSnippet,
    limitations: [coverageReport.limitationNotice, ...limitations],
  };

  return {
    ...structuredModel,
    // Backwards-compatible legacy properties
    detectedTechnologies: {
      languages: Array.from(languages),
      frontend: Array.from(frontend),
      backend: Array.from(backend),
      database: Array.from(database),
      auth: Array.from(auth),
      frameworks: Array.from(frameworks),
      buildTools: Array.from(buildTools),
      testTools: Array.from(testTools),
      packageManagers: Array.from(packageManagers),
    },
    components: legacyComponents,
    databaseSchemas: legacyDatabaseSchemas,
    apiEndpoints: serverRestEndpoints,
    inspectedFiles,
    totalFilesCount: totalDiscovered,
  };
}

function generateAsciiTree(paths: string[]): string {
  interface TreeNode {
    name: string;
    children: Map<string, TreeNode>;
    isFile: boolean;
  }

  const root: TreeNode = { name: '', children: new Map(), isFile: false };

  for (const p of paths) {
    const parts = p.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          children: new Map(),
          isFile: isLast,
        });
      }
      current = current.children.get(part)!;
    }
  }

  const lines: string[] = [];

  function printNode(node: TreeNode, prefix: string, isLast: boolean, depth: number) {
    if (depth > 3) return; // Keep top-level hierarchy concise in report body
    if (node.name) {
      lines.push(`${prefix}${isLast ? '└── ' : '├── '}${node.name}${node.isFile ? '' : '/'}`);
    }

    const childEntries = Array.from(node.children.values());
    const nextPrefix = node.name ? prefix + (isLast ? '    ' : '│   ') : '';
    for (let i = 0; i < childEntries.length; i++) {
      if (lines.length > 50) {
        lines.push(`${nextPrefix}└── ... (additional subdirectories listed in Appendix)`);
        break;
      }
      printNode(childEntries[i], nextPrefix, i === childEntries.length - 1, depth + 1);
    }
  }

  printNode(root, '', true, 0);
  return lines.join('\n');
}
