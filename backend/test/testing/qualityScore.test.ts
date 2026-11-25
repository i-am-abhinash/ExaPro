import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQualityScoreAndSummary } from '../../src/services/qualityScoreService';
import type { ITestCase } from '../../src/models/testingModel';

const check = (status: ITestCase['status']): ITestCase => ({
  id: 'TC-1', name: 'Build', category: 'build', target: 'npm run build',
  description: 'Build', expectedOutcome: 'Exit zero', status, evidenceIds: [],
});

test('completed checks include passes and failures only', () => {
  const summary = calculateQualityScoreAndSummary([
    check('passed'), check('failed'), check('blocked'), check('not_tested'),
  ], []);
  assert.equal(summary.testCoveragePercent, 50);
});

test('incomplete and empty assessments cannot receive a high grade', () => {
  assert.ok(calculateQualityScoreAndSummary([check('passed'), check('not_tested')], []).qualityScore <= 79);
  assert.ok(calculateQualityScoreAndSummary([], []).qualityScore <= 79);
});
