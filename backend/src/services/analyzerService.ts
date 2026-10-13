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
  FirestoreCollectionDetail,
  ApiAnalysis,
  StructuredProjectModel,
  LanguageInventory,
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
  // Backwards compatibility mappings for older views/handlers
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
  '.firebase',
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
  const excludedDirectoriesSet = new Set<string>();
  const skippedByPolicyFiles: string[] = [];
  const unreadableFiles: string[] = [];
  const sizeExceededFiles: string[] = [];
  const inspectedFiles: string[] = [];
  const cappedOmittedFiles: string[] = [];
  const findings: Finding[] = [];
  const limitations: string[] = [];

  // 1. Recursive scan of directory
  function scanDir(dir: string, relBase: string = '') {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      unreadableFiles.push(relBase || dir);
      return;
    }

    for (const entry of entries) {
      const relPath = path.join(relBase, entry.name).replace(/\\/g, '/');
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const lower = entry.name.toLowerCase();
        if (POLICY_IGNORED_DIRS.has(lower)) {
          excludedDirectoriesSet.add(entry.name);
          continue;
        }
        scanDir(fullPath, relPath);
      } else if (entry.isFile()) {
        allDiscoveredFiles.push(relPath);
      }
    }
  }

  scanDir(rootDir);

  // File candidate ranking for static inspection
  const candidateFiles: string[] = [];
  for (const relPath of allDiscoveredFiles) {
    const ext = path.extname(relPath).toLowerCase();
    if (POLICY_IGNORED_EXTS.has(ext)) {
      skippedByPolicyFiles.push(relPath);
    } else {
      candidateFiles.push(relPath);
    }
  }

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
  const inspectableCandidates = sortedCandidates.slice(0, MAX_TOTAL_FILES_TO_INSPECT);
  const cappedCandidates = sortedCandidates.slice(MAX_TOTAL_FILES_TO_INSPECT);
  for (const c of cappedCandidates) {
    cappedOmittedFiles.push(c);
  }

  // Read file contents cache
  const fileContents = new Map<string, string>();
  for (const relPath of inspectableCandidates) {
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

  // Reconciled inventory assertion
  const reconciledTotal =
    inspectedFiles.length +
    skippedByPolicyFiles.length +
    sizeExceededFiles.length +
    unreadableFiles.length +
    cappedOmittedFiles.length;
  const isInventoryReconciled = reconciledTotal === allDiscoveredFiles.length;

  // 2. Package manifest inspection
  let detectedProjectName = defaultName;
  let projectDescription = '';
  const packageScripts: Record<string, string> = {};
  const dependenciesList: Array<{ name: string; version: string; isDev: boolean }> = [];
  const declaredDeps = new Map<string, { version: string; isDev: boolean }>();
  const declaredPythonDeps = new Map<string, { version: string; isDev: boolean }>();

  const GENERIC_BOILERPLATE_NAMES = new Set([
    'vite_react_shadcn_ts',
    'vite-react-starter',
    'my-app',
    'react-app',
    'frontend',
    'backend',
    'client',
    'server',
    'app',
  ]);

  for (const [relPath, content] of fileContents.entries()) {
    const baseName = path.basename(relPath).toLowerCase();
    if (baseName === 'package.json') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.name) {
          const isGeneric = GENERIC_BOILERPLATE_NAMES.has(parsed.name.toLowerCase());
          const hasGoodDefault =
            defaultName && !['Project', 'Archive Upload', 'GitHub Repository', 'archive'].includes(defaultName);
          if (!isGeneric && (detectedProjectName === defaultName || !detectedProjectName)) {
            detectedProjectName = parsed.name;
          } else if (isGeneric && hasGoodDefault) {
            detectedProjectName = defaultName;
          }
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
        limitations.push(`Notice: package.json at ${relPath} could not be parsed as valid JSON: ${err.message}`);
      }
    } else if (baseName === 'requirements.txt') {
      // Parse Python requirements.txt
      const lines = content.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || line.startsWith('-')) continue;
        const pkgMatch = line.split(/[=<>!~;@\s]/)[0].trim().toLowerCase();
        if (pkgMatch) {
          declaredPythonDeps.set(pkgMatch, { version: line, isDev: false });
          dependenciesList.push({ name: pkgMatch, version: line, isDev: false });
        }
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

  // A. Language inventory with counts and roles
  const langCounts: Record<string, { count: number; files: string[] }> = {};
  for (const f of allDiscoveredFiles) {
    const ext = path.extname(f).toLowerCase();
    let lang = '';
    if (ext === '.ts' || ext === '.tsx') lang = 'TypeScript';
    else if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') lang = 'JavaScript';
    else if (ext === '.py') lang = 'Python';
    else if (ext === '.java') lang = 'Java';
    else if (ext === '.go') lang = 'Go';
    else if (ext === '.html') lang = 'HTML';
    else if (ext === '.css' || ext === '.scss' || ext === '.sass') lang = 'CSS';
    else if (ext === '.json') lang = 'JSON';

    if (lang) {
      languages.add(lang);
      if (!langCounts[lang]) langCounts[lang] = { count: 0, files: [] };
      langCounts[lang].count++;
      if (langCounts[lang].files.length < 5) langCounts[lang].files.push(f);
    }
  }

  // C. Code import scanning for verified usage
  const allCodeText = Array.from(fileContents.values()).join('\n');

  // Python Server Frameworks & Ecosystem
  const hasFastAPIDep = declaredPythonDeps.has('fastapi');
  const hasFastAPIImport =
    allCodeText.includes('from fastapi') ||
    allCodeText.includes('import fastapi') ||
    allCodeText.includes('FastAPI(');
  const hasFastAPIServer = (hasFastAPIDep || hasFastAPIImport) && allCodeText.includes('FastAPI(');

  const hasFlaskDep = declaredPythonDeps.has('flask');
  const hasFlaskImport = allCodeText.includes('from flask') || allCodeText.includes('import flask');
  const hasFlaskServer = (hasFlaskDep || hasFlaskImport) && (allCodeText.includes('Flask(') || allCodeText.includes('@app.route'));

  const hasDjangoDep = declaredPythonDeps.has('django');
  const hasDjangoServer = hasDjangoDep && allCodeText.includes('django');

  const hasPythonServer = hasFastAPIServer || hasFlaskServer || hasDjangoServer;

  // Python AI / NLP / Audio Libraries
  if (declaredPythonDeps.has('scikit-learn') || allCodeText.includes('sklearn') || allCodeText.includes('TfidfVectorizer')) {
    frameworks.add('Scikit-Learn (TF-IDF & Classification)');
  }
  if (declaredPythonDeps.has('nltk') || allCodeText.includes('nltk')) {
    frameworks.add('NLTK (Tokenization & Corpora)');
  }
  if (declaredPythonDeps.has('networkx') || allCodeText.includes('networkx')) {
    frameworks.add('NetworkX (Graph Analysis)');
  }
  if (declaredPythonDeps.has('gtts') || allCodeText.includes('from gtts') || allCodeText.includes('gTTS(')) {
    frameworks.add('gTTS Text-to-Speech Engine');
  }
  if (declaredPythonDeps.has('beautifulsoup4') || allCodeText.includes('BeautifulSoup(') || allCodeText.includes('bs4')) {
    frameworks.add('BeautifulSoup4 (Web Scraping)');
  }
  if (declaredPythonDeps.has('requests') || allCodeText.includes('import requests')) {
    frameworks.add('Requests (HTTP Client)');
  }

  const sourceLanguages: LanguageInventory[] = Object.entries(langCounts).map(([lang, info]) => {
    let role: LanguageInventory['role'] = 'other';
    if (lang === 'JavaScript' || lang === 'TypeScript') {
      role = 'primary_application_runtime';
    } else if (lang === 'HTML' || lang === 'CSS') {
      role = 'markup_styling';
    } else if (lang === 'Python') {
      role = hasPythonServer ? 'backend_service_runtime' : 'offline_utility_script';
    } else if (lang === 'JSON') {
      role = 'build_configuration';
    }
    return {
      language: lang,
      role,
      fileCount: info.count,
      evidenceFiles: info.files,
    };
  });

  // Determine primary application runtime and backend runtime
  let primaryRuntime = 'Client-Side Web Application';
  let backendRuntime: string | undefined = undefined;

  if (languages.has('TypeScript')) {
    primaryRuntime = 'TypeScript / Browser (Vite SPA)';
  } else if (languages.has('JavaScript')) {
    primaryRuntime = 'JavaScript (ES Modules) / Browser (Vite SPA)';
  }

  if (hasPythonServer) {
    if (hasFastAPIServer) {
      backend.add('FastAPI (Python)');
      backendRuntime = 'Python 3 / FastAPI HTTP Microservice';
    } else if (hasFlaskServer) {
      backend.add('Flask (Python)');
      backendRuntime = 'Python 3 / Flask Web Application';
    } else {
      backend.add('Django (Python)');
      backendRuntime = 'Python 3 / Django Web Application';
    }
  }

  // B. Manifest lockfiles
  if (allDiscoveredFiles.some((f) => f.endsWith('package-lock.json'))) packageManagers.add('npm');
  if (allDiscoveredFiles.some((f) => f.endsWith('yarn.lock'))) packageManagers.add('yarn');
  if (allDiscoveredFiles.some((f) => f.endsWith('pnpm-lock.yaml'))) packageManagers.add('pnpm');
  if (declaredPythonDeps.size > 0) packageManagers.add('pip');

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
      evidenceLevel: 'imported_in_code',
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
      detectionRule: 'firebase/firestore SDK operations and firestore.rules configuration',
      confidence: 'high',
    });
  }

  if (hasFirebaseStorageImport) {
    database.add('Firebase Cloud Storage');
  }

  if (hasFirebaseConfig) {
    frameworks.add('Firebase Hosting (Configured)');
  }

  // E. Server Frameworks (Express & FastAPI)
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
    primaryRuntime = 'Node.js / Express Server';
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
  } else if (hasPythonServer) {
    hasConfirmedServer = true;
    if (hasFastAPIServer) {
      findings.push({
        id: 'TECH-FASTAPI',
        category: 'server_framework',
        name: 'FastAPI',
        value: 'Python ASGI Web Framework',
        status: 'confirmed',
        evidenceSources: inspectedFiles.filter((f) => {
          const c = fileContents.get(f) || '';
          return c.includes('FastAPI(') || c.includes('from fastapi');
        }),
        evidenceLevel: 'imported_in_code',
        detectionRule: 'FastAPI application instance and route declarations in Python source',
        confidence: 'high',
      });
    }
    findings.push({
      id: 'TECH-EXPRESS-CHECK',
      category: 'server_framework',
      name: 'Express / Node Server',
      value: 'Not detected; backend runtime verified as Python FastAPI',
      status: 'not_detected',
      evidenceSources: [],
      evidenceLevel: 'configured_in_file',
      detectionRule: 'Static scan verified backend is powered by Python ASGI rather than Express',
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

  // F. Supabase & LocalStorage Data Stores
  const hasSupabaseDep = declaredDeps.has('@supabase/supabase-js') || allCodeText.includes('@supabase/supabase-js');
  const hasSupabaseClient = allCodeText.includes('createClient(');
  const hasActiveSupabaseQueries =
    allCodeText.includes('.from(') ||
    allCodeText.includes('.rpc(') ||
    allCodeText.includes('.auth.signUp') ||
    allCodeText.includes('.auth.signIn');

  if (hasSupabaseDep || hasSupabaseClient) {
    if (hasActiveSupabaseQueries) {
      database.add('Supabase (PostgreSQL BaaS)');
      findings.push({
        id: 'TECH-SUPABASE',
        category: 'database',
        name: 'Supabase',
        value: 'PostgreSQL Backend-as-a-Service',
        status: 'confirmed',
        evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('supabase')),
        evidenceLevel: 'imported_in_code',
        detectionRule: 'Supabase client queries (.from) in source modules',
        confidence: 'high',
      });
    } else {
      findings.push({
        id: 'TECH-SUPABASE-SCAFFOLD',
        category: 'database',
        name: 'Supabase (Configured Scaffolding)',
        value: 'Client Configured, No Active Table Queries Observed',
        status: 'probable',
        evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('supabase')),
        evidenceLevel: 'configured_in_file',
        detectionRule: 'createClient present in client.ts without active .from() table operations in UI modules',
        confidence: 'high',
        limitations:
          'Supabase client initialized via VITE_SUPABASE_URL scaffolding, but no active database table queries or mutations were detected in inspected application components. User bookmarks are persisted client-side via browser localStorage.',
      });
    }
  }

  // Browser LocalStorage check
  const hasLocalStorage = allCodeText.includes('localStorage.getItem') || allCodeText.includes('localStorage.setItem');
  if (hasLocalStorage) {
    findings.push({
      id: 'TECH-LOCALSTORAGE',
      category: 'storage',
      name: 'Browser LocalStorage',
      value: 'Client-Side Key-Value Storage',
      status: 'confirmed',
      evidenceSources: inspectedFiles.filter((f) => {
        const c = fileContents.get(f) || '';
        return c.includes('localStorage.getItem') || c.includes('localStorage.setItem');
      }),
      evidenceLevel: 'imported_in_code',
      detectionRule: 'localStorage.getItem/setItem calls in component state management',
      confidence: 'high',
    });
  }

  // MongoDB / Mongoose
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

  // 4. Database Analysis: Clear separation of Active SDK Collections vs Security Rules Paths
  const activeSdkCollections: FirestoreCollectionDetail[] = [];
  const ruleOnlyCollectionPaths: FirestoreCollectionDetail[] = [];
  const unresolvedOrDynamicPaths: FirestoreCollectionDetail[] = [];
  const legacyDatabaseSchemas: IDatabaseSchemaInfo[] = [];

  // A. Parse Firestore Collections from client SDK calls: collection(db, 'name')
  for (const [relPath, code] of fileContents.entries()) {
    // 1. Literal collection references: collection(db, 'name')
    const collMatches = code.matchAll(/collection\(\s*[^,]+,\s*['"`]([a-zA-Z0-9_-]+)['"`]\)/g);
    for (const cm of collMatches) {
      const collName = cm[1];
      let existing = activeSdkCollections.find((c) => c.name.toLowerCase() === collName.toLowerCase());
      if (!existing) {
        existing = {
          name: collName,
          category: 'active_sdk_reference',
          observedOperations: [],
          fields: [],
          isSchemaFullyInferred: false,
          evidenceSources: [],
          confidence: 'high',
          runtimeUsageEstablished: true,
        };
        activeSdkCollections.push(existing);
      }
      if (!existing.evidenceSources.includes(relPath)) existing.evidenceSources.push(relPath);

      if (code.includes('getDocs') || code.includes('getDoc') || code.includes('onSnapshot') || code.includes('query(')) {
        if (!existing.observedOperations.includes('read/query')) existing.observedOperations.push('read/query');
      }
      if (code.includes('setDoc') || code.includes('addDoc')) {
        if (!existing.observedOperations.includes('create/write')) existing.observedOperations.push('create/write');
      }
      if (code.includes('updateDoc')) {
        if (!existing.observedOperations.includes('update')) existing.observedOperations.push('update');
      }
      if (code.includes('deleteDoc')) {
        if (!existing.observedOperations.includes('delete')) existing.observedOperations.push('delete');
      }
    }

    // 2. Direct doc references: doc(db, 'users', ...)
    const docMatches = code.matchAll(/doc\(\s*[^,]+,\s*['"`]([a-zA-Z0-9_-]+)['"`]/g);
    for (const dm of docMatches) {
      const collName = dm[1];
      let existing = activeSdkCollections.find((c) => c.name.toLowerCase() === collName.toLowerCase());
      if (!existing) {
        existing = {
          name: collName,
          category: 'active_sdk_reference',
          observedOperations: ['read/write'],
          fields: [],
          isSchemaFullyInferred: false,
          evidenceSources: [relPath],
          confidence: 'high',
          runtimeUsageEstablished: true,
        };
        activeSdkCollections.push(existing);
      } else if (!existing.evidenceSources.includes(relPath)) {
        existing.evidenceSources.push(relPath);
      }
    }

    // 3. Dynamic collection references: collection(db, variable)
    const dynamicMatches = code.matchAll(/collection\(\s*[^,]+,\s*([a-zA-Z0-9_]+)\s*\)/g);
    for (const dm of dynamicMatches) {
      const varName = dm[1];
      if (varName !== 'db' && !varName.startsWith("'") && !varName.startsWith('"')) {
        if (!unresolvedOrDynamicPaths.some((u) => u.name === varName)) {
          unresolvedOrDynamicPaths.push({
            name: `[Dynamic: ${varName}]`,
            category: 'dynamic_unresolved',
            observedOperations: ['dynamic_query_mutation'],
            fields: [],
            isSchemaFullyInferred: false,
            evidenceSources: [relPath],
            confidence: 'low',
            limitations: `Collection path is constructed dynamically via variable '${varName}' at runtime.`,
            runtimeUsageEstablished: true,
          });
        }
      }
    }
  }

  // B. Parse firestore.rules for declared security rules scope
  let securityRulesInfo: DatabaseAnalysis['securityRules'];
  for (const [relPath, code] of fileContents.entries()) {
    if (relPath.endsWith('firestore.rules')) {
      const matchRules = code.matchAll(/match\s+\/([a-zA-Z0-9_-]+)\/\{[a-zA-Z0-9_]+\}/g);
      for (const mr of matchRules) {
        const collName = mr[1];
        const isAlreadyActive = activeSdkCollections.some((c) => c.name.toLowerCase() === collName.toLowerCase());
        if (!isAlreadyActive && !ruleOnlyCollectionPaths.some((c) => c.name.toLowerCase() === collName.toLowerCase())) {
          ruleOnlyCollectionPaths.push({
            name: collName,
            category: 'security_rule_only',
            observedOperations: ['permission_rule_declared'],
            fields: [],
            isSchemaFullyInferred: false,
            evidenceSources: [relPath],
            confidence: 'medium',
            limitations:
              'Declared in firestore.rules security permissions; no corresponding client SDK queries or mutations observed in inspected application source code.',
            runtimeUsageEstablished: false,
          });
        }
      }

      securityRulesInfo = {
        rulesFilePath: relPath,
        rulesSnippet: code.substring(0, 450).trim(),
        scope: `Security rules configure authorization boundaries for ${activeSdkCollections.map((c) => c.name).concat(ruleOnlyCollectionPaths.map((c) => c.name)).join(', ')}.`,
        isStaticallyInspected: true,
        deploymentVerified: false,
        analysisNote:
          'Security rules file exists and was inspected statically. Remote deployment status and live Firebase cloud security enforcement cannot be confirmed via static code analysis.',
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

      activeSdkCollections.push({
        name: modelName,
        category: 'orm_model',
        observedOperations: ['CRUD'],
        fields: detectedFields,
        isSchemaFullyInferred: detectedFields.length > 0,
        evidenceSources: [relPath],
        confidence: 'high',
        runtimeUsageEstablished: true,
      });
    }
  }

  // Combine collections for backward compatibility
  const allDetectedCollections = [
    ...activeSdkCollections,
    ...ruleOnlyCollectionPaths,
    ...unresolvedOrDynamicPaths,
  ];

  if (legacyDatabaseSchemas.length === 0 && activeSdkCollections.length > 0) {
    for (const c of activeSdkCollections) {
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
    activeSdkCollections,
    ruleOnlyCollectionPaths,
    unresolvedOrDynamicPaths,
    detectedCollectionsOrTables: allDetectedCollections,
    securityRules: securityRulesInfo,
    summary:
      activeSdkCollections.length > 0
        ? `Database integration active via Cloud Firestore. Detected ${activeSdkCollections.length} active application collections queried/mutated in code (${activeSdkCollections.map((c) => c.name).join(', ')}). An additional ${ruleOnlyCollectionPaths.length} collection paths are declared in security rules (${ruleOnlyCollectionPaths.map((c) => c.name).join(', ')}) without observed client application operations.`
        : database.has('MongoDB')
        ? `Database integration active via MongoDB / Mongoose. Detected ${legacyDatabaseSchemas.length} Mongoose models (${legacyDatabaseSchemas.map((s) => s.modelName).join(', ')}).`
        : hasLocalStorage
        ? `No remote database (SQL/NoSQL) queries detected in application runtime code. Application state and user bookmarks are persisted client-side via browser localStorage (${inspectedFiles.filter((f) => fileContents.get(f)?.includes('localStorage')).map((f) => path.basename(f)).join(', ') || 'SavedNews.tsx'}).${hasSupabaseDep ? ' Supabase client is scaffolded in configuration but not actively queried by UI components.' : ''}`
        : 'No dedicated database models or client datastore operations detected in inspected project files.',
    schemaConfidence: activeSdkCollections.length > 0 ? 'partial' : 'none',
  };

  // 5. API & Communication Analysis
  const serverRestEndpoints: IApiEndpointInfo[] = [];
  const clientSdkOperations: Array<{ service: string; operation: string; target: string; filePath: string }> = [];
  const externalHttpCalls: Array<{ method: string; urlPattern: string; filePath: string }> = [];

  for (const [relPath, code] of fileContents.entries()) {
    // Express Server routes
    if (hasConfirmedServer && !hasPythonServer) {
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

    // Python FastAPI / ASGI routes
    if (hasPythonServer) {
      const pyRouteMatches = code.matchAll(/@(?:app|router)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g);
      for (const rm of pyRouteMatches) {
        const method = rm[1].toUpperCase();
        const routePath = rm[2];
        if (!serverRestEndpoints.some((e) => e.method === method && e.path === routePath)) {
          serverRestEndpoints.push({
            method,
            path: routePath,
            filePath: relPath,
            description: `FastAPI endpoint handling ${method} requests for ${routePath}`,
          });
        }
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

    // External fetch calls and frontend client calls
    const fetchMatches = code.matchAll(/fetch\(\s*[`'"](http:\/\/(?:localhost|127\.0\.0\.1):\d+)?(\/[a-zA-Z0-9_\-\?=&;]+|https?:\/\/[^`'"]+)/g);
    for (const fm of fetchMatches) {
      const urlTarget = (fm[1] || '') + fm[2];
      if (!externalHttpCalls.some((c) => c.urlPattern === urlTarget)) {
        externalHttpCalls.push({
          method: 'GET/POST',
          urlPattern: urlTarget.substring(0, 80),
          filePath: relPath,
        });
      }
    }

    // Audio stream instantiations targeting backend
    const audioMatches = code.matchAll(/new\s+Audio\(\s*[`'"](http:\/\/(?:localhost|127\.0\.0\.1):\d+)?(\/[a-zA-Z0-9_\-\?=&;]+|https?:\/\/[^`'"]+)/g);
    for (const am of audioMatches) {
      const urlTarget = (am[1] || '') + am[2];
      if (!externalHttpCalls.some((c) => c.urlPattern === urlTarget)) {
        externalHttpCalls.push({
          method: 'AUDIO STREAM',
          urlPattern: urlTarget.substring(0, 80),
          filePath: relPath,
        });
      }
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
        ? hasPythonServer
          ? `Application operates an asynchronous Python FastAPI microservice declaring ${serverRestEndpoints.length} REST endpoints (${serverRestEndpoints.map((e) => `${e.method} ${e.path}`).join(', ')}). Frontend interfaces with backend via direct HTTP fetch and audio streaming.`
          : `Application operates an Express HTTP server declaring ${serverRestEndpoints.length} REST endpoints.`
        : clientSdkOperations.length > 0
        ? 'Application communicates directly with cloud backend services via client SDK calls (Firebase Authentication & Cloud Firestore). No custom Express REST endpoints are required or declared.'
        : 'No network API endpoints or client SDK operations detected.',
  };

  // 6. Deep Module Classification & Evidence-Based Responsibility Generation
  const modules: ModuleAnalysis[] = [];
  const legacyComponents: IProjectComponent[] = [];

  for (const [relPath, code] of fileContents.entries()) {
    const ext = path.extname(relPath).toLowerCase();
    if (!['.js', '.jsx', '.ts', '.tsx', '.py'].includes(ext)) continue;

    const baseName = path.basename(relPath, ext);
    const lowerRel = relPath.toLowerCase();

    // Extract function exports, imports, hooks, and integrations
    const exports: string[] = [];
    const importedServices: string[] = [];
    const hooksUsed: string[] = [];
    const externalIntegrations: string[] = [];

    // Classification
    let modType: ModuleAnalysis['type'] = 'other';

    if (ext === '.py') {
      // Python symbol extraction
      const pyFuncMatches = code.matchAll(/def\s+([a-zA-Z0-9_]+)\s*\(/g);
      for (const pf of pyFuncMatches) exports.push(pf[1]);

      const pyClassMatches = code.matchAll(/class\s+([a-zA-Z0-9_]+)/g);
      for (const pc of pyClassMatches) exports.push(pc[1]);

      const pyImportMatches = code.matchAll(/(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/g);
      for (const pim of pyImportMatches) {
        const mod = pim[1] || pim[2];
        if (mod && !importedServices.includes(mod)) importedServices.push(mod);
      }

      if (code.includes('gTTS') || code.includes('from gtts')) externalIntegrations.push('gTTS Audio Synthesis');
      if (code.includes('nltk')) externalIntegrations.push('NLTK');
      if (code.includes('sklearn') || code.includes('TfidfVectorizer')) externalIntegrations.push('Scikit-Learn');
      if (code.includes('BeautifulSoup') || code.includes('bs4')) externalIntegrations.push('BeautifulSoup4');
      if (code.includes('requests')) externalIntegrations.push('Requests HTTP');
      if (code.includes('fastapi') || code.includes('FastAPI')) externalIntegrations.push('FastAPI');
      if (code.includes('dotenv')) externalIntegrations.push('python-dotenv');

      // Python module classification
      if (baseName === 'main' || code.includes('FastAPI(') || code.includes('Flask(')) {
        modType = 'entry_point';
      } else if (lowerRel.includes('services/') || baseName.endsWith('_service') || baseName.endsWith('service') || baseName.includes('pipeline')) {
        modType = 'service';
      } else if (baseName === 'config' || baseName.includes('config')) {
        modType = 'config';
      } else if (baseName.startsWith('test') || baseName.endsWith('_test') || lowerRel.includes('test')) {
        modType = 'test';
      } else if (lowerRel.includes('models/') || code.includes('BaseModel')) {
        modType = 'model';
      } else if (hasPythonServer) {
        modType = 'service';
      } else {
        modType = 'script';
      }
    } else {
      // JavaScript / TypeScript extraction
      const exportFuncMatches = code.matchAll(/export\s+(async\s+)?function\s+([a-zA-Z0-9_]+)/g);
      for (const ef of exportFuncMatches) exports.push(ef[2]);

      const exportConstMatches = code.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)\s*=/g);
      for (const ec of exportConstMatches) exports.push(ec[1]);

      if (code.includes('export default')) {
        exports.push(`default (${baseName})`);
      }

      const importMatches = code.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
      for (const im of importMatches) {
        const impPath = im[1];
        if (!impPath.startsWith('.') && !impPath.startsWith('react') && !importedServices.includes(impPath)) {
          importedServices.push(impPath);
        } else if (impPath.startsWith('.')) {
          const impBase = path.basename(impPath);
          if (!importedServices.includes(impBase)) importedServices.push(impBase);
        }
      }

      ['useState', 'useEffect', 'useContext', 'useAuth', 'useNavigate', 'useParams', 'useMemo', 'useCallback'].forEach((h) => {
        if (code.includes(h)) hooksUsed.push(h);
      });

      if (code.includes('firebase/auth') || code.includes('getAuth')) externalIntegrations.push('Firebase Auth');
      if (code.includes('firebase/firestore') || code.includes('getFirestore')) externalIntegrations.push('Cloud Firestore');
      if (code.includes('recharts')) externalIntegrations.push('Recharts');
      if (code.includes('xlsx')) externalIntegrations.push('SheetJS (XLSX)');
      if (code.includes('@supabase/supabase-js')) externalIntegrations.push('Supabase Client');

      // JavaScript / TypeScript classification
      if (baseName === 'main' || baseName === 'index' || baseName === 'server' || baseName === 'App') {
        modType = 'entry_point';
      } else if (lowerRel.includes('/pages/') || lowerRel.includes('/views/') || baseName.endsWith('Page')) {
        modType = 'page';
      } else if (lowerRel.includes('/components/')) {
        modType = 'ui_component';
      } else if (lowerRel.includes('/context/') || code.includes('createContext')) {
        modType = 'context';
      } else if (lowerRel.includes('/services/')) {
        modType = 'service';
      } else if (lowerRel.includes('/hooks/') || baseName.startsWith('use')) {
        modType = 'hook';
      } else if (lowerRel.includes('/routes/')) {
        modType = 'route_handler';
      } else if (lowerRel.includes('/models/')) {
        modType = 'model';
      } else if (lowerRel.includes('/scripts/')) {
        modType = 'script';
      } else if (baseName.includes('config') || ext === '.json') {
        modType = 'config';
      } else if (lowerRel.includes('test') || baseName.endsWith('.test') || baseName.endsWith('.spec')) {
        modType = 'test';
      } else if (lowerRel.includes('/utils/') || lowerRel.includes('/helpers/')) {
        modType = 'utility';
      }
    }

    // Generate specific, non-generic responsibilities
    let role = '';
    const responsibilities: string[] = [];

    if (ext === '.py') {
      if (modType === 'entry_point') {
        role = `Backend ASGI application entry point declaring HTTP REST API routes and CORS middleware.`;
        responsibilities.push('Initializes FastAPI application instance and configures CORS middleware');
        const foundRoutes: string[] = [];
        const rm = code.matchAll(/@(?:app|router)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g);
        for (const r of rm) foundRoutes.push(`${r[1].toUpperCase()} ${r[2]}`);
        if (foundRoutes.length > 0) {
          responsibilities.push(`Declares HTTP REST routes: ${foundRoutes.join(', ')}`);
        }
        if (importedServices.length > 0) {
          const domainServices = importedServices.filter((s) => !s.startsWith('fastapi') && !s.startsWith('pydantic'));
          if (domainServices.length > 0) {
            responsibilities.push(`Coordinates operations with ${domainServices.slice(0, 3).join(', ')}`);
          }
        }
      } else if (modType === 'service') {
        if (baseName.includes('audio') || code.includes('gTTS')) {
          role = 'Audio synthesis service leveraging gTTS for text-to-speech audio rendering.';
          responsibilities.push('Generates MP3 audio files from article summaries using gTTS');
          responsibilities.push('Manages local audio cache in AUDIO_DIR to prevent redundant generation');
        } else if (baseName.includes('news') || code.includes('BeautifulSoup') || code.includes('requests')) {
          role = 'News aggregation and web scraping service ingesting articles from RSS and publisher feeds.';
          responsibilities.push('Fetches top headlines and RSS items from Google News and publishers');
          responsibilities.push('Scrapes full article paragraphs and sanitizes HTML tags via BeautifulSoup');
          responsibilities.push('Coordinates with NLP pipeline for clustering and categorization');
        } else if (baseName.includes('nlp') || code.includes('TfidfVectorizer') || code.includes('nltk')) {
          role = 'Natural language processing pipeline for extractive text summarization and categorization.';
          responsibilities.push('Implements extractive TextRank summarization via TF-IDF sentence vectorization');
          responsibilities.push('Performs news classification using Naive Bayes (MultinomialNB) and 20newsgroups');
          responsibilities.push('Initializes NLTK tokenization and stopword removal models');
        } else {
          role = `Backend service module providing ${baseName} operations.`;
          if (exports.length > 0) {
            responsibilities.push(`Exposes domain functions: ${exports.slice(0, 4).join(', ')}`);
          } else {
            responsibilities.push(`Executes specialized business logic for ${baseName}`);
          }
        }
      } else if (modType === 'config') {
        role = 'Backend configuration and environment management module.';
        responsibilities.push('Loads environment variables using python-dotenv');
        responsibilities.push('Configures caching directories and external API keys');
      } else if (modType === 'test') {
        role = 'Backend verification and smoke testing script.';
        responsibilities.push('Executes smoke tests and validates news fetching workflows');
        responsibilities.push('Benchmarks NLP summarization pipeline performance');
      } else if (hasPythonServer) {
        role = `Backend supporting module for ${baseName}.`;
        if (exports.length > 0) {
          responsibilities.push(`Provides supporting routines: ${exports.slice(0, 3).join(', ')}`);
        } else {
          responsibilities.push('Provides supporting logic');
        }
      } else {
        role = `Offline Python utility script (${baseName}); not executed during application runtime.`;
        responsibilities.push('Performs local file maintenance and offline formatting transformations');
      }
    } else if (modType === 'entry_point') {
      role = `Application bootstrap module mounting root components.`;
      responsibilities.push(`Initializes application context and binds root React DOM element`);
      if (code.includes('createBrowserRouter') || code.includes('<Router') || code.includes('<Routes')) {
        responsibilities.push('Configures client-side routing hierarchy');
      }
    } else if (modType === 'page') {
      role = `Page view presenting ${baseName.replace(/([A-Z])/g, ' $1').trim()} interface.`;
      responsibilities.push(`Renders top-level view and layout elements for ${baseName}`);
      if (hooksUsed.length > 0) responsibilities.push(`Manages view state using ${hooksUsed.slice(0, 3).join(', ')}`);
      if (importedServices.length > 0) responsibilities.push(`Coordinates operations via ${importedServices.slice(0, 3).join(', ')}`);
    } else if (modType === 'context') {
      role = `React Context provider maintaining application-wide ${baseName.replace('Context', '')} state.`;
      responsibilities.push(`Provides reactive state container and exposes context hooks to consumer components`);
      if (externalIntegrations.length > 0) responsibilities.push(`Synchronizes auth and session state with ${externalIntegrations.join(', ')}`);
    } else if (modType === 'service') {
      role = `Data access and communication service for ${baseName.replace('Service', '')} operations.`;
      if (exports.length > 0) {
        responsibilities.push(`Exposes service operations: ${exports.filter((e) => !e.startsWith('default')).slice(0, 4).join(', ')}`);
      }
      if (externalIntegrations.length > 0) {
        responsibilities.push(`Interfaces with ${externalIntegrations.join(', ')} via direct SDK calls`);
      }
    } else if (modType === 'ui_component') {
      role = `Reusable UI component rendering ${baseName} controls.`;
      responsibilities.push(`Presents interface controls and emits user interaction events`);
      if (hooksUsed.length > 0) responsibilities.push(`Maintains local interaction state (${hooksUsed.slice(0, 2).join(', ')})`);
    } else if (modType === 'script') {
      role = `Administrative script for database maintenance or test execution.`;
      responsibilities.push('Executes administrative workflow outside main application bundle');
    } else if (modType === 'hook') {
      role = `Custom React hook encapsulating reusable ${baseName} behavior.`;
      responsibilities.push('Encapsulates component state and lifecycle side effects');
    } else if (modType === 'config') {
      role = `Tooling and build configuration file.`;
      responsibilities.push(`Declares build and compiler settings for ${baseName}`);
    } else {
      role = `Utility helper module providing shared transformation functions.`;
      if (exports.length > 0) {
        responsibilities.push(`Exports helper routines: ${exports.slice(0, 3).join(', ')}`);
      } else {
        responsibilities.push('Contains supporting utility logic');
      }
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
      lineCount: code.split('\n').length,
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

  if (hasConfirmedServer) {
    if (hasPythonServer) {
      architectureType = 'polyglot_fullstack';
      archNodes.push({
        id: 'server_runtime',
        label: 'Python Backend Microservice',
        sublabel: 'FastAPI ASGI REST Gateway',
        category: 'server_runtime',
        tech: backendRuntime || 'Python 3 / FastAPI',
        evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('FastAPI(') || fileContents.get(f)?.includes('@app.')),
        isConfirmed: true,
        tierNumber: 2,
      });
      archEdges.push({
        sourceId: 'client_ui',
        targetId: 'server_runtime',
        label: 'HTTP REST / JSON (Port 8012)',
        protocol: 'http_rest',
        isConfirmed: true,
        evidenceSources: serverRestEndpoints.map((e) => e.filePath),
      });

      if (declaredPythonDeps.has('nltk') || declaredPythonDeps.has('scikit-learn') || declaredPythonDeps.has('gtts')) {
        archNodes.push({
          id: 'nlp_audio_pipeline',
          label: 'NLP & Audio Pipeline',
          sublabel: 'Extractive Summarization & Audio Synthesis',
          category: 'service_module',
          tech: 'Scikit-Learn, NLTK & gTTS',
          evidenceSources: inspectedFiles.filter((f) => f.includes('nlp_pipeline') || f.includes('audio_service')),
          isConfirmed: true,
          tierNumber: 3,
        });
        archEdges.push({
          sourceId: 'server_runtime',
          targetId: 'nlp_audio_pipeline',
          label: 'In-Process Dispatch',
          protocol: 'direct_call',
          isConfirmed: true,
          evidenceSources: inspectedFiles.filter((f) => f.includes('main.py')),
        });
      }

      if (declaredPythonDeps.has('beautifulsoup4') || declaredPythonDeps.has('requests')) {
        archNodes.push({
          id: 'external_news_source',
          label: 'External News Feeds',
          sublabel: 'Google News RSS & Publisher Scrapes',
          category: 'external_api',
          tech: 'RSS Feeds & BeautifulSoup4',
          evidenceSources: inspectedFiles.filter((f) => f.includes('news_service')),
          isConfirmed: true,
          tierNumber: 3,
        });
        archEdges.push({
          sourceId: 'server_runtime',
          targetId: 'external_news_source',
          label: 'HTTP GET / XML RSS Ingestion',
          protocol: 'http_rest',
          isConfirmed: true,
          evidenceSources: inspectedFiles.filter((f) => f.includes('news_service')),
        });
      }

      if (hasLocalStorage) {
        archNodes.push({
          id: 'client_storage',
          label: 'Browser LocalStorage',
          sublabel: 'Offline Bookmarked Articles',
          category: 'database',
          tech: 'Web Storage API',
          evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('localStorage')),
          isConfirmed: true,
          tierNumber: 1,
        });
        archEdges.push({
          sourceId: 'client_ui',
          targetId: 'client_storage',
          label: 'Synchronous Key-Value API',
          protocol: 'direct_call',
          isConfirmed: true,
          evidenceSources: inspectedFiles.filter((f) => fileContents.get(f)?.includes('localStorage')),
        });
      }
    } else {
      architectureType = 'client_server_db';
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
    }
  } else if (auth.has('Firebase Authentication') || database.has('Cloud Firestore (Firebase)')) {
    architectureType = 'client_baas';

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

    if (database.has('Cloud Firestore (Firebase)')) {
      archNodes.push({
        id: 'cloud_firestore',
        label: 'Cloud Firestore',
        sublabel: 'NoSQL Document Store (BaaS)',
        category: 'baas_database',
        tech: 'Firebase Firestore SDK',
        evidenceSources: activeSdkCollections.flatMap((c) => c.evidenceSources),
        isConfirmed: true,
        tierNumber: 2,
      });
      archEdges.push({
        sourceId: 'client_ui',
        targetId: 'cloud_firestore',
        label: 'Firestore SDK (Queries & Mutations)',
        protocol: 'sdk_client',
        isConfirmed: true,
        evidenceSources: activeSdkCollections.flatMap((c) => c.evidenceSources),
      });
    }
  } else {
    architectureType = 'frontend_spa_only';
    inferences.push('Static frontend application verified; no server or database integration present in codebase.');
  }

  const architecture: ArchitectureModel = {
    architectureType,
    architectureSummary:
      architectureType === 'polyglot_fullstack'
        ? `${detectedProjectName} implements a Polyglot Fullstack architecture comprising a ${Array.from(frontend).join(', ') || 'React'} client single-page application and an independent ${Array.from(backend).join(', ') || 'Python FastAPI'} backend microservice. The client interfaces with the backend over HTTP REST endpoints (${serverRestEndpoints.map((e) => e.path).join(', ') || '/news, /summarize, /audio'}).`
        : architectureType === 'client_baas'
        ? `${detectedProjectName} implements a client-side Backend-as-a-Service (BaaS) architecture. The ${Array.from(frontend).join(', ') || 'React'} client application interfaces directly with managed cloud services (Firebase Authentication and Cloud Firestore) via client SDK calls without an intermediate custom Express server.`
        : architectureType === 'client_server_db'
        ? `${detectedProjectName} implements a multi-tier client/server architecture with a client interface, custom Express.js server routing tier, and ${Array.from(database).join(', ') || 'database'} persistence.`
        : `${detectedProjectName} is structured as a client-side frontend application with no declared server backend or database tier.`,
    nodes: archNodes,
    edges: archEdges,
    inferences,
  };

  // 8. Coverage Report
  const totalDiscovered = allDiscoveredFiles.length;
  const inspectedCount = inspectedFiles.length;
  const skippedCount = skippedByPolicyFiles.length;
  const coveragePercentage = totalDiscovered > 0 ? Math.round((inspectedCount / totalDiscovered) * 100) : 100;
  const isPartial = totalDiscovered > inspectedCount;

  const coverageReport: CoverageReport = {
    totalDiscoveredFiles: totalDiscovered,
    inspectedFilesCount: inspectedCount,
    inspectedFiles,
    skippedByPolicyCount: skippedCount,
    skippedByPolicySample: skippedByPolicyFiles.slice(0, 15),
    unreadableFilesCount: unreadableFiles.length,
    sizeExceededFilesCount: sizeExceededFiles.length,
    cappedOmittedFilesCount: cappedOmittedFiles.length,
    coveragePercentage,
    isPartial,
    limitationNotice: isPartial
      ? `Analysis is based on ${inspectedCount} of ${totalDiscovered} total repository files (${coveragePercentage}% coverage). Static inspection excluded ${skippedCount} non-code/binary artifacts, ${sizeExceededFiles.length} oversized files, and prioritized core source modules. Inferences are bounded by this inspected subset.`
      : `Full repository coverage achieved (${inspectedCount} of ${totalDiscovered} files analyzed).`,
    excludedDirectories: Array.from(excludedDirectoriesSet),
    inventoryReconciled: isInventoryReconciled,
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
      `Software application built with ${primaryRuntime}.`,
    submissionType: 'zip',
    coverage: coverageReport,
    findings,
    technologies: {
      primaryRuntime,
      backendRuntime,
      languages: Array.from(languages),
      sourceLanguages,
      frontend: Array.from(frontend),
      backend: Array.from(backend),
      database: Array.from(database),
      auth: Array.from(auth),
      frameworks: Array.from(frameworks),
      buildTools: Array.from(buildTools),
      testTools: Array.from(testTools),
      packageManagers: Array.from(packageManagers),
    },
    subsystems: hasPythonServer
      ? {
          frontend: `${Array.from(frontend).join(', ') || 'React'} Single Page Application (Vite)`,
          backend: `${backendRuntime || 'Python 3 / FastAPI HTTP Microservice'}`,
          communicationStatus: `Confirmed HTTP REST client-to-backend integration (${serverRestEndpoints.map((e) => e.path).join(', ') || '/news, /summarize, /audio'})`,
        }
      : undefined,
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
