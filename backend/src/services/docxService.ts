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
  BorderStyle,
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
  const fileName = `${safeProjectName}_Exapro_Documentation.docx`;
  const filePath = path.join(REPORTS_DIR, `${project._id}.docx`);

  const primaryColor = '1E3A8A'; // Deep Navy
  const secondaryColor = '0284C7'; // Cyan
  const lightBgColor = 'F1F5F9'; // Light gray background
  const borderColor = 'CBD5E1';

  // Helper function to create standard heading 1
  function createHeading1(title: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 180 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32, // 16pt
          color: primaryColor,
          font: 'Calibri',
        }),
      ],
    });
  }

  // Helper function to create standard heading 2
  function createHeading2(title: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 26, // 13pt
          color: secondaryColor,
          font: 'Calibri',
        }),
      ],
    });
  }

  // Helper function for regular body paragraph
  function createBodyParagraph(text: string): Paragraph {
    return new Paragraph({
      spacing: { before: 80, after: 120, line: 276 },
      children: [
        new TextRun({
          text,
          size: 22, // 11pt
          font: 'Calibri',
          color: '334155',
        }),
      ],
    });
  }

  // Convert markdown-like paragraphs to Docx paragraphs
  function parseTextToParagraphs(text: string): Paragraph[] {
    const lines = text.split('\n');
    const paras: Paragraph[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLines = [];
        } else {
          inCodeBlock = false;
          // Render accumulated code
          paras.push(
            new Paragraph({
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({
                  text: codeLines.join('\n'),
                  font: 'Consolas',
                  size: 19, // 9.5pt
                  color: '0F172A',
                }),
              ],
            })
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      if (!line.trim()) {
        continue;
      }

      if (line.startsWith('### ')) {
        paras.push(createHeading2(line.replace('### ', '')));
      } else if (line.startsWith('## ')) {
        paras.push(createHeading1(line.replace('## ', '')));
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        paras.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: line.replace(/^[•\-]\s*/, '').replace(/\*\*/g, ''),
                size: 22,
                font: 'Calibri',
                color: '334155',
              }),
            ],
          })
        );
      } else {
        paras.push(
          new Paragraph({
            spacing: { before: 80, after: 120, line: 276 },
            children: [
              new TextRun({
                text: line.replace(/\*\*/g, ''),
                size: 22,
                font: 'Calibri',
                color: '334155',
              }),
            ],
          })
        );
      }
    }
    return paras;
  }

  // 1. Cover Page Elements
  const coverElements = [
    new Paragraph({ spacing: { before: 1200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'EXAPRO PROJECT DOCUMENTATION',
          bold: true,
          size: 24,
          color: secondaryColor,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: project.projectName,
          bold: true,
          size: 52, // 26pt
          color: primaryColor,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [
        new TextRun({
          text: 'Comprehensive Architecture, Technical Specifications & Evidence-Based System Report',
          italics: true,
          size: 24,
          color: '64748B',
          font: 'Calibri',
        }),
      ],
    }),
    // Metadata Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: 'Submission Type', bold: true, color: primaryColor })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: project.submissionType === 'github' ? 'Public GitHub Repository' : 'Project ZIP Upload' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Source Reference', bold: true, color: primaryColor })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: project.repositoryUrl || project.uploadedFileName || 'Submitted Project Archive' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Revision / Commit SHA', bold: true, color: primaryColor })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: project.commitSha || 'Static Snapshot' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Primary Technologies', bold: true, color: primaryColor })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: project.detectedTechnologies.languages.concat(project.detectedTechnologies.frameworks).join(', ') || 'Auto-Detected' })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Report Generated Date', bold: true, color: primaryColor })] })],
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

  // 2. Executive Summary
  const execSummaryElements = [
    createHeading1('1. Executive Summary'),
    ...parseTextToParagraphs(project.documentation.executiveSummary),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 3. Project Overview
  const overviewElements = [
    createHeading1('2. Project Overview'),
    ...parseTextToParagraphs(project.documentation.projectOverview),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 4. Technology Stack (With Table)
  const techTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: primaryColor },
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Detected Technologies & Frameworks', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: primaryColor },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Programming Languages', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.detectedTechnologies.languages.join(', ') || 'N/A' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Frontend UI', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.detectedTechnologies.frontend.join(', ') || 'N/A' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Backend Frameworks', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.detectedTechnologies.backend.join(', ') || 'N/A' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Database & Storage', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.detectedTechnologies.database.join(', ') || 'N/A' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Build & Tooling', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.detectedTechnologies.buildTools.join(', ') || 'N/A' })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Testing Frameworks', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.detectedTechnologies.testTools.join(', ') || 'N/A' })] })] }),
      ],
    }),
  ];

  const techStackElements = [
    createHeading1('3. Technology Stack & Dependencies'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: techTableRows,
    }),
    new Paragraph({ spacing: { before: 200 } }),
    ...parseTextToParagraphs(project.documentation.technologyStackDescription),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 5. Project Structure & Folder Tree
  const structureElements = [
    createHeading1('4. Project Structure & Organization'),
    ...parseTextToParagraphs(project.documentation.projectStructureTree),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 6. System Architecture (Mandatory Diagram Embedded!)
  const architectureElements = [
    createHeading1('5. System Architecture'),
    createBodyParagraph(
      'The following project-specific architecture diagram was synthesized directly from inspected source files, route declarations, and package dependencies:'
    ),
    // Embedded Architecture Diagram Image
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new ImageRun({
          data: diagramPngBuffer,
          transformation: {
            width: 580,
            height: 295,
          },
          type: 'png',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Figure 5.1: High-level System Architecture Diagram for ${project.projectName}`,
          italics: true,
          size: 19,
          color: '64748B',
        }),
      ],
    }),
    ...parseTextToParagraphs(project.documentation.systemArchitectureDescription),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 7. Module and Component Details
  const moduleElements = [
    createHeading1('6. Module and Component Details'),
    ...parseTextToParagraphs(project.documentation.moduleDetails),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 8. Data Flow
  const dataFlowElements = [
    createHeading1('7. Data Flow & Communication'),
    ...parseTextToParagraphs(project.documentation.dataFlowDescription),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 9. Database Design
  const databaseElements = [
    createHeading1('8. Database Design & Schemas'),
    ...parseTextToParagraphs(project.documentation.databaseDesignDescription),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 10. API Documentation
  const apiElements = [
    createHeading1('9. API Documentation & Routes'),
    ...parseTextToParagraphs(project.documentation.apiDocumentationDescription),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 11. Setup and Execution
  const setupElements = [
    createHeading1('10. Setup and Execution Guide'),
    ...parseTextToParagraphs(project.documentation.setupAndExecutionInstructions),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 12. Testing and Quality
  const testingElements = [
    createHeading1('11. Testing & Quality Verification'),
    ...parseTextToParagraphs(project.documentation.testingAndQualityDescription),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 13. Limitations and Observations
  const limitationElements = [
    createHeading1('12. Limitations & Observations'),
    ...parseTextToParagraphs(project.documentation.limitationsAndObservations),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // 14. Appendix
  const appendixElements = [
    createHeading1('13. Appendix & Inventory'),
    ...parseTextToParagraphs(project.documentation.appendix),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // Build the complete docx Document
  const doc = new Document({
    creator: 'Exapro AI-Powered Project Evaluator',
    title: `${project.projectName} Documentation Report`,
    description: 'Evidence-based software project documentation report with architecture diagram',
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Exapro Documentation — ${project.projectName}`,
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
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...coverElements,
          ...execSummaryElements,
          ...overviewElements,
          ...techStackElements,
          ...structureElements,
          ...architectureElements,
          ...moduleElements,
          ...dataFlowElements,
          ...databaseElements,
          ...apiElements,
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
