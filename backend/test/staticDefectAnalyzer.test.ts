import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { performStaticDefectAnalysis } from '../src/services/staticDefectAnalyzer';

describe('StaticDefectAnalyzer', () => {
  const cleanDir = path.resolve(__dirname, 'fixtures/clean-project');
  const defectiveDir = path.resolve(__dirname, 'fixtures/defective-project');

  it('reports zero critical/high defects for clean compliant project', () => {
    const allFiles = ['package.json', 'src/index.js', 'src/utils.js'];
    const result = performStaticDefectAnalysis(cleanDir, allFiles, allFiles);

    assert.strictEqual(result.brokenImportsCount, 0);
    assert.strictEqual(result.syntaxErrorsCount, 0);
    assert.strictEqual(result.missingDependenciesCount, 0);
    assert.ok(result.findings.filter((f) => f.severity === 'Critical').length === 0);
  });

  it('detects broken relative imports with exact line numbers and ruleId', () => {
    const allFiles = ['package.json', 'src/entry.js', 'config/invalid.json'];
    const result = performStaticDefectAnalysis(defectiveDir, allFiles, allFiles);

    const brokenImport = result.findings.find((f) => f.ruleId === 'IMPORT-RELATIVE-001');
    assert.ok(brokenImport, 'Expected IMPORT-RELATIVE-001 finding');
    assert.strictEqual(brokenImport.filePath, 'src/entry.js');
    assert.strictEqual(brokenImport.lineRange?.start, 2);
    assert.ok(brokenImport.description.includes('./services/missingService'));
    assert.strictEqual(brokenImport.confidence, 'high');
  });

  it('detects undeclared npm dependencies with exact line numbers', () => {
    const allFiles = ['package.json', 'src/entry.js'];
    const result = performStaticDefectAnalysis(defectiveDir, allFiles, allFiles);

    const missingDep = result.findings.find((f) => f.ruleId === 'DEP-UNDECLARED-001');
    assert.ok(missingDep, 'Expected DEP-UNDECLARED-001 finding');
    assert.strictEqual(missingDep.filePath, 'src/entry.js');
    assert.strictEqual(missingDep.lineRange?.start, 3);
    assert.ok(missingDep.description.includes('lodash'));
  });

  it('detects malformed JSON syntax errors with line/column coordinates', () => {
    const allFiles = ['package.json', 'config/invalid.json'];
    const result = performStaticDefectAnalysis(defectiveDir, allFiles, allFiles);

    const jsonError = result.findings.find((f) => f.ruleId === 'SYNTAX-JSON-001');
    assert.ok(jsonError, 'Expected SYNTAX-JSON-001 finding');
    assert.strictEqual(jsonError.filePath, 'config/invalid.json');
    assert.ok(jsonError.lineRange?.start && jsonError.lineRange.start > 0);
  });

  it('detects silent error swallowing (empty catch block)', () => {
    const allFiles = ['src/entry.js'];
    const result = performStaticDefectAnalysis(defectiveDir, allFiles, allFiles);

    const emptyCatch = result.findings.find((f) => f.ruleId === 'QUALITY-SWALLOW-001');
    assert.ok(emptyCatch, 'Expected QUALITY-SWALLOW-001 finding');
    assert.strictEqual(emptyCatch.filePath, 'src/entry.js');
    assert.strictEqual(emptyCatch.lineRange?.start, 10);
    assert.strictEqual(emptyCatch.severity, 'Low');
  });
});
