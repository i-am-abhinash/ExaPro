import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { generateFaultDocxReport } from '../src/services/faultReportDocxService';

describe('FaultReportDocxService', () => {
  it('generates a valid binary DOCX fault report with tables and badges', async () => {
    const mockProject: any = {
      _id: 'test-project-12345',
      projectName: 'TestApp',
      submissionType: 'zip',
      uploadedFileName: 'test.zip',
      createdAt: new Date(),
    };

    const mockAnalysis: any = {
      projectSummary: {
        name: 'TestApp',
        purpose: 'Automated testing testbed',
      },
      technologies: {
        languages: ['TypeScript'],
        frontend: ['React'],
        backend: ['Express'],
        database: ['MongoDB'],
        frameworks: ['React', 'Express'],
        buildTools: ['Vite'],
        testTools: ['Jest'],
        packageManagers: ['npm'],
      },
      inspectedFiles: ['index.ts'],
      totalFilesCount: 1,
    };

    const mockTestRun: any = {
      summary: {
        totalTests: 4,
        passed: 3,
        failed: 1,
        blocked: 0,
        notTested: 0,
        totalFindings: 1,
        confirmedFaults: 1,
        potentialFaults: 0,
        severityBreakdown: { critical: 1, high: 0, medium: 0, low: 0, informational: 0 },
        qualityScore: 60,
        qualityGrade: 'D',
        qualityScoreRationale: '-15 pts: 1 failed test; -25 pts: 1 critical defect',
        testCoveragePercent: 75,
      },
      environment: {
        isAvailable: false,
        runtimeType: 'none',
        securityProfile: 'Strict host-isolation sandbox profile',
        reason: 'Docker daemon unavailable',
        remediation: 'Install Docker Desktop to execute dynamic tests.',
        resourceLimits: {
          cpuLimit: '1.0',
          memoryLimit: '1024m',
          timeoutSeconds: 120,
          networkRestricted: true,
          nonRoot: true,
        },
      },
      testPlan: [
        {
          id: 'TC-001',
          name: 'Manifest Sanity',
          category: 'configuration_sanity',
          target: 'package.json',
          description: 'Check manifests',
          expectedOutcome: 'Valid',
          status: 'passed',
          evidenceIds: [],
        },
        {
          id: 'TC-002',
          name: 'Project Unit Tests',
          category: 'project_unit_test',
          target: 'npm test',
          description: 'Run project tests',
          expectedOutcome: 'Pass',
          status: 'failed',
          errorDetails: '1 test failed in auth.test.ts',
          evidenceIds: [],
        },
      ],
      findings: [
        {
          id: 'FAULT-001',
          projectId: 'test-project-12345',
          title: 'Syntax Error in Configuration',
          description: 'Trailing comma causes JSON parse crash',
          category: 'build',
          severity: 'Critical',
          confidence: 'high',
          verificationStatus: 'confirmed',
          filePath: 'config.json',
          lineRange: { start: 12, end: 12 },
          stepsToReproduce: ['Run build', 'Observe parser crash'],
          expectedBehavior: 'Clean JSON parse',
          actualBehavior: 'SyntaxError: Unexpected token',
          evidence: [
            {
              id: 'ev-1',
              type: 'code_snippet',
              title: 'Malformed trailing comma',
              data: '{\n  "feature": "auth",\n}',
              lineNumber: 12,
              timestamp: new Date().toISOString(),
            },
          ],
          suggestedFix: 'Remove the trailing comma on line 12.',
          ruleId: 'STATIC_JSON_SYNTAX_ERROR',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const result = await generateFaultDocxReport(mockProject, mockAnalysis, mockTestRun);

    assert.ok(result.filePath, 'Expected result.filePath');
    assert.ok(fs.existsSync(result.filePath), 'DOCX file must exist on disk');
    assert.ok(result.fileSize > 1000, `Expected file size > 1000 bytes, got ${result.fileSize}`);
    assert.ok(result.fileName.includes('Fault_Report.docx'));

    // Clean up
    if (fs.existsSync(result.filePath)) {
      fs.unlinkSync(result.filePath);
    }
  });
});
