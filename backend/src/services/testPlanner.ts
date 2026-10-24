import { ITestCase } from '../models/testingModel';
import { AnalysisResult } from './analyzerService';

export interface TestPlanGenerationResult {
  testCases: ITestCase[];
  targetFramework: string;
  hasExecutableStartup: boolean;
  detectedStartupCommand?: string;
  hasOwnTestScript: boolean;
  ownTestCommand?: string;
  totalPlannedTests: number;
  routesPlannedCount: number;
  endpointsPlannedCount: number;
}

export function generateProjectTestPlan(analysis: AnalysisResult): TestPlanGenerationResult {
  const testCases: ITestCase[] = [];
  let testCounter = 1;

  const scripts = analysis.packageScripts || {};
  const hasDevScript = Boolean(scripts.dev);
  const hasStartScript = Boolean(scripts.start);
  const hasBuildScript = Boolean(scripts.build);
  const hasTestScript = Boolean(scripts.test && !scripts.test.includes('no test specified'));

  let detectedStartupCommand: string | undefined;
  if (hasDevScript) {
    detectedStartupCommand = 'npm run dev';
  } else if (hasStartScript) {
    detectedStartupCommand = 'npm start';
  } else if (hasBuildScript) {
    detectedStartupCommand = 'npm run build && npm start';
  }

  const primaryFramework = analysis.technologies.frontend[0] ||
    analysis.technologies.backend[0] ||
    analysis.technologies.frameworks[0] ||
    analysis.technologies.primaryRuntime ||
    'Generic Web Application';

  // 1. Configuration & Dependency Sanity Test
  testCases.push({
    id: `TC-${String(testCounter++).padStart(3, '0')}`,
    name: 'Manifest and Dependency Sanity',
    category: 'configuration_sanity',
    target: 'package.json / manifests',
    description: 'Verify project manifests, configuration schemas, and dependency declarations for syntax consistency.',
    expectedOutcome: 'Manifests must parse cleanly with all declared dependencies and entry points resolvable.',
    status: 'pending',
    evidenceIds: [],
  });

  // 2. Application Startup & Build Readiness Test
  if (detectedStartupCommand || hasBuildScript) {
    testCases.push({
      id: `TC-${String(testCounter++).padStart(3, '0')}`,
      name: 'Application Startup & Server Readiness',
      category: 'startup',
      target: detectedStartupCommand || (hasBuildScript ? 'npm run build' : 'entry point'),
      description: `Validate application launches cleanly using detected startup command "${detectedStartupCommand || 'npm run build'}" without process termination or fatal uncaught exceptions.`,
      expectedOutcome: 'Application process boots within timeout and signals ready state with an active HTTP listener.',
      status: 'pending',
      evidenceIds: [],
    });
  } else {
    testCases.push({
      id: `TC-${String(testCounter++).padStart(3, '0')}`,
      name: 'Application Startup Verification',
      category: 'startup',
      target: 'package.json / scripts',
      description: 'Check for a valid startup command (e.g. "dev" or "start" script in package.json).',
      expectedOutcome: 'A runnable startup script should be defined in project manifests.',
      status: 'blocked',
      blockingReason: 'No "dev" or "start" script found in package.json. Manual start command required.',
      evidenceIds: [],
    });
  }

  // 3. HTTP Readiness & Port Listening Test
  testCases.push({
    id: `TC-${String(testCounter++).padStart(3, '0')}`,
    name: 'Local HTTP Readiness Probe',
    category: 'http_readiness',
    target: 'http://localhost:[port]/',
    description: 'Issue an HTTP GET request to application root to confirm server responds with valid HTTP headers.',
    expectedOutcome: 'Server returns HTTP 200 (or acceptable redirect 30x) within connection timeout.',
    status: 'pending',
    evidenceIds: [],
  });

  // 4. Frontend Route Accessibility Tests
  const discoveredRoutes = new Set<string>();
  discoveredRoutes.add('/');

  // Extract routes from findings, components, and module analysis
  for (const m of (analysis.modules || [])) {
    if (m.type === 'page' || m.type === 'route_handler') {
      const baseName = m.name.toLowerCase().replace(/page$|view$|route$/i, '');
      if (baseName && baseName !== 'home' && baseName !== 'index' && baseName !== 'app') {
        discoveredRoutes.add(`/${baseName}`);
      }
    }
  }

  // Extract from findings if route finding exists
  for (const f of (analysis.findings || [])) {
    if (f.category === 'route' && f.value) {
      if (f.value.startsWith('/')) {
        discoveredRoutes.add(f.value);
      }
    }
  }

  let routeCount = 0;
  for (const route of Array.from(discoveredRoutes).slice(0, 8)) {
    routeCount++;
    testCases.push({
      id: `TC-${String(testCounter++).padStart(3, '0')}`,
      name: `Route Accessibility: "${route}"`,
      category: 'route_accessibility',
      target: route,
      description: `Navigate to route "${route}" in automated headless browser and verify page loads without HTTP 404/500 errors.`,
      expectedOutcome: `Route "${route}" returns status 200 OK and mounts successfully in the browser viewport.`,
      status: 'pending',
      evidenceIds: [],
    });
  }

  // 5. Blank Page & DOM Mount Verification Test
  testCases.push({
    id: `TC-${String(testCounter++).padStart(3, '0')}`,
    name: 'Blank Page & Root Viewport Render Check',
    category: 'blank_page',
    target: 'DOM #root / #app / body',
    description: 'Inspect the document body in headless browser to confirm application rendered visible UI elements rather than an unmounted blank white screen.',
    expectedOutcome: 'Root container contains mounted DOM nodes, text content, and visible interactive layout.',
    status: 'pending',
    evidenceIds: [],
  });

  // 6. Browser Console Error Detection Test
  testCases.push({
    id: `TC-${String(testCounter++).padStart(3, '0')}`,
    name: 'Browser Console & Runtime Exception Probe',
    category: 'console_errors',
    target: 'window.console.error / window.onerror',
    description: 'Monitor browser runtime console logs and uncaught window errors during page load and navigation.',
    expectedOutcome: 'No uncaught fatal JavaScript exceptions, unhandled Promise rejections, or React error boundaries triggered.',
    status: 'pending',
    evidenceIds: [],
  });

  // 7. Network Integrity & Asset Loading Test
  testCases.push({
    id: `TC-${String(testCounter++).padStart(3, '0')}`,
    name: 'Network Request & Asset Integrity Check',
    category: 'network_integrity',
    target: 'Network requests / subresources',
    description: 'Verify static assets (JS chunks, CSS stylesheets, images) and initial XHR/fetch requests load without 404 Not Found or CORS failures.',
    expectedOutcome: 'All critical bundled subresources return HTTP 200/304 without network failure.',
    status: 'pending',
    evidenceIds: [],
  });

  // 8. Interactive Elements Sanity Test
  testCases.push({
    id: `TC-${String(testCounter++).padStart(3, '0')}`,
    name: 'UI Interactive Elements & Navigation Sanity',
    category: 'ui_interaction',
    target: 'Primary buttons, links, navigation controls',
    description: 'Discover accessible buttons, links, and form elements in the rendered DOM; verify buttons are clickable without crashing.',
    expectedOutcome: 'Interactive elements are accessible, enabled, and respond to pointer events without JavaScript errors.',
    status: 'pending',
    evidenceIds: [],
  });

  // 9. Backend API Endpoint Tests (if server endpoints discovered)
  let endpointCount = 0;
  const discoveredEndpoints =
    (analysis.api && analysis.api.serverRestEndpoints) ||
    (analysis.apiEndpoints || []);
  if (discoveredEndpoints.length > 0) {
    const getEndpoints = discoveredEndpoints.filter(
      (ep) => ep.method.toUpperCase() === 'GET' && !ep.path.includes(':') && !ep.path.includes('{')
    );

    for (const ep of getEndpoints.slice(0, 5)) {
      endpointCount++;
      testCases.push({
        id: `TC-${String(testCounter++).padStart(3, '0')}`,
        name: `API Endpoint Verification: GET ${ep.path}`,
        category: 'api_endpoint',
        target: `${ep.method.toUpperCase()} ${ep.path}`,
        description: `Dispatch safe HTTP GET probe to discovered API endpoint "${ep.path}" and verify valid response headers.`,
        expectedOutcome: 'API returns HTTP 200 with structured JSON content.',
        status: 'pending',
        evidenceIds: [],
      });
    }

    // Unsafe or state-modifying endpoints (POST, PUT, DELETE) must not be blindly executed
    const stateEndpoints = discoveredEndpoints.filter(
      (ep) => ['POST', 'PUT', 'DELETE', 'PATCH'].includes(ep.method.toUpperCase())
    );
    if (stateEndpoints.length > 0) {
      testCases.push({
        id: `TC-${String(testCounter++).padStart(3, '0')}`,
        name: `State-Modifying API Endpoints (${stateEndpoints.length} Discovered)`,
        category: 'api_endpoint',
        target: stateEndpoints.map((e) => `${e.method} ${e.path}`).slice(0, 3).join(', '),
        description: 'Potentially state-mutating endpoints discovered in source code. Automated destructive invocation avoided without explicit authorization.',
        expectedOutcome: 'State-mutating endpoints documented for authenticated testing.',
        status: 'blocked',
        blockingReason: 'Destructive / state-modifying endpoints (POST/PUT/DELETE) require test authentication and explicit payload schemas to prevent data corruption.',
        evidenceIds: [],
      });
    }
  }

  // 10. Project Supplied Automated Unit Tests
  if (hasTestScript) {
    testCases.push({
      id: `TC-${String(testCounter++).padStart(3, '0')}`,
      name: 'Project Internal Test Suite (npm test)',
      category: 'project_unit_test',
      target: scripts.test || 'npm test',
      description: 'Execute the project\'s own internal automated test suite defined in package.json.',
      expectedOutcome: 'Internal test runner exits with code 0 (all test assertions passed).',
      status: 'pending',
      evidenceIds: [],
    });
  }

  return {
    testCases,
    targetFramework: primaryFramework,
    hasExecutableStartup: Boolean(detectedStartupCommand),
    detectedStartupCommand,
    hasOwnTestScript: hasTestScript,
    ownTestCommand: hasTestScript ? scripts.test : undefined,
    totalPlannedTests: testCases.length,
    routesPlannedCount: routeCount,
    endpointsPlannedCount: endpointCount,
  };
}
