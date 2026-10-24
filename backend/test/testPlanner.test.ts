import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateProjectTestPlan } from '../src/services/testPlanner';
import { AnalysisResult } from '../src/services/analyzerService';

describe('TestPlanner', () => {
  it('plans startup, routes, and API endpoint test cases for fullstack project', () => {
    const mockAnalysis: any = {
      projectSummary: {
        name: 'fullstack-app',
        purpose: 'Fullstack SaaS Application',
        scope: 'web',
      },
      technologies: {
        languages: ['TypeScript', 'JavaScript'],
        frontend: ['React'],
        backend: ['Express'],
        database: ['MongoDB'],
        frameworks: ['React', 'Express'],
        buildTools: ['Vite'],
        testTools: ['Vitest'],
        packageManagers: ['npm'],
        primaryRuntime: 'Node.js',
      },
      packageScripts: {
        dev: 'vite',
        start: 'node server.js',
        build: 'vite build',
        test: 'vitest run',
      },
      routes: [
        { path: '/', componentName: 'HomeView' },
        { path: '/dashboard', componentName: 'DashboardView' },
      ],
      apiEndpoints: [
        { method: 'GET', path: '/api/health', filePath: 'server.js' },
        { method: 'POST', path: '/api/auth/login', filePath: 'routes/auth.js' },
      ],
      components: [],
      databaseSchemas: [],
      detectedTechnologies: {
        languages: ['TypeScript'],
        frontend: ['React'],
        backend: ['Express'],
        database: ['MongoDB'],
        frameworks: ['React', 'Express'],
        buildTools: ['Vite'],
        testTools: ['Vitest'],
        packageManagers: ['npm'],
      },
      inspectedFiles: ['package.json', 'server.js'],
      totalFilesCount: 2,
    };

    const plan = generateProjectTestPlan(mockAnalysis as AnalysisResult);

    assert.ok(plan.totalPlannedTests >= 5, `Expected >= 5 tests, got ${plan.totalPlannedTests}`);
    assert.strictEqual(plan.hasExecutableStartup, true);
    assert.strictEqual(plan.detectedStartupCommand, 'npm run dev');
    assert.strictEqual(plan.hasOwnTestScript, true);
    assert.strictEqual(plan.ownTestCommand, 'vitest run');

    // Check specific categories
    const categories = plan.testCases.map((t) => t.category);
    assert.ok(categories.includes('configuration_sanity'));
    assert.ok(categories.includes('startup'));
    assert.ok(categories.includes('http_readiness'));
    assert.ok(categories.includes('route_accessibility'));
    assert.ok(categories.includes('api_endpoint'));
    assert.ok(categories.includes('project_unit_test'));
  });
});
