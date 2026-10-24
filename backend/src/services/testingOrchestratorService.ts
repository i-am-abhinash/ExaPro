import { Project } from '../models/Project';
import { TestRun, ITestRunDocument } from '../models/testingModel';
import { AnalysisResult } from './analyzerService';
import { performStaticDefectAnalysis } from './staticDefectAnalyzer';
import { generateProjectTestPlan } from './testPlanner';
import { SandboxRunner } from './sandbox/sandboxRunner';
import { calculateQualityScoreAndSummary } from './qualityScoreService';
import { generateFaultDocxReport } from './faultReportDocxService';

export async function runAutomatedTestingPipeline(
  projectId: string,
  extractedDir: string,
  analysis: AnalysisResult,
  allFiles: string[]
): Promise<ITestRunDocument> {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  // 1. Planning Tests
  await Project.findByIdAndUpdate(projectId, {
    $set: {
      status: 'planning_tests',
      progress: 60,
      statusMessage: 'Planning automated test cases and analyzing static code defects...',
    },
  });

  // 1A. Static Defect Inspection
  const staticResult = performStaticDefectAnalysis(extractedDir, allFiles, analysis.inspectedFiles);

  // 1B. Formulate Test Cases
  const planResult = generateProjectTestPlan(analysis);

  // 2. Preparing Environment & Secure Sandbox
  await Project.findByIdAndUpdate(projectId, {
    $set: {
      status: 'preparing_environment',
      progress: 70,
      statusMessage: 'Evaluating host sandbox security profile and environment capabilities...',
    },
  });

  // 3. Executing Tests in Sandbox
  await Project.findByIdAndUpdate(projectId, {
    $set: {
      status: 'running_tests',
      progress: 80,
      statusMessage: 'Executing test suite, route checks, and runtime fault probes...',
    },
  });

  const sandboxResult = await SandboxRunner.executeTests(
    projectId,
    extractedDir,
    analysis,
    planResult.testCases,
    staticResult.faultFindings
  );

  // Combine static defect findings with runtime execution findings
  const allFindings = [...staticResult.faultFindings, ...sandboxResult.executionFindings];

  // Assign projectId to all findings
  allFindings.forEach((f) => {
    f.projectId = projectId;
  });

  // 4. Calculate Quality Score & Summary
  const summary = calculateQualityScoreAndSummary(sandboxResult.executedTestCases, allFindings);

  // 5. Create or Update TestRun in MongoDB
  let testRun = await TestRun.findOne({ projectId });
  if (!testRun) {
    testRun = new TestRun({
      projectId,
      stage: 'generating_reports',
      progress: 90,
      statusMessage: 'Compiling software quality and fault evaluation report...',
      environment: sandboxResult.environment,
      testPlan: sandboxResult.executedTestCases,
      findings: allFindings,
      summary,
      startedAt: new Date(),
    });
  } else {
    testRun.stage = 'generating_reports';
    testRun.progress = 90;
    testRun.statusMessage = 'Compiling software quality and fault evaluation report...';
    testRun.environment = sandboxResult.environment;
    testRun.testPlan = sandboxResult.executedTestCases;
    testRun.findings = allFindings;
    testRun.summary = summary;
  }
  await testRun.save();

  // 6. Generate Report B: Software Quality & Fault Report (DOCX)
  const faultDocx = await generateFaultDocxReport(project, analysis, testRun);

  testRun.faultReportDocxPath = faultDocx.filePath;
  testRun.faultReportDocxName = faultDocx.fileName;
  testRun.faultReportDocxSize = faultDocx.fileSize;
  testRun.stage = summary.failed > 0 || summary.confirmedFaults > 0 ? 'completed_with_warnings' : 'completed';
  testRun.progress = 100;
  testRun.statusMessage = 'Quality and fault analysis report generated successfully.';
  testRun.completedAt = new Date();
  await testRun.save();

  // 7. Update Project Document with TestRun Reference & Summary
  await Project.findByIdAndUpdate(projectId, {
    $set: {
      faultReportFilePath: faultDocx.filePath,
      faultReportFileName: faultDocx.fileName,
      faultReportFileSize: faultDocx.fileSize,
      testRunId: testRun._id,
      faultSummary: {
        totalTests: summary.totalTests,
        passed: summary.passed,
        failed: summary.failed,
        blocked: summary.blocked,
        notTested: summary.notTested,
        confirmedFaults: summary.confirmedFaults,
        potentialFaults: summary.potentialFaults,
        qualityScore: summary.qualityScore,
        qualityGrade: summary.qualityGrade,
      },
    },
  });

  return testRun;
}
