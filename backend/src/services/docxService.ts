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
  BorderStyle,
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

  // Design System Palette: Deep Navy, Slate & Accent
  const primaryNavy = '0F172A';
  const secondaryNavy = '1E3A8A';
  const accentBlue = '0284C7';
  const slateBody = '334155';
  const subtleGray = '64748B';
  const tableHeaderBg = '1E293B';
  const lightRowBg = 'F8FAFC';
  const codeBoxBg = 'F8FAFC';
  const calloutBg = 'F0F9FF';
  const borderColor = 'CBD5E1';

  // 1. Inline Markdown Parser: turns **bold**, *italics*, and `code` into real TextRuns
  function parseInlineMarkdown(
    text: string,
    baseOptions: { font?: string; size?: number; color?: string; bold?: boolean } = {}
  ): TextRun[] {
    const runs: TextRun[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+?\*\*|\*[^*]+?\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const normalText = text.substring(lastIndex, match.index);
        if (normalText) {
          runs.push(
            new TextRun({
              text: normalText,
              font: baseOptions.font || 'Calibri',
              size: baseOptions.size || 22, // 11pt
              color: baseOptions.color || slateBody,
              bold: baseOptions.bold || false,
            })
          );
        }
      }

      const token = match[0];
      if (token.startsWith('`') && token.endsWith('`')) {
        runs.push(
          new TextRun({
            text: token.slice(1, -1),
            font: 'Consolas',
            size: baseOptions.size ? Math.max(16, baseOptions.size - 2) : 19, // 9.5pt
            color: primaryNavy,
            shading: { fill: 'F1F5F9' },
          })
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        runs.push(
          new TextRun({
            text: token.slice(2, -2),
            bold: true,
            font: baseOptions.font || 'Calibri',
            size: baseOptions.size || 22,
            color: primaryNavy,
          })
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        runs.push(
          new TextRun({
            text: token.slice(1, -1),
            italics: true,
            font: baseOptions.font || 'Calibri',
            size: baseOptions.size || 22,
            color: subtleGray,
          })
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      const trailing = text.substring(lastIndex);
      if (trailing) {
        runs.push(
          new TextRun({
            text: trailing,
            font: baseOptions.font || 'Calibri',
            size: baseOptions.size || 22,
            color: baseOptions.color || slateBody,
            bold: baseOptions.bold || false,
          })
        );
      }
    }

    return runs.length > 0
      ? runs
      : [
          new TextRun({
            text,
            font: baseOptions.font || 'Calibri',
            size: baseOptions.size || 22,
            color: baseOptions.color || slateBody,
            bold: baseOptions.bold || false,
          }),
        ];
  }

  // 2. Heading & Typography Helpers
  function createH1(title: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 120 },
      keepNext: true,
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 36, // 18pt
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
      keepNext: true,
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 28, // 14pt
          color: secondaryNavy,
          font: 'Calibri',
        }),
      ],
    });
  }

  function createH3(title: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 180, after: 80 },
      keepNext: true,
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 24, // 12pt
          color: slateBody,
          font: 'Calibri',
        }),
      ],
    });
  }

  function createBody(text: string): Paragraph {
    return new Paragraph({
      spacing: { before: 40, after: 80, line: 288 }, // 1.2 line spacing
      children: parseInlineMarkdown(text, { font: 'Calibri', size: 22, color: slateBody }),
    });
  }

  function createCallout(title: string, message: string): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: calloutBg },
              borders: {
                left: { style: BorderStyle.SINGLE, size: 24, color: accentBlue },
                top: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  spacing: { before: 100, after: 40 },
                  children: [
                    new TextRun({
                      text: `[NOTE] ${title}`,
                      bold: true,
                      size: 20, // 10pt
                      color: accentBlue,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 20, after: 100, line: 260 },
                  children: parseInlineMarkdown(message, { font: 'Calibri', size: 20, color: slateBody }),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  function createCodeBlockTable(lines: string[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          cantSplit: false,
          children: [
            new TableCell({
              shading: { fill: codeBoxBg },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: lines.map(
                (codeLine) =>
                  new Paragraph({
                    spacing: { before: 20, after: 20, line: 220 },
                    children: [
                      new TextRun({
                        text: codeLine || ' ',
                        font: 'Consolas',
                        size: 18, // 9pt
                        color: primaryNavy,
                      }),
                    ],
                  })
              ),
            }),
          ],
        }),
      ],
    });
  }

  function createMarkdownTable(tableLines: string[]): Table {
    const rawRows = tableLines
      .filter((l) => l.trim().startsWith('|') && !l.includes('---'))
      .map((l) =>
        l
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );

    if (rawRows.length === 0) {
      return new Table({ rows: [] });
    }

    const columnCount = rawRows[0].length;
    const colWidthPct = Math.floor(100 / columnCount);

    const rows = rawRows.map((cols, rowIdx) => {
      const isHeader = rowIdx === 0;
      return new TableRow({
        tableHeader: isHeader,
        cantSplit: true,
        children: cols.map((colText) => {
          return new TableCell({
            width: { size: colWidthPct, type: WidthType.PERCENTAGE },
            shading: { fill: isHeader ? tableHeaderBg : rowIdx % 2 === 1 ? lightRowBg : 'FFFFFF' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            },
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: isHeader
                  ? [new TextRun({ text: colText, bold: true, color: 'FFFFFF', size: 19, font: 'Calibri' })]
                  : parseInlineMarkdown(colText, { font: 'Calibri', size: 19, color: slateBody }),
              }),
            ],
          });
        }),
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });
  }

  // 3. Multi-Block Markdown Parser: converts markdown into styled paragraphs, tables, and code blocks
  function parseMarkdownToElements(rawMarkdown: string): (Paragraph | Table)[] {
    const lines = rawMarkdown.split('\n');
    const elements: (Paragraph | Table)[] = [];
    let inCodeBlock = false;
    let codeAccumulator: string[] = [];
    let inTable = false;
    let tableAccumulator: string[] = [];

    function flushTable() {
      if (tableAccumulator.length > 0) {
        elements.push(createMarkdownTable(tableAccumulator));
        tableAccumulator = [];
      }
      inTable = false;
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trimEnd();

      // Fenced code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          if (inTable) flushTable();
          inCodeBlock = true;
          codeAccumulator = [];
        } else {
          inCodeBlock = false;
          elements.push(createCodeBlockTable(codeAccumulator));
          codeAccumulator = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeAccumulator.push(line);
        continue;
      }

      // Markdown Tables (| ... |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableAccumulator.push(line.trim());
        continue;
      } else if (inTable) {
        flushTable();
      }

      if (!line.trim()) continue;

      // Callouts (> [!NOTE] / > [!IMPORTANT])
      if (line.startsWith('> [!NOTE]') || line.startsWith('> [!IMPORTANT]')) {
        const title = line.includes('NOTE') ? 'Important Note' : 'Technical Disclosure';
        let calloutMsg = '';
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
          i++;
          calloutMsg += lines[i].replace(/^>\s*/, '') + ' ';
        }
        elements.push(createCallout(title, calloutMsg.trim() || line));
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(createH3(line.replace('### ', '').trim()));
      } else if (line.startsWith('## ')) {
        elements.push(createH2(line.replace('## ', '').trim()));
      } else if (line.startsWith('# ')) {
        elements.push(createH1(line.replace('# ', '').trim()));
      } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet points with formatted runs
        const bulletText = line.replace(/^[•\-\*]\s*/, '').trim();
        elements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 30, after: 30, line: 260 },
            children: parseInlineMarkdown(bulletText, { font: 'Calibri', size: 21, color: slateBody }),
          })
        );
      } else if (/^\d+\.\s+/.test(line)) {
        // Numbered list
        const numMatch = line.match(/^(\d+\.)\s+(.*)/);
        if (numMatch) {
          elements.push(
            new Paragraph({
              spacing: { before: 40, after: 40, line: 260 },
              children: [
                new TextRun({ text: `${numMatch[1]} `, bold: true, color: primaryNavy, font: 'Calibri', size: 21 }),
                ...parseInlineMarkdown(numMatch[2], { font: 'Calibri', size: 21, color: slateBody }),
              ],
            })
          );
        } else {
          elements.push(createBody(line));
        }
      } else {
        // Regular body paragraph
        elements.push(createBody(line));
      }
    }

    if (inTable) flushTable();
    if (inCodeBlock && codeAccumulator.length > 0) {
      elements.push(createCodeBlockTable(codeAccumulator));
    }

    return elements;
  }

  // 4. Cover Page
  const coverElements = [
    new Paragraph({ spacing: { before: 1000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'EXAPRO SOFTWARE EVALUATION & ARCHITECTURE REPORT',
          bold: true,
          size: 20, // 10pt
          color: accentBlue,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: project.projectName,
          bold: true,
          size: 56, // 28pt
          color: primaryNavy,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: 'Evidence-Based Technical Architecture, Component Structure & Quality Evaluation',
          size: 24, // 12pt
          color: subtleGray,
          font: 'Calibri',
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: { fill: 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Evaluation Target', bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: project.projectName, bold: true, font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Submission Source', bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: project.submissionType === 'github' ? `GitHub Repository (${project.repositoryUrl})` : `Archive Upload (${project.uploadedFileName || 'ZIP Archive'})`, font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Primary Runtime', bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: analysis.technologies.backendRuntime ? `${analysis.technologies.primaryRuntime} & ${analysis.technologies.backendRuntime}` : analysis.technologies.primaryRuntime, bold: true, color: secondaryNavy, font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Architectural Style', bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        analysis.architecture.architectureType === 'polyglot_fullstack'
                          ? 'Polyglot Full-Stack (Distributed Client & Microservice Runtime)'
                          : analysis.architecture.architectureType === 'client_baas'
                          ? 'Client-Side BaaS (Serverless Cloud Services)'
                          : analysis.architecture.architectureType === 'client_server_db'
                          ? 'Multi-Tier Client / Server / Database'
                          : 'Single Page Application (SPA)',
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Inspection Coverage', bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: `${analysis.coverage.inspectedFilesCount} of ${analysis.coverage.totalDiscoveredFiles} files analyzed (${analysis.coverage.coveragePercentage}% coverage)`, font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Evaluation Date', bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), font: 'Calibri' })] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // 5. Section 1: Executive Summary & Project Profile
  const execSummaryElements = [
    createH1('1. Executive Summary & Project Profile'),
    ...parseMarkdownToElements(project.documentation.executiveSummary),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 6. Section 2: Inspection Scope & Reconciled Coverage Accounting
  const coverageElements = [
    createH1('2. Inspection Scope & File Coverage Accounting'),
    createBody('This report was generated through deterministic static code analysis and evidence-grounded evaluation. The table below discloses the reconciled file inventory:'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: tableHeaderBg },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Coverage Metric', bold: true, color: 'FFFFFF', font: 'Calibri' })] })],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: tableHeaderBg },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Accounting Status', bold: true, color: 'FFFFFF', font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Total Discovered Repository Files', font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: String(analysis.coverage.totalDiscoveredFiles), bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: lightRowBg },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Successfully Inspected Files', font: 'Calibri' })] })],
            }),
            new TableCell({
              shading: { fill: lightRowBg },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: String(analysis.coverage.inspectedFilesCount), bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Excluded by Policy (binary, assets, non-code)', font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: String(analysis.coverage.skippedByPolicyCount), font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill: lightRowBg },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Excluded Directories (Dependencies, Caches)', font: 'Calibri' })] })],
            }),
            new TableCell({
              shading: { fill: lightRowBg },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: analysis.coverage.excludedDirectories.join(', ') || 'None', font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: 'Overall Coverage Percentage', font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
              },
              children: [new Paragraph({ children: [new TextRun({ text: `${analysis.coverage.coveragePercentage}% (${analysis.coverage.isPartial ? 'Partial Priority Coverage' : 'Complete Coverage'})`, bold: true, color: primaryNavy, font: 'Calibri' })] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { before: 120 } }),
    createCallout('Inspection Scope Notice', analysis.coverage.limitationNotice),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 7. Section 3: Project Purpose & Overview
  const overviewElements = [
    createH1('3. Project Overview and Functional Capabilities'),
    ...parseMarkdownToElements(project.documentation.projectOverview),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 8. Section 4: Technology Stack Matrix
  const techStackElements = [
    createH1('4. Verified Technology Stack & Runtime Matrix'),
    createBody('The following table details verified application runtimes, declared manifest packages, and observed SDK integrations:'),
    ...parseMarkdownToElements(project.documentation.technologyStackDescription),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 9. Section 5: Directory Structure & Code Organization
  const structureElements = [
    createH1('5. Directory Structure & Code Organization'),
    ...parseMarkdownToElements(project.documentation.projectStructureTree),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 10. Section 6: System Architecture & Figure 6.1 Diagram
  const architectureElements = [
    createH1('6. System Architecture & Component Topology'),
    createBody('The architecture diagram below was synthesized dynamically from verified static component evidence and communication channels:'),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 140, after: 100 },
      keepNext: true,
      children: [
        new ImageRun({
          data: diagramPngBuffer,
          transformation: {
            width: 560,
            height: 280,
          },
          type: 'png',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      keepNext: true,
      children: [
        new TextRun({
          text: `Figure 6.1: Evidence-Grounded System Architecture Diagram for ${project.projectName}`,
          italics: true,
          size: 19,
          color: subtleGray,
          font: 'Calibri',
        }),
      ],
    }),
    ...parseMarkdownToElements(project.documentation.systemArchitectureDescription),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 11. Section 7: Module and Component Analysis
  const moduleElements = [
    createH1('7. Module and Component Analysis'),
    createBody('Inspection of primary application modules, state containers, and data access services:'),
    ...parseMarkdownToElements(project.documentation.moduleDetails),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 12. Section 8: End-to-End Data Flow
  const dataFlowElements = [
    createH1('8. End-to-End Data Flow & Cloud Integration'),
    ...parseMarkdownToElements(project.documentation.dataFlowDescription),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 13. Section 9: Database Design & Datastore Analysis
  const databaseElements = [
    createH1('9. Database Design & Datastore Analysis'),
    ...parseMarkdownToElements(project.documentation.databaseDesignDescription),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 14. Section 10: API & Network Communication
  const apiElements = [
    createH1('10. API & Network Communication Analysis'),
    ...parseMarkdownToElements(project.documentation.apiDocumentationDescription),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 15. Section 11: Setup & Execution Guide
  const setupElements = [
    createH1('11. Setup, Configuration & Execution Guide'),
    ...parseMarkdownToElements(project.documentation.setupAndExecutionInstructions),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 16. Section 12: Testing & Quality Verification
  const testingElements = [
    createH1('12. Testing Infrastructure & Quality Verification'),
    ...parseMarkdownToElements(project.documentation.testingAndQualityDescription),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 17. Section 13: Technical Findings & Limitations
  const limitationElements = [
    createH1('13. Technical Findings, Security & Limitations'),
    ...parseMarkdownToElements(project.documentation.limitationsAndObservations),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // 18. Section 14: Appendix & Detailed Inventories
  const appendixElements = [
    createH1('14. Appendix & Complete Inventories'),
    ...parseMarkdownToElements(project.documentation.appendix),
    new Paragraph({ spacing: { after: 140 } }),
  ];

  // Complete Document Assembly
  const doc = new Document({
    creator: 'ExaPro Technical Evaluator',
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
                    text: `ExaPro Architecture Evaluation — ${project.projectName}`,
                    size: 17, // 8.5pt
                    color: subtleGray,
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
                    size: 17,
                    color: subtleGray,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 17,
                    color: subtleGray,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 17,
                    color: subtleGray,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 17,
                    color: subtleGray,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...coverElements,
          ...execSummaryElements,
          ...coverageElements,
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
  const fileSize = fs.statSync(filePath).size;

  return {
    filePath,
    fileName,
    fileSize,
  };
}
