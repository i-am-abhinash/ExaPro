import {
  ITestCase,
  IFaultFinding,
  ITestRunSummary,
} from '../models/testingModel';

export function calculateQualityScoreAndSummary(
  testCases: ITestCase[],
  findings: IFaultFinding[]
): ITestRunSummary {
  const totalTests = testCases.length;
  const passed = testCases.filter((t) => t.status === 'passed').length;
  const failed = testCases.filter((t) => t.status === 'failed').length;
  const blocked = testCases.filter((t) => t.status === 'blocked').length;
  const notTested = testCases.filter((t) => t.status === 'not_tested' || t.status === 'pending').length;

  const totalFindings = findings.length;
  const confirmedFaults = findings.filter((f) => f.verificationStatus === 'confirmed').length;
  const potentialFaults = findings.filter((f) => f.verificationStatus === 'potential').length;

  const critical = findings.filter((f) => f.severity === 'Critical').length;
  const high = findings.filter((f) => f.severity === 'High').length;
  const medium = findings.filter((f) => f.severity === 'Medium').length;
  const low = findings.filter((f) => f.severity === 'Low').length;
  const informational = findings.filter((f) => f.severity === 'Informational').length;

  // Transparent, documented scoring formula
  let score = 100;
  const deductionNotes: string[] = [];

  // Deductions for test execution failures
  if (failed > 0) {
    const testPenalty = failed * 15;
    score -= testPenalty;
    deductionNotes.push(`-${testPenalty} pts: ${failed} failed test case(s)`);
  }

  // Deductions for confirmed runtime faults
  const confirmedCritical = findings.filter((f) => f.verificationStatus === 'confirmed' && f.severity === 'Critical').length;
  const confirmedHigh = findings.filter((f) => f.verificationStatus === 'confirmed' && f.severity === 'High').length;
  const confirmedMedium = findings.filter((f) => f.verificationStatus === 'confirmed' && f.severity === 'Medium').length;
  const confirmedLow = findings.filter((f) => f.verificationStatus === 'confirmed' && f.severity === 'Low').length;

  if (confirmedCritical > 0) {
    const p = confirmedCritical * 25;
    score -= p;
    deductionNotes.push(`-${p} pts: ${confirmedCritical} confirmed Critical runtime defect(s)`);
  }
  if (confirmedHigh > 0) {
    const p = confirmedHigh * 15;
    score -= p;
    deductionNotes.push(`-${p} pts: ${confirmedHigh} confirmed High runtime defect(s)`);
  }
  if (confirmedMedium > 0) {
    const p = confirmedMedium * 8;
    score -= p;
    deductionNotes.push(`-${p} pts: ${confirmedMedium} confirmed Medium runtime defect(s)`);
  }
  if (confirmedLow > 0) {
    const p = confirmedLow * 3;
    score -= p;
    deductionNotes.push(`-${p} pts: ${confirmedLow} confirmed Low runtime defect(s)`);
  }

  // Deductions for potential static defects (lighter weight since not runtime confirmed)
  const potentialCritical = findings.filter((f) => f.verificationStatus === 'potential' && f.severity === 'Critical').length;
  const potentialHigh = findings.filter((f) => f.verificationStatus === 'potential' && f.severity === 'High').length;
  const potentialMedium = findings.filter((f) => f.verificationStatus === 'potential' && f.severity === 'Medium').length;
  const potentialLow = findings.filter((f) => f.verificationStatus === 'potential' && f.severity === 'Low').length;

  if (potentialCritical > 0) {
    const p = potentialCritical * 12;
    score -= p;
    deductionNotes.push(`-${p} pts: ${potentialCritical} potential Critical static issue(s)`);
  }
  if (potentialHigh > 0) {
    const p = potentialHigh * 7;
    score -= p;
    deductionNotes.push(`-${p} pts: ${potentialHigh} potential High static defect(s)`);
  }
  if (potentialMedium > 0) {
    const p = potentialMedium * 3;
    score -= p;
    deductionNotes.push(`-${p} pts: ${potentialMedium} potential Medium static issue(s)`);
  }
  if (potentialLow > 0) {
    const p = potentialLow * 1;
    score -= p;
    deductionNotes.push(`-${p} pts: ${potentialLow} potential Low static notice(s)`);
  }

  // Deductions for blocked execution coverage
  if (blocked > 0) {
    const p = Math.min(blocked * 3, 15); // capped at 15
    score -= p;
    deductionNotes.push(`-${p} pts: ${blocked} test(s) blocked due to environment/dependency prerequisites`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  if (score >= 90) qualityGrade = 'A';
  else if (score >= 80) qualityGrade = 'B';
  else if (score >= 70) qualityGrade = 'C';
  else if (score >= 60) qualityGrade = 'D';
  else qualityGrade = 'F';

  const testCoveragePercent = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

  let rationale = `Calculated from a 100-point baseline. Total deductions: ${deductionNotes.join(', ') || 'None'}.`;
  if (blocked > 0) {
    rationale += ` Note: ${blocked} test(s) could not execute at runtime and were marked as blocked. Test execution coverage is ${testCoveragePercent}%.`;
  }

  return {
    totalTests,
    passed,
    failed,
    blocked,
    notTested,
    totalFindings,
    confirmedFaults,
    potentialFaults,
    severityBreakdown: {
      critical,
      high,
      medium,
      low,
      informational,
    },
    qualityScore: score,
    qualityGrade,
    qualityScoreRationale: rationale,
    testCoveragePercent,
  };
}
