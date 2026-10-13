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
  ImageRun,
  PageBreak,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { REPORTS_DIR } from '../config/env';
import { IProjectDocument } from '../models/Project';
import { AnalysisResult } from './analyzerService';

export interface DocxGenerationResult {
  filePath: string;
  fileName: string;
  fileSize: number;
}

export async function generateDocxReport(
  project: IProjectDocument,
  analysis: AnalysisResult,
  diagramPngBuffer: Buffer
): Promise<DocxGenerationResult> {
  const safeProjectName = project.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeProjectName}_ExaPro_Documentation_Report.docx`;
  const filePath = path.join(REPORTS_DIR, `${project._id}.docx`);

  // Design System Palette: Deep Navy & Muted Accent
  const navyColor = '0F172A';
  const primaryNavy = '1E3A8A';
  const accentBlue = '0284C7';
  const slateText = '334155';
  const tableHeaderBg = '1E293B';
  const lightRowBg = 'F8FAFC';
  const codeBg = 'F1F5F9';

  // Typography & Layout Helpers
  function createH1(title: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 140 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 30, // 15pt
          color: primaryNavy,
          font: 'Calibri',
        }),
      ],
    });
  }

  function createH2(title: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 24, // 12pt
          color: accentBlue,
          font: 'Calibri',
        }),
      ],
    });
  }

  function createBody(text: string): Paragraph {
    return new Paragraph({
      spacing: { before: 60, after: 100, line: 260 },
      children: [
        new TextRun({
          text,
          size: 22, // 11pt
          font: 'Calibri',
          color: slateText,
        }),
      ],
    });
  }

  function createCallout(title: string, message: string): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F0F9FF' },
              children: [
                new Paragraph({
                  spacing: { before: 100, after: 60 },
                  children: [
                    new TextRun({
                      text: `[NOTE] ${title}`,
                      bold: true,
                      size: 20,
                      color: accentBlue,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 40, after: 100 },
                  children: [
                    new TextRun({
                      text: message,
                      size: 20,
                      color: slateText,
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  function parseTextToParagraphs(rawText: string): Paragraph[] {
    const lines = rawText.split('\n');
    const result: Paragraph[] = [];
    let inCode = false;
    let codeAccumulator: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (line.startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeAccumulator = [];
        } else {
          inCode = false;
          result.push(
            new Paragraph({
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({
                  text: codeAccumulator.join('\n'),
                  font: 'Consolas',
                  size: 19,
                  color: '0F172A',
                }),
              ],
            })
          );
        }
        continue;
      }

      if (inCode) {
        codeAccumulator.push(line);
        continue;
      }

      if (!line.trim()) continue;

      if (line.startsWith('### ')) {
        result.push(createH2(line.replace('### ', '')));
      } else if (line.startsWith('## ')) {
        result.push(createH1(line.replace('## ', '')));
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        result.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: line.replace(/^[•\-]\s*/, '').replace(/\*\*/g, ''),
                size: 22,
                font: 'Calibri',
                color: slateText,
              }),
            ],
          })
        );
      } else {
        result.push(
          new Paragraph({
            spacing: { before: 60, after: 80, line: 260 },
            children: [
              new TextRun({
                text: line.replace(/\*\*/g, ''),
                size: 22,
                font: 'Calibri',
                color: slateText,
              }),
            ],
          })
        );
      }
    }
    return result;
  }

  // 1. Cover Page
  const coverElements = [
    new Paragraph({ spacing: { before: 1200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'EXAPRO SOFTWARE EVALUATION & ARCHITECTURE REPORT',
          bold: true,
          size: 22,
          color: accentBlue,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 240 },
      children: [
        new TextRun({
          text: project.projectName,
          bold: true,
          size: 48, // 24pt
          color: primaryNavy,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 700 },
      children: [
        new TextRun({
          text: 'Evidence-Based Technical Architecture, Component Analysis & System Specifications',
          italics: true,
          size: 22,
          color: '64748B',
          font: 'Calibri',
        }),
      ],
    }),
    // Metadata Block Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Submission Source', bold: true, color: primaryNavy })] })],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: project.submissionType === 'github' ? 'Public GitHub Repository' : 'Uploaded Project ZIP Archive' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Source Reference', bold: true, color: primaryNavy })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: project.repositoryUrl || project.uploadedFileName || 'Project Source Tree' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Source Revision', bold: true, color: primaryNavy })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: project.commitSha || 'Static Snapshot' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Architecture Style', bold: true, color: primaryNavy })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: analysis.architecture.architectureType === 'client_baas' ? 'Client-Side BaaS (Serverless)' : analysis.architecture.architectureType === 'client_server_db' ? 'Client / Server / Database' : 'Single Page Application' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Inspection Coverage', bold: true, color: primaryNavy })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${analysis.coverage.inspectedFilesCount} of ${analysis.coverage.totalDiscoveredFiles} files analyzed (${analysis.coverage.coveragePercentage}%)` })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              children: [new Paragraph({ children: [new TextRun({ text: 'Generation Timestamp', bold: true, color: primaryNavy })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // 2. Document Information and Analysis Scope (Section 1)
  const coverageElements = [
    createH1('1. Document Information & Analysis Scope'),
    createBody('This technical evaluation report is generated by ExaPro through deterministic static code inspection and evidence-constrained AI analysis. The table below discloses the exact repository inspection coverage:'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: tableHeaderBg },
              children: [new Paragraph({ children: [new TextRun({ text: 'Coverage Metric', bold: true, color: 'FFFFFF' })] })],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: tableHeaderBg },
              children: [new Paragraph({ children: [new TextRun({ text: 'Value / Status', bold: true, color: 'FFFFFF' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Discovered Repository Files' })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(analysis.coverage.totalDiscoveredFiles), bold: true })] })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Successfully Inspected Files' })] })] }),
            new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: String(analysis.coverage.inspectedFilesCount), bold: true })] })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Files Excluded by Policy (dependencies, binaries)' })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(analysis.coverage.skippedByPolicyCount) })] })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Overall Coverage Percentage' })] })] }),
            new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: `${analysis.coverage.coveragePercentage}% (${analysis.coverage.isPartial ? 'Partial Priority Coverage' : 'Complete'})` })] })] }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { before: 120 } }),
    createCallout('Inspection Scope Notice', analysis.coverage.limitationNotice),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 3. Executive Summary (Section 2)
  const execSummaryElements = [
    createH1('2. Executive Summary'),
    ...parseTextToParagraphs(project.documentation.executiveSummary),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 4. Project Overview (Section 3)
  const overviewElements = [
    createH1('3. Project Overview and Purpose'),
    ...parseTextToParagraphs(project.documentation.projectOverview),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 5. Technology Stack (Section 4)
  const techRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: tableHeaderBg },
          children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 36, type: WidthType.PERCENTAGE },
          shading: { fill: tableHeaderBg },
          children: [new Paragraph({ children: [new TextRun({ text: 'Verified Technologies', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 36, type: WidthType.PERCENTAGE },
          shading: { fill: tableHeaderBg },
          children: [new Paragraph({ children: [new TextRun({ text: 'Evidence Source', bold: true, color: 'FFFFFF' })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Programming Languages', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.languages.join(', ') || 'N/A' })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Inspected file extensions' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Frontend UI Framework', bold: true })] })] }),
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.frontend.join(', ') || 'N/A' })] })] }),
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'package.json & React imports' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Authentication Service', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.auth.join(', ') || 'None detected' })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.auth.length > 0 ? 'firebase/auth SDK calls' : 'Static inspection' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Database & Storage', bold: true })] })] }),
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.database.join(', ') || 'None detected' })] })] }),
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: analysis.database.summary })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Server Frameworks', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.backend.join(', ') || 'None (Client-Side BaaS / SPA)' })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.backend.length > 0 ? 'Confirmed server entry point' : 'Verified absence of server processes' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Build & Tooling', bold: true })] })] }),
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.buildTools.join(', ') || 'N/A' })] })] }),
        new TableCell({ shading: { fill: lightRowBg }, children: [new Paragraph({ children: [new TextRun({ text: 'Build manifests & config files' })] })] }),
      ],
    }),
  ];

  const techStackElements = [
    createH1('4. Technology Stack & Dependencies'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: techRows,
    }),
    new Paragraph({ spacing: { before: 140 } }),
    ...parseTextToParagraphs(project.documentation.technologyStackDescription),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 6. Project Structure (Section 5)
  const structureElements = [
    createH1('5. Project Structure & Directory Organization'),
    ...parseTextToParagraphs(project.documentation.projectStructureTree),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 7. System Architecture (Section 6 - Mandatory Embedded Diagram Image)
  const architectureElements = [
    createH1('6. System Architecture'),
    createBody('The following project-specific architecture diagram was synthesized dynamically from verified component evidence:'),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 140, after: 140 },
      children: [
        new ImageRun({
          data: diagramPngBuffer,
          transformation: {
            width: 580,
            height: 290,
          },
          type: 'png',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Figure 6.1: Evidence-Based System Architecture Diagram for ${project.projectName}`,
          italics: true,
          size: 19,
          color: '64748B',
        }),
      ],
    }),
    ...parseTextToParagraphs(project.documentation.systemArchitectureDescription),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 8. Module and Component Analysis (Section 7)
  const moduleElements = [
    createH1('7. Module and Component Analysis'),
    createBody('Detailed inspection of application modules, component state hooks, and service interfaces:'),
    ...parseTextToParagraphs(project.documentation.moduleDetails),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 9. Data Flow (Section 8)
  const dataFlowElements = [
    createH1('8. Data Flow and External Integrations'),
    ...parseTextToParagraphs(project.documentation.dataFlowDescription),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 10. Database Design and API Analysis (Section 9)
  const databaseElements = [
    createH1('9. Database Design and API Analysis'),
    ...parseTextToParagraphs(project.documentation.databaseDesignDescription),
    new Paragraph({ spacing: { before: 140 } }),
    createH2('Network API & Communication Analysis'),
    ...parseTextToParagraphs(project.documentation.apiDocumentationDescription),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 11. Setup and Execution Guide (Section 10)
  const setupElements = [
    createH1('10. Setup and Execution Guide'),
    ...parseTextToParagraphs(project.documentation.setupAndExecutionInstructions),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 12. Testing and Verification (Section 11)
  const testingElements = [
    createH1('11. Testing & Quality Verification'),
    ...parseTextToParagraphs(project.documentation.testingAndQualityDescription),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 13. Limitations and Recommendations (Section 12)
  const limitationElements = [
    createH1('12. Findings, Limitations & Recommendations'),
    ...parseTextToParagraphs(project.documentation.limitationsAndObservations),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // 14. Appendix (Section 13)
  const appendixElements = [
    createH1('13. Appendix & Evidence Inventory'),
    ...parseTextToParagraphs(project.documentation.appendix),
    new Paragraph({ spacing: { after: 180 } }),
  ];

  // Compile complete Document with running Headers & Footers
  const doc = new Document({
    creator: 'ExaPro Project Evaluator',
    title: `${project.projectName} Architecture Report`,
    description: 'Evidence-based software architecture documentation report',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `ExaPro Architecture Report — ${project.projectName}`,
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
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
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 18,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 18,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...coverElements,
          ...coverageElements,
          ...execSummaryElements,
          ...overviewElements,
          ...techStackElements,
          ...structureElements,
          ...architectureElements,
          ...moduleElements,
          ...dataFlowElements,
          ...databaseElements,
          ...setupElements,
          ...testingElements,
          ...limitationElements,
          ...appendixElements,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  return {
    filePath,
    fileName,
    fileSize: buffer.length,
  };
}
