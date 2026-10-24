import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import {
  validateEvidenceFinding,
  validateAndDeduplicateFindings,
  redactSensitiveData,
  extractVerifiedSourceExcerpt,
} from '../src/services/evidenceValidator';
import { IEvidenceFinding } from '../src/models/analysisModel';

describe('EvidenceValidator', () => {
  const fixtureDir = path.resolve(__dirname, 'fixtures/clean-project');

  it('validates a real file on disk and extracts verified code excerpt', () => {
    const rawFinding: IEvidenceFinding = {
      id: 'FIND-001',
      title: 'Sample finding',
      description: 'Verifying evidence extraction',
      severity: 'Low',
      confidence: 'high',
      status: 'confirmed',
      category: 'maintainability',
      analysisType: 'compiler',
      filePath: 'src/index.js',
      startLine: 1,
      endLine: 2,
      ruleId: 'TEST-001',
      evidence: [],
      reasoning: 'Testing valid source file',
      impact: 'Minimal',
      recommendation: 'Check source code',
    };

    const result = validateEvidenceFinding(rawFinding, fixtureDir);
    assert.strictEqual(result.isValid, true, 'Finding should be valid');
    const validated = result.sanitizedFinding;
    assert.strictEqual(validated.filePath, 'src/index.js');
    assert.strictEqual(validated.startLine, 1);
    assert.ok(validated.codeExcerpt && validated.codeExcerpt.length > 0, 'Code excerpt should be extracted from disk');
  });

  it('rejects nonexistent files outside disk directory', () => {
    const rawFinding: IEvidenceFinding = {
      id: 'FIND-002',
      title: 'Missing file finding',
      description: 'Testing nonexistent file',
      severity: 'Medium',
      confidence: 'high',
      status: 'confirmed',
      category: 'maintainability',
      analysisType: 'deterministic',
      filePath: 'src/phantom-file.ts',
      startLine: 5,
      ruleId: 'TEST-002',
      evidence: [],
      reasoning: 'Testing nonexistent',
      impact: 'Unknown',
      recommendation: 'Verify file exists',
    };

    const result = validateEvidenceFinding(rawFinding, fixtureDir);
    assert.strictEqual(result.isValid, false, 'Nonexistent file must be rejected');
    assert.ok(result.error?.includes('does not exist'), 'Expected file existence error message');
  });

  it('blocks path traversal attempts outside root directory', () => {
    const rawFinding: IEvidenceFinding = {
      id: 'FIND-003',
      title: 'Path traversal attempt',
      description: 'Testing traversal block',
      severity: 'High',
      confidence: 'high',
      status: 'confirmed',
      category: 'security',
      analysisType: 'deterministic',
      filePath: '../../../../windows/system32/cmd.exe',
      startLine: 1,
      ruleId: 'TEST-003',
      evidence: [],
      reasoning: 'Security check',
      impact: 'Potential escape',
      recommendation: 'Block paths',
    };

    const result = validateEvidenceFinding(rawFinding, fixtureDir);
    assert.strictEqual(result.isValid, false, 'Path traversal must be rejected');
    assert.ok(result.error?.includes('traversal') || result.error?.includes('escapes project root'));
  });

  it('rejects line numbers that exceed actual file length', () => {
    const rawFinding: IEvidenceFinding = {
      id: 'FIND-004',
      title: 'Out of range line',
      description: 'Testing out of bounds',
      severity: 'Low',
      confidence: 'high',
      status: 'confirmed',
      category: 'maintainability',
      analysisType: 'compiler',
      filePath: 'src/utils.js',
      startLine: 99999,
      endLine: 100000,
      ruleId: 'TEST-004',
      evidence: [],
      reasoning: 'Testing line bounds',
      impact: 'Invalid coordinate',
      recommendation: 'Check file lines',
    };

    const result = validateEvidenceFinding(rawFinding, fixtureDir);
    assert.strictEqual(result.isValid, false, 'Exceeded line bounds must be rejected');
    assert.ok(result.error?.includes('exceeds total file lines'));
  });

  it('redacts sensitive API tokens and credentials from text and excerpts', () => {
    const rawText = 'const apiKey = "dummy_mock_secret_token_1234567890abcdef1234567890abcdef";';
    const redacted = redactSensitiveData(rawText);
    assert.ok(!redacted.includes('dummy_mock_secret_token_1234567890abcdef1234567890abcdef'), 'Secret must not be in output');
    assert.ok(redacted.includes('[REDACTED_SECRET]'), 'Expected redacted placeholder');

    // Also verify via validateEvidenceFinding
    const rawFinding: IEvidenceFinding = {
      id: 'FIND-005',
      title: 'Secret finding',
      description: 'Secret token: "dummy_mock_secret_token_1234567890abcdef1234567890abcdef"',
      severity: 'Critical',
      confidence: 'high',
      status: 'confirmed',
      category: 'security',
      analysisType: 'heuristic',
      filePath: 'src/index.js',
      startLine: 1,
      ruleId: 'TEST-005',
      evidence: [],
      reasoning: 'password = "supersecretpassword123"',
      impact: 'High',
      recommendation: 'Rotate secret',
    };

    const result = validateEvidenceFinding(rawFinding, fixtureDir);
    assert.strictEqual(result.isValid, true);
    assert.ok(!result.sanitizedFinding.description.includes('dummy_mock_secret_token_1234567890abcdef1234567890abcdef'));
    assert.ok(!result.sanitizedFinding.reasoning.includes('supersecretpassword123'));
  });

  it('deduplicates findings with identical ruleId, filePath, and startLine while aggregating evidence', () => {
    const findings: IEvidenceFinding[] = [
      {
        id: 'DEDUP-001',
        title: 'Duplicate 1',
        description: 'First occurrence',
        severity: 'Medium',
        confidence: 'high',
        status: 'confirmed',
        category: 'maintainability',
        analysisType: 'compiler',
        filePath: 'src/index.js',
        startLine: 1,
        ruleId: 'DUP-RULE-001',
        evidence: [
          {
            id: 'ev-1',
            type: 'code_snippet',
            title: 'Evidence 1',
            data: 'line 1 code',
            timestamp: new Date().toISOString(),
          },
        ],
        reasoning: 'R1',
        impact: 'I1',
        recommendation: 'Fix 1',
      },
      {
        id: 'DEDUP-002',
        title: 'Duplicate 2',
        description: 'Second occurrence with higher severity',
        severity: 'High',
        confidence: 'high',
        status: 'confirmed',
        category: 'maintainability',
        analysisType: 'compiler',
        filePath: 'src/index.js',
        startLine: 1,
        ruleId: 'DUP-RULE-001',
        evidence: [
          {
            id: 'ev-2',
            type: 'code_snippet',
            title: 'Evidence 2',
            data: 'line 1 more context',
            timestamp: new Date().toISOString(),
          },
        ],
        reasoning: 'R2',
        impact: 'I2',
        recommendation: 'Fix 2',
      },
    ];

    const result = validateAndDeduplicateFindings(findings, fixtureDir);
    assert.strictEqual(result.validFindings.length, 1, 'Duplicate findings should be merged into 1');
    assert.strictEqual(result.validFindings[0].severity, 'High', 'Higher severity should be preserved');
    assert.strictEqual(result.validFindings[0].evidence.length, 2, 'Evidence items should be aggregated');
  });
});
