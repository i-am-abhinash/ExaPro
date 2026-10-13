import path from 'path';
import fs from 'fs';
import {
  IDetectedTechnologies,
  IProjectComponent,
  IDatabaseSchemaInfo,
  IApiEndpointInfo,
} from '../models/Project';

export interface AnalysisResult {
  projectName: string;
  projectDescription: string;
  detectedTechnologies: IDetectedTechnologies;
  components: IProjectComponent[];
  databaseSchemas: IDatabaseSchemaInfo[];
  apiEndpoints: IApiEndpointInfo[];
  inspectedFiles: string[];
  totalFilesCount: number;
  folderTree: string;
  packageScripts: Record<string, string>;
  dependenciesList: Array<{ name: string; version: string; isDev: boolean }>;
  readmeContent?: string;
  environmentVariables: string[];
  testSuites: string[];
  limitations: string[];
}

export function analyzeProjectDirectory(rootDir: string, defaultName: string): AnalysisResult {
  const inspectedFiles: string[] = [];
  const allRelativeFilePaths: string[] = [];
  const limitations: string[] = [];

  // Recursively collect all files (skipping ignored folders)
  function walkDir(dir: string, base: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = path.join(base, entry.name).replace(/\\/g, '/');
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const lowerName = entry.name.toLowerCase();
        if (
          lowerName === 'node_modules' ||
          lowerName === '.git' ||
          lowerName === 'dist' ||
          lowerName === 'build' ||
          lowerName === '.next' ||
          lowerName === 'coverage' ||
          lowerName === '__pycache__' ||
          lowerName === 'vendor'
        ) {
          continue;
        }
        walkDir(fullPath, relPath);
      } else if (entry.isFile()) {
        allRelativeFilePaths.push(relPath);
      }
    }
  }

  walkDir(rootDir);

  // Initialize technology sets
  const languageSet = new Set<string>();
  const frontendSet = new Set<string>();
  const backendSet = new Set<string>();
  const databaseSet = new Set<string>();
  const frameworkSet = new Set<string>();
  const buildToolSet = new Set<string>();
  const testToolSet = new Set<string>();
  const packageManagerSet = new Set<string>();

  const components: IProjectComponent[] = [];
  const databaseSchemas: IDatabaseSchemaInfo[] = [];
  const apiEndpoints: IApiEndpointInfo[] = [];
  const packageScripts: Record<string, string> = {};
  const dependenciesList: Array<{ name: string; version: string; isDev: boolean }> = [];
  const environmentVariables: string[] = [];
  const testSuites: string[] = [];

  let detectedProjectName = defaultName;
  let projectDescription = '';
  let readmeContent = '';

  // 1. Language Detection by Extension
  for (const relPath of allRelativeFilePaths) {
    const ext = path.extname(relPath).toLowerCase();
    if (ext === '.ts') languageSet.add('TypeScript');
    else if (ext === '.tsx') {
      languageSet.add('TypeScript');
      frontendSet.add('React');
    } else if (ext === '.js') languageSet.add('JavaScript');
    else if (ext === '.jsx') {
      languageSet.add('JavaScript');
      frontendSet.add('React');
    } else if (ext === '.py') languageSet.add('Python');
    else if (ext === '.java') languageSet.add('Java');
    else if (ext === '.go') languageSet.add('Go');
    else if (ext === '.rs') languageSet.add('Rust');
    else if (ext === '.rb') languageSet.add('Ruby');
    else if (ext === '.php') languageSet.add('PHP');
    else if (ext === '.cs') languageSet.add('C#');
    else if (ext === '.html') languageSet.add('HTML');
    else if (ext === '.css' || ext === '.scss') languageSet.add('CSS');
  }

  // 2. Package Manifests Inspection (Node.js / package.json)
  const packageJsonFiles = allRelativeFilePaths.filter((p) => p.endsWith('package.json'));
  for (const pkgRel of packageJsonFiles) {
    inspectedFiles.push(pkgRel);
    try {
      const fullPath = path.join(rootDir, pkgRel);
      const pkgContent = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      if (pkgContent.name && detectedProjectName === defaultName) {
        detectedProjectName = pkgContent.name;
      }
      if (pkgContent.description && !projectDescription) {
        projectDescription = pkgContent.description;
      }

      if (pkgContent.scripts) {
        Object.assign(packageScripts, pkgContent.scripts);
      }

      const deps = { ...pkgContent.dependencies };
      const devDeps = { ...pkgContent.devDependencies };

      for (const [dep, ver] of Object.entries(deps)) {
        dependenciesList.push({ name: dep, version: String(ver), isDev: false });
        checkDependencyTech(dep);
      }
      for (const [dep, ver] of Object.entries(devDeps)) {
        dependenciesList.push({ name: dep, version: String(ver), isDev: true });
        checkDependencyTech(dep);
      }
    } catch (err: any) {
      limitations.push(`Failed to parse manifest ${pkgRel}: ${err.message}`);
    }
  }

  function checkDependencyTech(dep: string) {
    const d = dep.toLowerCase();
    // Frontend
    if (d === 'react' || d === 'react-dom') frontendSet.add('React');
    if (d === 'vue') frontendSet.add('Vue.js');
    if (d === 'svelte') frontendSet.add('Svelte');
    if (d === '@angular/core') frontendSet.add('Angular');
    if (d === 'next') {
      frontendSet.add('Next.js');
      backendSet.add('Next.js SSR');
    }
    if (d === 'tailwindcss') frontendSet.add('Tailwind CSS');
    if (d === 'bootstrap') frontendSet.add('Bootstrap');
    if (d.includes('lucide') || d.includes('heroicons') || d.includes('font-awesome')) frontendSet.add('Icon Library');
    if (d === 'framer-motion') frontendSet.add('Framer Motion');
    if (d === 'recharts' || d === 'chart.js') frontendSet.add('Chart Library');

    // Backend
    if (d === 'express') backendSet.add('Express.js');
    if (d === 'fastify') backendSet.add('Fastify');
    if (d === '@nestjs/core') backendSet.add('NestJS');
    if (d === 'koa') backendSet.add('Koa');
    if (d === 'cors') backendSet.add('CORS Middleware');
    if (d === 'socket.io') backendSet.add('Socket.io Realtime');

    // Database
    if (d === 'mongoose' || d === 'mongodb') databaseSet.add('MongoDB');
    if (d === 'pg' || d === 'postgres') databaseSet.add('PostgreSQL');
    if (d === 'mysql' || d === 'mysql2') databaseSet.add('MySQL');
    if (d === 'prisma' || d === '@prisma/client') databaseSet.add('Prisma ORM');
    if (d === 'typeorm') databaseSet.add('TypeORM');
    if (d === 'sequelize') databaseSet.add('Sequelize');
    if (d === 'redis' || d === 'ioredis') databaseSet.add('Redis');
    if (d === 'sqlite3' || d === 'better-sqlite3') databaseSet.add('SQLite');

    // Testing
    if (d === 'jest') testToolSet.add('Jest');
    if (d === 'vitest') testToolSet.add('Vitest');
    if (d === 'mocha') testToolSet.add('Mocha');
    if (d === 'supertest') testToolSet.add('Supertest (API Testing)');
    if (d === 'playwright' || d === '@playwright/test') testToolSet.add('Playwright');
    if (d === 'cypress') testToolSet.add('Cypress');

    // Build tools & validation
    if (d === 'vite') buildToolSet.add('Vite');
    if (d === 'webpack') buildToolSet.add('Webpack');
    if (d === 'esbuild') buildToolSet.add('esbuild');
    if (d === 'typescript') languageSet.add('TypeScript');
    if (d === 'zod') frameworkSet.add('Zod Validation');
  }

  // Check Lockfiles
  if (allRelativeFilePaths.some((p) => p.endsWith('package-lock.json'))) packageManagerSet.add('npm');
  if (allRelativeFilePaths.some((p) => p.endsWith('yarn.lock'))) packageManagerSet.add('yarn');
  if (allRelativeFilePaths.some((p) => p.endsWith('pnpm-lock.yaml'))) packageManagerSet.add('pnpm');

  // Python manifests
  if (allRelativeFilePaths.some((p) => p.endsWith('requirements.txt') || p.endsWith('Pipfile') || p.endsWith('pyproject.toml'))) {
    languageSet.add('Python');
    packageManagerSet.add('pip');
  }

  // 3. README Inspection
  const readmePath = allRelativeFilePaths.find((p) => path.basename(p).toLowerCase() === 'readme.md');
  if (readmePath) {
    inspectedFiles.push(readmePath);
    try {
      const content = fs.readFileSync(path.join(rootDir, readmePath), 'utf-8');
      readmeContent = content;
      if (!projectDescription) {
        // Grab first non-header paragraph
        const lines = content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('!'));
        if (lines.length > 0) {
          projectDescription = lines[0].substring(0, 300);
        }
      }
    } catch (err: any) {
      console.warn(`[Analyzer] Could not read README: ${err.message}`);
    }
  }

  // 4. Environment Template Inspection (.env.example or .env.sample)
  const envFiles = allRelativeFilePaths.filter((p) => {
    const base = path.basename(p).toLowerCase();
    return base === '.env.example' || base === '.env.sample' || base === '.env.template';
  });
  for (const envFile of envFiles) {
    inspectedFiles.push(envFile);
    try {
      const content = fs.readFileSync(path.join(rootDir, envFile), 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const varName = trimmed.split('=')[0].trim();
          if (varName && !environmentVariables.includes(varName)) {
            environmentVariables.push(varName);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Test Files Inspection
  for (const relPath of allRelativeFilePaths) {
    const lower = relPath.toLowerCase();
    if (
      lower.includes('.test.') ||
      lower.includes('.spec.') ||
      lower.includes('/__tests__/') ||
      lower.startsWith('tests/') ||
      lower.startsWith('test/')
    ) {
      testSuites.push(relPath);
    }
  }

  // 6. Source Code Inspection for Routes, Models, and Architecture Components
  // Select key source files to inspect
  const sourceFiles = allRelativeFilePaths.filter((p) => {
    const ext = path.extname(p).toLowerCase();
    return ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go'].includes(ext);
  });

  for (const relPath of sourceFiles) {
    const lower = relPath.toLowerCase();
    const fullPath = path.join(rootDir, relPath);

    // Limit individual file size read to 100KB to stay fast
    try {
      const stats = fs.statSync(fullPath);
      if (stats.size > 100 * 1024) continue;

      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      inspectedFiles.push(relPath);

      // A. Mongoose / Database Schema detection
      if (
        (lower.includes('/models/') || lower.includes('/schemas/') || lower.includes('/entities/')) &&
        (fileContent.includes('Schema(') || fileContent.includes('model(') || fileContent.includes('Entity('))
      ) {
        const modelName = path.basename(relPath, path.extname(relPath));
        const detectedFields: Array<{ name: string; type: string; required?: boolean }> = [];

        // Simple heuristic extraction of schema fields
        const fieldMatches = fileContent.matchAll(/([a-zA-Z0-9_]+)\s*:\s*\{\s*type\s*:\s*([a-zA-Z0-9_.]+)/g);
        for (const fm of fieldMatches) {
          detectedFields.push({
            name: fm[1],
            type: fm[2],
            required: fileContent.includes(`required: true`),
          });
        }
        if (detectedFields.length === 0) {
          const shorthandMatches = fileContent.matchAll(/([a-zA-Z0-9_]+)\s*:\s*(String|Number|Boolean|Date|Array|ObjectId)/g);
          for (const sm of shorthandMatches) {
            detectedFields.push({ name: sm[1], type: sm[2] });
          }
        }

        databaseSchemas.push({
          modelName: modelName.charAt(0).toUpperCase() + modelName.slice(1),
          filePath: relPath,
          fields: detectedFields.length > 0 ? detectedFields : [{ name: 'data', type: 'Object' }],
        });

        components.push({
          name: `${modelName} Model`,
          type: 'model',
          path: relPath,
          description: `Data model representing ${modelName} entities in the database.`,
          responsibilities: ['Schema definition', 'Data validation', 'Query interface'],
        });
      }

      // B. Express / API Route detection
      if (
        lower.includes('/routes/') ||
        lower.includes('/controllers/') ||
        lower.includes('/api/') ||
        lower.includes('server.') ||
        lower.includes('app.') ||
        lower.includes('index.') ||
        fileContent.includes('Router(') ||
        fileContent.includes('.get(') ||
        fileContent.includes('.post(')
      ) {
        const routeMatches = fileContent.matchAll(/(router|app)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g);
        let foundAnyRoute = false;
        for (const rm of routeMatches) {
          foundAnyRoute = true;
          apiEndpoints.push({
            method: rm[2].toUpperCase(),
            path: rm[3],
            filePath: relPath,
            description: `Handles ${rm[2].toUpperCase()} requests for ${rm[3]}`,
          });
        }

        if (foundAnyRoute && !components.some((c) => c.path === relPath)) {
          components.push({
            name: `${path.basename(relPath, path.extname(relPath))} Router`,
            type: 'router',
            path: relPath,
            description: `API routing component handling HTTP endpoints.`,
            responsibilities: ['Request routing', 'Input validation', 'Response serialization'],
          });
        }
      }

      // C. Frontend UI Pages / Components
      if (
        (lower.includes('/components/') || lower.includes('/pages/') || lower.includes('/views/')) &&
        (fileContent.includes('return (') || fileContent.includes('export default function') || fileContent.includes('export const'))
      ) {
        const compName = path.basename(relPath, path.extname(relPath));
        if (!components.some((c) => c.name === compName)) {
          components.push({
            name: compName,
            type: 'client',
            path: relPath,
            description: `Interactive client-side user interface module.`,
            responsibilities: ['User interface rendering', 'State management', 'User interactions'],
          });
        }
      }

      // D. Service / Business Logic Layer
      if (lower.includes('/services/') || lower.includes('/logic/') || lower.includes('/core/')) {
        const svcName = path.basename(relPath, path.extname(relPath));
        components.push({
          name: `${svcName} Service`,
          type: 'service',
          path: relPath,
          description: `Business logic and operations service module.`,
          responsibilities: ['Business rule execution', 'Data transformation', 'External integration'],
        });
      }
    } catch {
      // ignore individual unreadable files
    }
  }

  // 7. Ensure Core Architecture Components Exist
  if (frontendSet.size > 0 && !components.some((c) => c.type === 'client')) {
    components.unshift({
      name: 'Client Application (UI)',
      type: 'client',
      path: allRelativeFilePaths.find((p) => p.includes('src/App') || p.includes('src/index') || p.includes('pages/')) || 'frontend',
      description: `Frontend user interface powered by ${Array.from(frontendSet).join(', ')}.`,
      responsibilities: ['Client-side routing', 'Component state management', 'User interaction handling'],
    });
  }

  if (backendSet.size > 0 && !components.some((c) => c.type === 'server')) {
    components.unshift({
      name: 'Server / API Gateway',
      type: 'server',
      path: allRelativeFilePaths.find((p) => p.includes('server.') || p.includes('app.') || p.includes('main.')) || 'backend',
      description: `Backend server and API gateway powered by ${Array.from(backendSet).join(', ')}.`,
      responsibilities: ['HTTP request handling', 'CORS & Security middleware', 'Service dispatching'],
    });
  }

  if (databaseSet.size > 0 && !components.some((c) => c.type === 'database')) {
    components.push({
      name: 'Database Layer',
      type: 'database',
      path: allRelativeFilePaths.find((p) => p.includes('db') || p.includes('models')) || 'database',
      description: `Data storage and persistence tier powered by ${Array.from(databaseSet).join(', ')}.`,
      responsibilities: ['Data persistence', 'Query execution', 'Data integrity & constraints'],
    });
  }

  // 8. Generate ASCII Folder Tree (top 3 levels, clean format)
  const folderTree = generateAsciiTree(allRelativeFilePaths);

  return {
    projectName: detectedProjectName,
    projectDescription: projectDescription || `Software project built with ${Array.from(languageSet).join(', ') || 'modern technologies'}.`,
    detectedTechnologies: {
      languages: Array.from(languageSet),
      frontend: Array.from(frontendSet),
      backend: Array.from(backendSet),
      database: Array.from(databaseSet),
      frameworks: Array.from(frameworkSet),
      buildTools: Array.from(buildToolSet),
      testTools: Array.from(testToolSet),
      packageManagers: Array.from(packageManagerSet),
    },
    components,
    databaseSchemas,
    apiEndpoints,
    inspectedFiles: Array.from(new Set(inspectedFiles)),
    totalFilesCount: allRelativeFilePaths.length,
    folderTree,
    packageScripts,
    dependenciesList,
    readmeContent,
    environmentVariables,
    testSuites,
    limitations,
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
    if (depth > 4) return; // Prevent excessive vertical depth
    if (node.name) {
      lines.push(`${prefix}${isLast ? '└── ' : '├── '}${node.name}${node.isFile ? '' : '/'}`);
    }

    const childEntries = Array.from(node.children.values());
    const nextPrefix = node.name ? prefix + (isLast ? '    ' : '│   ') : '';
    for (let i = 0; i < childEntries.length; i++) {
      if (lines.length > 80) {
        lines.push(`${nextPrefix}└── ... (additional files omitted for readability)`);
        break;
      }
      printNode(childEntries[i], nextPrefix, i === childEntries.length - 1, depth + 1);
    }
  }

  printNode(root, '', true, 0);
  return lines.join('\n');
}
