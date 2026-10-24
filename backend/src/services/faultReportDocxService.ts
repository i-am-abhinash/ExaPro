import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { REPORTS_DIR } from '../config/env';
import { IProjectDocument } from '../models/Project';
import { ITestRunDocument } from '../models/testingModel';
import { AnalysisResult } from './analyzerService';

export interface FaultReportDocxResult {
  filePath: string;
  fileName: string;
  fileSize: number;
}

export async function generateFaultDocxReport(
  project: IProjectDocument,
  analysis: AnalysisResult,
  testRun: ITestRunDocument
): Promise<FaultReportDocxResult> {
  const safeProjectName = project.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeProjectName}_ExaPro_Fault_Report.docx`;
  const filePath = path.join(REPORTS_DIR, `${project._id}_fault_report.docx`);

  // Document Palette
  const primaryNavy = '0F172A';
  const secondaryNavy = '1E3A8A';
  const criticalRed = 'DC2626';
  const warningAmber = 'D97706';
  const successGreen = '059669';
  const slateBody = '334155';
  const subtleGray = '64748B';
  const tableHeaderBg = '1E293B';
  const lightRowBg = 'F8FAFC';
  const borderColor = 'CBD5E1';

  const defaultBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
  };

  const children: any[] = [];

  // Helper paragraph creators
  function createHeading1(text: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 180 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 28,
          color: primaryNavy,
          font: 'Times New Roman',
        }),
      ],
    });
  }

  function createHeading2(text: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 24,
          color: secondaryNavy,
          font: 'Times New Roman',
        }),
      ],
    });
  }

  function createBodyParagraph(text: string): Paragraph {
    return new Paragraph({
      spacing: { before: 60, after: 120, line: 276 },
      children: [
        new TextRun({
          text,
          size: 22,
          color: slateBody,
          font: 'Times New Roman',
        }),
      ],
    });
  }

  function createCallout(title: string, content: string, bg: string = 'F0F9FF', borderC: string = '0284C7'): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                left: { style: BorderStyle.SINGLE, size: 24, color: borderC },
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              shading: { fill: bg },
              margins: { top: 140, bottom: 140, left: 180, right: 180 },
              children: [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [new TextRun({ text: title, bold: true, size: 22, color: primaryNavy, font: 'Times New Roman' })],
                }),
                new Paragraph({
                  spacing: { line: 260 },
                  children: [new TextRun({ text: content, size: 20, color: slateBody, font: 'Times New Roman' })],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  // --- COVER & TITLE HEADER ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({
          text: 'EXAPRO SOFTWARE QUALITY & FAULT REPORT',
          bold: true,
          size: 32,
          color: primaryNavy,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Target Project: ${project.projectName} | Generated: ${new Date().toLocaleDateString()}`,
          size: 20,
          color: subtleGray,
          font: 'Times New Roman',
        }),
      ],
    })
  );

  // --- SECTION 1: EXECUTIVE SUMMARY & QUALITY SCORE ---
  children.push(createHeading1('1. Executive Summary & Quality Score'));

  const summary = testRun.summary;
  const gradeColor = summary.qualityGrade === 'A' ? successGreen : summary.qualityGrade === 'B' ? '2563EB' : summary.qualityGrade === 'C' ? warningAmber : criticalRed;

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: defaultBorder,
              shading: { fill: 'F8FAFC' },
              margins: { top: 160, bottom: 160, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'Overall Quality Score\n', size: 20, color: subtleGray, font: 'Times New Roman' }),
                    new TextRun({ text: `${summary.qualityScore}`, bold: true, size: 56, color: gradeColor, font: 'Times New Roman' }),
                    new TextRun({ text: ' / 100\n', size: 24, color: subtleGray, font: 'Times New Roman' }),
                    new TextRun({ text: `Grade: ${summary.qualityGrade}`, bold: true, size: 28, color: gradeColor, font: 'Times New Roman' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: defaultBorder,
              margins: { top: 140, bottom: 140, left: 160, right: 160 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Test Suite Execution:\n', bold: true, size: 20, color: primaryNavy, font: 'Times New Roman' }),
                    new TextRun({ text: `• Total Planned Tests: ${summary.totalTests}\n`, size: 20, color: slateBody, font: 'Times New Roman' }),
                    new TextRun({ text: `• Passed: ${summary.passed} | Failed: ${summary.failed} | Blocked: ${summary.blocked}\n`, size: 20, color: slateBody, font: 'Times New Roman' }),
                    new TextRun({ text: `• Total Findings: ${summary.totalFindings} (${summary.confirmedFaults} confirmed, ${summary.potentialFaults} potential)\n`, size: 20, color: slateBody, font: 'Times New Roman' }),
                    new TextRun({ text: `• Critical: ${summary.severityBreakdown.critical} | High: ${summary.severityBreakdown.high} | Medium: ${summary.severityBreakdown.medium} | Low: ${summary.severityBreakdown.low}\n`, size: 20, color: slateBody, font: 'Times New Roman' }),
                    new TextRun({ text: `• Execution Coverage: ${summary.testCoveragePercent}%`, bold: true, size: 20, color: primaryNavy, font: 'Times New Roman' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ spacing: { before: 120 } }));
  children.push(createCallout('Quality Score Calculation Methodology', summary.qualityScoreRationale, 'FEF3C7', warningAmber));

  // --- SECTION 2: PROJECT METADATA & DETECTED TECH STACK ---
  children.push(createHeading1('2. Project Profile & Detected Capabilities'));
  children.push(createBodyParagraph(
    `Repository evaluation was executed for ${project.projectName}. Exapro statically dissected repository manifests, build configurations, and source components to establish the verifiable technology inventory:`
  ));

  const techRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Technology Dimension', bold: true, color: 'FFFFFF', size: 20, font: 'Times New Roman' })] })] }),
        new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Detected Stack Components', bold: true, color: 'FFFFFF', size: 20, font: 'Times New Roman' })] })] }),
      ],
    }),
    new TableRow({ children: [new TableCell({ borders: defaultBorder, shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Languages', bold: true, size: 20, font: 'Times New Roman' })] })] }), new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.languages.join(', ') || 'None detected', size: 20, font: 'Times New Roman' })] })] })] }),
    new TableRow({ children: [new TableCell({ borders: defaultBorder, shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Frontend UI', bold: true, size: 20, font: 'Times New Roman' })] })] }), new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.frontend.join(', ') || 'N/A', size: 20, font: 'Times New Roman' })] })] })] }),
    new TableRow({ children: [new TableCell({ borders: defaultBorder, shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Backend Runtime', bold: true, size: 20, font: 'Times New Roman' })] })] }), new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.backend.join(', ') || 'None (Client SPA / BaaS)', size: 20, font: 'Times New Roman' })] })] })] }),
    new TableRow({ children: [new TableCell({ borders: defaultBorder, shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Database & Storage', bold: true, size: 20, font: 'Times New Roman' })] })] }), new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.database.join(', ') || 'None declared', size: 20, font: 'Times New Roman' })] })] })] }),
    new TableRow({ children: [new TableCell({ borders: defaultBorder, shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Build Tools & Bundlers', bold: true, size: 20, font: 'Times New Roman' })] })] }), new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.buildTools.join(', ') || 'Standard', size: 20, font: 'Times New Roman' })] })] })] }),
  ];

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: techRows }));

  // --- SECTION 3: TESTING ENVIRONMENT & SANDBOX ISOLATION ---
  children.push(createHeading1('3. Secure Sandbox Execution Environment'));

  const env = testRun.environment;
  const envCalloutText = env.isAvailable
    ? `Container isolation runtime: Docker (${env.version || 'active'}). CPU Limit: ${env.resourceLimits.cpuLimit}, Memory Limit: ${env.resourceLimits.memoryLimit}, Timeout: ${env.resourceLimits.timeoutSeconds}s. Network policy: Restricted.`
    : `${env.reason || 'Docker container engine was not found on host machine.'}\nRemediation: ${env.remediation || 'Start Docker Desktop to enable containerized testing.'}\nSecurity Rule: Exapro strictly forbids running submitted untrusted code on the host without container isolation.`;

  children.push(createCallout(
    env.isAvailable ? 'Secure Container Sandbox Status: ACTIVE' : 'Secure Container Sandbox Status: BLOCKED ON HOST',
    envCalloutText,
    env.isAvailable ? 'ECFDF5' : 'FFFBEB',
    env.isAvailable ? successGreen : warningAmber
  ));

  // --- SECTION 4: TEST EXECUTION MATRIX ---
  children.push(createHeading1('4. Test Execution Matrix'));
  children.push(createBodyParagraph(
    'Detailed breakdown of all planned test cases, target components, status, and observed outcome:'
  ));

  const testRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Test ID', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Test Name', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Target', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Observed Outcome', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
      ],
    }),
  ];

  for (const tc of testRun.testPlan) {
    const statusText = tc.status.toUpperCase();
    const statusColor = tc.status === 'passed' ? successGreen : tc.status === 'failed' ? criticalRed : warningAmber;

    testRows.push(
      new TableRow({
        children: [
          new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: tc.id, size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: tc.name, bold: true, size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: tc.target, size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: statusText, bold: true, color: statusColor, size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: tc.actualOutcome || tc.blockingReason || tc.expectedOutcome, size: 18, font: 'Times New Roman' })] })] }),
        ],
      })
    );
  }

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: testRows }));

  // --- SECTION 5: STATIC CODE INSPECTION FINDINGS ---
  children.push(createHeading1('5. Static Code Inspection Findings'));
  children.push(createBodyParagraph(
    'Static defect inspection scans for parse errors, broken relative module paths, missing package declarations, and silent error swallowing. Every finding reports exact file locations and line references:'
  ));

  if (testRun.findings.length === 0) {
    children.push(createBodyParagraph('✓ No static defects or configuration issues detected in the inspected source files.'));
  } else {
    const findingRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'ID', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Severity', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Title', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'File & Line Number', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
          new TableCell({ borders: defaultBorder, shading: { fill: tableHeaderBg }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })] })] }),
        ],
      }),
    ];

    for (const f of testRun.findings) {
      const sevColor = f.severity === 'Critical' || f.severity === 'High' ? criticalRed : f.severity === 'Medium' ? warningAmber : slateBody;
      const lineStr = f.lineRange ? `Line ${f.lineRange.start}${f.lineRange.end > f.lineRange.start ? `-${f.lineRange.end}` : ''}` : 'Location unconfirmed';

      findingRows.push(
        new TableRow({
          children: [
            new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: f.id, size: 18, font: 'Times New Roman' })] })] }),
            new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: f.severity, bold: true, color: sevColor, size: 18, font: 'Times New Roman' })] })] }),
            new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: f.title, bold: true, size: 18, font: 'Times New Roman' })] })] }),
            new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: `${f.filePath || 'Root'}\n(${lineStr})`, size: 18, font: 'Times New Roman' })] })] }),
            new TableCell({ borders: defaultBorder, children: [new Paragraph({ children: [new TextRun({ text: f.verificationStatus.toUpperCase(), size: 18, font: 'Times New Roman' })] })] }),
          ],
        })
      );
    }

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: findingRows }));
  }

  // --- SECTION 6: DETAILED FINDING PROFILES & REMEDIATION ---
  children.push(createHeading1('6. Detailed Finding Profiles & Remediation Guide'));

  for (const f of testRun.findings) {
    const lineStr = f.lineRange ? `Line ${f.lineRange.start}${f.lineRange.end > f.lineRange.start ? ` - ${f.lineRange.end}` : ''}` : 'File level';

    children.push(
      createHeading2(`[${f.id}] ${f.title}`),
      createBodyParagraph(`• Category: ${f.category} | Severity: ${f.severity} | Verification: ${f.verificationStatus.toUpperCase()} | Confidence: ${f.confidence}`),
      createBodyParagraph(`• File Path: ${f.filePath || 'N/A'} (${lineStr})`),
      createBodyParagraph(`• Description: ${f.description}`),
      createBodyParagraph(`• Expected Behavior: ${f.expectedBehavior}`),
      createBodyParagraph(`• Actual Behavior: ${f.actualBehavior}`),
      createBodyParagraph(`• Suggested Fix: ${f.suggestedFix}`)
    );

    if (f.evidence && f.evidence.length > 0) {
      for (const ev of f.evidence) {
        children.push(
          createCallout(`Evidence: ${ev.title}`, ev.data, 'F8FAFC', '64748B')
        );
      }
    }
  }

  // --- SECTION 7: BLOCKED TESTS & COVERAGE LIMITATIONS ---
  children.push(createHeading1('7. Blocked Tests & Next Steps'));
  const blockedList = testRun.testPlan.filter((t) => t.status === 'blocked');

  if (blockedList.length > 0) {
    children.push(createBodyParagraph(
      `The following ${blockedList.length} test case(s) could not execute to completion due to missing runtime environments, external dependencies, or unconfigured credentials:`
    ));

    for (const b of blockedList) {
      children.push(createBodyParagraph(`• ${b.name} (${b.target}): ${b.blockingReason || 'Blocked by environment prerequisite'}`));
    }
  } else {
    children.push(createBodyParagraph('All planned test cases executed without environmental blockers.'));
  }

  children.push(new Paragraph({ spacing: { before: 180 } }));
  children.push(createCallout(
    'Exapro Automated Testing Recommendations',
    '1. Address all High and Critical findings before deploying to production.\n' +
    '2. For containerized execution testing, start Docker Desktop on the host and re-trigger test execution.\n' +
    '3. Provide test environment variables in a .env.test configuration to unlock database and authenticated route testing.',
    'F0FDF4',
    successGreen
  ));

  // Build Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Exapro Quality & Fault Report — ${project.projectName}`,
                    size: 16,
                    color: subtleGray,
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 16, color: subtleGray, font: 'Times New Roman' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: subtleGray, font: 'Times New Roman' }),
                  new TextRun({ text: ' of ', size: 16, color: subtleGray, font: 'Times New Roman' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: subtleGray, font: 'Times New Roman' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  const stats = fs.statSync(filePath);

  return {
    filePath,
    fileName,
    fileSize: stats.size,
  };
}
