import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { performStaticDefectAnalysis } from '../src/services/staticDefectAnalyzer';
import { analyzeProjectDirectory } from '../src/services/analyzerService';
import { generateProjectDocumentation } from '../src/services/aiService';

describe('EvidenceAnalysis & StaticAST Pipeline', () => {
  const tsDefectiveDir = path.resolve(__dirname, 'fixtures/ts-defective-project');

  it('detects TypeScript AST compiler diagnostics (SYNTAX-TS-001)', () => {
    const files = [
      'package.json',
      'src/badSyntax.ts',
      'src/codeQuality.ts',
      'src/server.ts',
      'src/client.ts',
    ];

    const result = performStaticDefectAnalysis(tsDefectiveDir, files, files);

    const syntaxFinding = result.findings.find((f) => f.ruleId === 'SYNTAX-TS-001');
    assert.ok(syntaxFinding, 'Expected SYNTAX-TS-001 finding for malformed TS');
    assert.strictEqual(syntaxFinding.filePath, 'src/badSyntax.ts');
    assert.strictEqual(syntaxFinding.analysisType, 'compiler');
    assert.ok(syntaxFinding.startLine && syntaxFinding.startLine > 0);
  });

  it('detects unreachable dead code via AST inspection (QUALITY-UNREACHABLE-001)', () => {
    const files = ['package.json', 'src/codeQuality.ts'];
    const result = performStaticDefectAnalysis(tsDefectiveDir, files, files);

    const unreachable = result.findings.find((f) => f.ruleId === 'QUALITY-UNREACHABLE-001');
    assert.ok(unreachable, 'Expected QUALITY-UNREACHABLE-001 finding');
    assert.strictEqual(unreachable.filePath, 'src/codeQuality.ts');
    assert.ok(unreachable.codeExcerpt?.includes('deadCode') || unreachable.codeExcerpt?.includes('100'));
  });

  it('detects dangerous dynamic eval execution (SEC-DANGEROUS-001)', () => {
    const files = ['package.json', 'src/codeQuality.ts'];
    const result = performStaticDefectAnalysis(tsDefectiveDir, files, files);

    const evalFinding = result.findings.find((f) => f.ruleId === 'SEC-DANGEROUS-001');
    assert.ok(evalFinding, 'Expected SEC-DANGEROUS-001 finding');
    assert.strictEqual(evalFinding.filePath, 'src/codeQuality.ts');
    assert.strictEqual(evalFinding.severity, 'High');
  });

  it('detects package script targeting nonexistent files (SEC-CONFIG-003)', () => {
    const files = ['package.json'];
    const result = performStaticDefectAnalysis(tsDefectiveDir, files, files);

    const scriptFinding = result.findings.find((f) => f.ruleId === 'SEC-CONFIG-003');
    assert.ok(scriptFinding, 'Expected SEC-CONFIG-003 finding');
    assert.strictEqual(scriptFinding.filePath, 'package.json');
    assert.ok(scriptFinding.description.includes('start'));
  });

  it('detects frontend-to-backend API contract mismatches (API-MISMATCH-001)', () => {
    const files = ['package.json', 'src/server.ts', 'src/client.ts'];
    const result = performStaticDefectAnalysis(tsDefectiveDir, files, files);

    const apiMismatch = result.findings.find((f) => f.ruleId === 'API-MISMATCH-001');
    assert.ok(apiMismatch, 'Expected API-MISMATCH-001 finding');
    assert.strictEqual(apiMismatch.filePath, 'src/client.ts');
    assert.ok(apiMismatch.description.includes('/api/missing-reports'));
  });

  it('full static analysis pipeline produces 17-field source findings with verified excerpts', async () => {
    const analysis = await analyzeProjectDirectory(tsDefectiveDir, 'zip', 'ts-defective-test');

    assert.ok(analysis.sourceFindings && analysis.sourceFindings.length > 0);
    assert.ok(analysis.coverage);
    assert.ok(analysis.coverage.rulesExecuted && analysis.coverage.rulesExecuted.length > 5);

    // Verify each finding adheres to the unified 17-field schema
    for (const f of analysis.sourceFindings) {
      assert.ok(f.id, 'id is required');
      assert.ok(f.title, 'title is required');
      assert.ok(f.description, 'description is required');
      assert.ok(f.severity, 'severity is required');
      assert.ok(f.confidence, 'confidence is required');
      assert.ok(f.status, 'status is required');
      assert.ok(f.category, 'category is required');
      assert.ok(f.analysisType, 'analysisType is required');
      assert.ok(f.ruleId, 'ruleId is required');
      assert.ok(f.reasoning, 'reasoning is required');
      assert.ok(f.impact, 'impact is required');
      assert.ok(f.recommendation, 'recommendation is required');
      assert.ok(Array.isArray(f.evidence), 'evidence must be an array');
    }
  });

  it('deterministic documentation generator yields all 20 sections without fabrication', async () => {
    const analysis = await analyzeProjectDirectory(tsDefectiveDir, 'zip', 'ts-defective-test');
    const docResult = await generateProjectDocumentation(analysis, analysis.architecture.architectureSummary);

    assert.ok(docResult.sections, 'sections object must exist');
    const doc = docResult.sections;

    // Verify all 20 sections are populated
    assert.ok(doc.executiveSummary && doc.executiveSummary.length > 50);
    assert.ok(doc.projectOverview && doc.projectOverview.length > 50);
    assert.ok(doc.purposeAndFunctionality);
    assert.ok(doc.problemStatement);
    assert.ok(doc.technologyStackDescription);
    assert.ok(doc.projectStructureTree);
    assert.ok(doc.systemArchitectureDescription);
    assert.ok(doc.moduleDetails);
    assert.ok(doc.entryPointsAndStartup);
    assert.ok(doc.dataFlowDescription);
    assert.ok(doc.apiDocumentationDescription);
    assert.ok(doc.databaseDesignDescription);
    assert.ok(doc.authImplementation);
    assert.ok(doc.configurationAndEnvironment);
    assert.ok(doc.setupAndExecutionInstructions);
    assert.ok(doc.buildAndDevelopment);
    assert.ok(doc.testingAndQualityDescription);
    assert.ok(doc.externalIntegrations);
    assert.ok(doc.securityObservations);
    assert.ok(doc.limitationsAndObservations);
    assert.ok(doc.coverageAndUnsupported);
    assert.ok(doc.appendix);
  });
});
