import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateQualityScoreAndSummary } from '../src/services/qualityScoreService';
import { ITestCase, IFaultFinding } from '../src/models/testingModel';

describe('QualityScoreService', () => {
  it('awards 100 points and Grade A when all tests pass with no findings', () => {
    const tests: ITestCase[] = [
      {
        id: 'tc-1',
        name: 'Startup Test',
        category: 'startup',
        target: 'server.js',
        description: 'Verify server boots',
        expectedOutcome: 'Process exits with 0 or runs',
        status: 'passed',
        evidenceIds: [],
      },
      {
        id: 'tc-2',
        name: 'Health Check',
        category: 'http_readiness',
        target: '/health',
        description: 'Check health endpoint',
        expectedOutcome: 'HTTP 200',
        status: 'passed',
        evidenceIds: [],
      },
    ];

    const summary = calculateQualityScoreAndSummary(tests, []);

    assert.strictEqual(summary.qualityScore, 100);
    assert.strictEqual(summary.qualityGrade, 'A');
    assert.strictEqual(summary.passed, 2);
    assert.strictEqual(summary.failed, 0);
    assert.strictEqual(summary.totalFindings, 0);
  });

  it('deducts points for critical defects and test failures transparently', () => {
    const tests: ITestCase[] = [
      {
        id: 'tc-1',
        name: 'Unit Test',
        category: 'project_unit_test',
        target: 'test',
        description: 'Run project tests',
        expectedOutcome: 'Tests pass',
        status: 'failed',
        evidenceIds: [],
      },
    ];

    const findings: IFaultFinding[] = [
      {
        id: 'fault-1',
        projectId: 'p1',
        title: 'Fatal Syntax Error',
        description: 'Unexpected token',
        category: 'build',
        severity: 'Critical',
        confidence: 'high',
        verificationStatus: 'confirmed',
        stepsToReproduce: [],
        expectedBehavior: 'Clean build',
        actualBehavior: 'Crash',
        evidence: [],
        suggestedFix: 'Fix JSON',
        timestamp: new Date().toISOString(),
      },
    ];

    const summary = calculateQualityScoreAndSummary(tests, findings);

    // 100 - 15 (1 failed test) - 25 (1 confirmed critical) = 60
    assert.strictEqual(summary.qualityScore, 60);
    assert.strictEqual(summary.qualityGrade, 'D');
    assert.ok(summary.qualityScoreRationale.includes('-15 pts'));
    assert.ok(summary.qualityScoreRationale.includes('-25 pts'));
  });

  it('never reduces quality score below 0', () => {
    const tests: ITestCase[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tc-${i}`,
      name: `Test ${i}`,
      category: 'startup' as const,
      target: 'target',
      description: 'Test',
      expectedOutcome: 'Pass',
      status: 'failed' as const,
      evidenceIds: [],
    }));

    const findings: IFaultFinding[] = Array.from({ length: 10 }, (_, i) => ({
      id: `fault-${i}`,
      projectId: 'p1',
      title: `Critical Fault ${i}`,
      description: 'Crash',
      category: 'startup' as const,
      severity: 'Critical' as const,
      confidence: 'high' as const,
      verificationStatus: 'confirmed' as const,
      stepsToReproduce: [],
      expectedBehavior: 'Ok',
      actualBehavior: 'Fail',
      evidence: [],
      suggestedFix: 'Fix',
      timestamp: new Date().toISOString(),
    }));

    const summary = calculateQualityScoreAndSummary(tests, findings);
    assert.strictEqual(summary.qualityScore, 0);
    assert.strictEqual(summary.qualityGrade, 'F');
  });
});
