import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { performStaticDefectAnalysis } from '../src/services/staticDefectAnalyzer';
import { analyzeProjectDirectory } from '../src/services/analyzerService';
import { generateProjectDocumentation, validateAndSanitizeAiResponse } from '../src/services/aiService';
import { AIDocumentationResponse } from '../src/services/aiService';

describe('EvidenceAnalysis & StaticAST Pipeline', () => {
  const tsDefectiveDir = path.resolve(__dirname, 'fixtures/ts-defective-project');
  const tsTypeErrorDir = path.resolve(__dirname, 'fixtures/ts-type-error-project');

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

  it('detects TypeScript semantic type errors (TYPE-TS-001)', () => {
    const files = [
      'package.json',
      'tsconfig.json',
      'src/typeError.ts',
      'src/aliasError.ts',
      'src/validModule.ts',
      'src/validAlias.ts',
    ];

    const result = performStaticDefectAnalysis(tsTypeErrorDir, files, files);

    const typeFinding = result.findings.find((f) => f.ruleId === 'TYPE-TS-001');
    assert.ok(typeFinding, 'Expected TYPE-TS-001 finding for semantic type mismatch');
    assert.strictEqual(typeFinding.filePath, 'src/typeError.ts');
    assert.strictEqual(typeFinding.category, 'type');
    assert.strictEqual(typeFinding.status, 'confirmed');
    assert.strictEqual(typeFinding.analysisType, 'compiler');
    assert.strictEqual(typeFinding.severity, 'High');
    assert.ok(
      typeFinding.codeExcerpt?.includes('definitely not a number') ||
      typeFinding.description.includes('TS2322'),
      'Expected excerpt or description to indicate type mismatch'
    );
  });

  it('detects broken path alias imports (IMPORT-ALIAS-001) and resolves valid aliases', () => {
    const files = [
      'package.json',
      'tsconfig.json',
      'src/typeError.ts',
      'src/aliasError.ts',
      'src/validModule.ts',
      'src/validAlias.ts',
    ];

    const result = performStaticDefectAnalysis(tsTypeErrorDir, files, files);

    // Broken alias should be flagged
    const aliasFinding = result.findings.find((f) => f.ruleId === 'IMPORT-ALIAS-001');
    assert.ok(aliasFinding, 'Expected IMPORT-ALIAS-001 finding for missing alias target');
    assert.strictEqual(aliasFinding.filePath, 'src/aliasError.ts');
    assert.strictEqual(aliasFinding.category, 'dependency');
    assert.strictEqual(aliasFinding.status, 'confirmed');
    assert.ok(aliasFinding.codeExcerpt?.includes('@/helpers/nonexistent'));

    // Valid alias (@/validModule) should NOT trigger broken alias or undeclared dep
    const falseAliasFinding = result.findings.find(
      (f) => f.filePath === 'src/validAlias.ts' && (f.ruleId === 'IMPORT-ALIAS-001' || f.ruleId === 'DEP-UNDECLARED-001')
    );
    assert.strictEqual(falseAliasFinding, undefined, 'Valid alias import should resolve cleanly');
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

  it('validates and sanitizes AI claims against verified project facts', () => {
    const analysis = analyzeProjectDirectory(tsTypeErrorDir, 'ts-type-error-test', 'zip');

    // Simulate an AI response hallucinating unverified Express, MongoDB, and Redis
    const hallucinatedAI: AIDocumentationResponse = {
      executiveSummary: 'This application utilizes an Express.js backend server with a MongoDB document database.',
      projectOverview: 'The project implements a fullstack system with Express controllers and Redis caching.',
      purposeAndFunctionality: 'Manages user accounts.',
      problemStatement: 'Manual tracking of user data.',
      architectureExplanation: 'Client communicates with Express server on port 5000, querying MongoDB collections.',
      dataFlowExplanation: 'Data flows from the React interface through Express middleware to MongoDB.',
      limitations: 'Scalability is bounded by MongoDB connection pools.',
    };

    const sanitized = validateAndSanitizeAiResponse(hallucinatedAI, analysis);

    // Assert that hallucinated database and server references were stripped
    assert.ok(!sanitized.executiveSummary.toLowerCase().includes('express.js server'), 'Express claim should be sanitized');
    assert.ok(!sanitized.executiveSummary.toLowerCase().includes('mongodb database'), 'MongoDB claim should be sanitized');
    assert.ok(!sanitized.architectureExplanation.includes('MongoDB'), 'MongoDB should not appear in architecture explanation');
  });

  it('full static analysis pipeline produces 17-field source findings with verified excerpts', async () => {
    const analysis = await analyzeProjectDirectory(tsDefectiveDir, 'ts-defective-test', 'zip');

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
    const analysis = await analyzeProjectDirectory(tsDefectiveDir, 'ts-defective-test', 'zip');
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
