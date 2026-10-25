import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Project, IProjectDocument } from '../models/Project';
import { GitHubSubmissionSchema } from '../validators/projectSchemas';
import { extractZipSafely, cleanupDirectory } from '../services/zipService';
import { fetchGitHubRepo } from '../services/githubService';
import { analyzeProjectDirectory, AnalysisResult } from '../services/analyzerService';
import { generateProjectArchitecture } from '../services/diagramService';
import { generateProjectDocumentation } from '../services/aiService';
import { generateDocxReport } from '../services/docxService';
import { getDbStatus } from '../db/connection';
import { runAutomatedTestingPipeline } from '../services/testingOrchestratorService';
import { TestRun, FaultFinding, IFaultFinding } from '../models/testingModel';

export async function uploadZipProject(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No ZIP file uploaded. Please provide a valid project .zip file.' });
      return;
    }

    const originalName = req.file.originalname;
    const baseProjectName = path.basename(originalName, path.extname(originalName));

    // Create project record in MongoDB
    const project = new Project({
      projectName: baseProjectName,
      submissionType: 'zip',
      uploadedFileName: originalName,
      status: 'queued',
      progress: 5,
      statusMessage: 'ZIP file received. Queued for extraction and analysis.',
    });
    await project.save();

    // Start background processing pipeline
    processZipProjectAsync(project._id.toString(), req.file.path);

    res.status(201).json({
      message: 'Project ZIP uploaded successfully. Analysis and testing started.',
      projectId: project._id,
      project,
    });
  } catch (err: any) {
    console.error('[Upload] Error handling ZIP upload:', err);
    res.status(500).json({ error: err.message || 'Failed to process ZIP upload.' });
  }
}

async function processZipProjectAsync(projectId: string, uploadedZipPath: string): Promise<void> {
  let extractPath = '';
  try {
    const initialProject = await Project.findById(projectId);
    if (!initialProject) return;

    // 1. Inspecting / Extraction
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        status: 'inspecting',
        progress: 15,
        statusMessage: 'Safely decompressing and filtering archive files...',
      },
    });

    const extracted = extractZipSafely(uploadedZipPath, projectId);
    extractPath = extracted.extractPath;

    // Remove raw uploaded zip after extraction
    try {
      if (fs.existsSync(uploadedZipPath)) fs.unlinkSync(uploadedZipPath);
    } catch {
      // ignore
    }

    // 2. Analyzing Codebase
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        status: 'analyzing',
        progress: 35,
        statusMessage: 'Inspecting project manifests, routes, schemas, and source tree...',
      },
    });

    const analysis = analyzeProjectDirectory(extracted.rootDir, initialProject.projectName, 'zip');

    // Collect all relative files for static analysis
    const allFiles: string[] = [];
    function collectFiles(dir: string, base: string = '') {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const rel = path.join(base, e.name).replace(/\\/g, '/');
          if (e.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.next'].includes(e.name)) continue;
            collectFiles(path.join(dir, e.name), rel);
          } else if (e.isFile()) {
            allFiles.push(rel);
          }
        }
      } catch {
        // ignore
      }
    }
    collectFiles(extracted.rootDir);

    // 3. Automated Testing, Defect Inspection, and Fault Report (Report B)
    const testRun = await runAutomatedTestingPipeline(projectId, extracted.rootDir, analysis, allFiles);

    // 4. Architecture & Technical Documentation (Report A)
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        status: 'generating_docx',
        progress: 85,
        statusMessage: 'Synthesizing architecture diagram and compiling DOCX report...',
      },
    });

    const diagram = await generateProjectArchitecture(analysis);
    const docResult = await generateProjectDocumentation(analysis, diagram.description);

    const docxProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          projectName: analysis.projectName,
          detectedTechnologies: analysis.detectedTechnologies,
          inspectedFiles: analysis.inspectedFiles,
          totalFilesCount: analysis.totalFilesCount,
          components: analysis.components,
          databaseSchemas: analysis.databaseSchemas,
          apiEndpoints: analysis.apiEndpoints,
          architectureDiagramSvg: diagram.svg,
          architectureDescription: diagram.description,
          documentation: docResult.sections,
          usedAiFallback: docResult.usedAiFallback,
          aiProviderUsed: docResult.aiProviderUsed,
          aiModelUsed: docResult.aiModelUsed,
          structuredAnalysis: analysis,
        },
      },
      { new: true }
    );
    if (!docxProject) return;

    // 5. Generate Report A: Technical Documentation DOCX
    const docxMeta = await generateDocxReport(docxProject, analysis, diagram.pngBuffer);

    const finalStatus = testRun.stage === 'completed_with_warnings' ? 'completed_with_warnings' : 'completed';
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        reportFilePath: docxMeta.filePath,
        reportFileName: docxMeta.fileName,
        reportFileSize: docxMeta.fileSize,
        status: finalStatus,
        progress: 100,
        statusMessage: 'Project analysis, automated testing, and dual reports generated successfully.',
      },
    });
  } catch (err: any) {
    console.error(`[Process ZIP] Error processing project ${projectId}:`, err);
    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      progress: 0,
      errorMessage: err.message || 'An error occurred during project extraction or analysis.',
      statusMessage: 'Analysis failed.',
    });
  } finally {
    if (extractPath) {
      cleanupDirectory(extractPath);
    }
  }
}

export async function submitGitHubProject(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = GitHubSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request data',
        details: parseResult.error.errors.map((e) => e.message),
      });
      return;
    }

    const { repoUrl } = parseResult.data;
    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    const repoName = repoMatch ? repoMatch[2].replace(/\.git$/, '') : 'GitHub Repository';

    // Create project record
    const project = new Project({
      projectName: repoName,
      submissionType: 'github',
      repositoryUrl: repoUrl,
      status: 'queued',
      progress: 5,
      statusMessage: 'GitHub repository validated. Queued for remote inspection.',
    });
    await project.save();

    // Start background processing pipeline
    processGitHubProjectAsync(project._id.toString(), repoUrl);

    res.status(201).json({
      message: 'GitHub repository submitted successfully. Remote inspection started.',
      projectId: project._id,
      project,
    });
  } catch (err: any) {
    console.error('[GitHub Submit] Error submitting GitHub repo:', err);
    res.status(500).json({ error: err.message || 'Failed to submit GitHub repository.' });
  }
}

async function processGitHubProjectAsync(projectId: string, repoUrl: string): Promise<void> {
  let extractPath = '';
  try {
    const initialProject = await Project.findById(projectId);
    if (!initialProject) return;

    // 1. Fetching Remote Metadata & Tree
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        status: 'inspecting',
        progress: 25,
        statusMessage: 'Retrieving repository metadata and file tree via GitHub API...',
      },
    });

    const ghRepo = await fetchGitHubRepo(repoUrl, projectId);
    extractPath = ghRepo.rootDir;

    await Project.findByIdAndUpdate(projectId, {
      $set: {
        branch: ghRepo.defaultBranch,
        commitSha: ghRepo.commitSha,
        status: 'analyzing',
        progress: 50,
        statusMessage: 'Analyzing downloaded source files, manifests, and component structure...',
      },
    });

    const analysis = analyzeProjectDirectory(ghRepo.rootDir, ghRepo.repo, 'github');

    // 3. Automated Testing, Defect Inspection, and Fault Report (Report B)
    const testRun = await runAutomatedTestingPipeline(projectId, ghRepo.rootDir, analysis, ghRepo.allFilePaths);

    // 4. Architecture & Technical Documentation (Report A)
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        status: 'generating_docx',
        progress: 85,
        statusMessage: 'Synthesizing architecture diagram and compiling DOCX report...',
      },
    });

    const diagram = await generateProjectArchitecture(analysis);
    const docResult = await generateProjectDocumentation(analysis, diagram.description);

    const docxProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          projectName: analysis.projectName || ghRepo.repo,
          detectedTechnologies: analysis.detectedTechnologies,
          inspectedFiles: ghRepo.inspectedFilePaths.concat(analysis.inspectedFiles),
          totalFilesCount: ghRepo.allFilePaths.length,
          components: analysis.components,
          databaseSchemas: analysis.databaseSchemas,
          apiEndpoints: analysis.apiEndpoints,
          architectureDiagramSvg: diagram.svg,
          architectureDescription: diagram.description,
          documentation: docResult.sections,
          usedAiFallback: docResult.usedAiFallback,
          aiProviderUsed: docResult.aiProviderUsed,
          aiModelUsed: docResult.aiModelUsed,
          structuredAnalysis: analysis,
        },
      },
      { new: true }
    );
    if (!docxProject) return;

    // 5. Generate Report A: Technical Documentation DOCX
    const docxMeta = await generateDocxReport(docxProject, analysis, diagram.pngBuffer);

    const finalStatus = testRun.stage === 'completed_with_warnings' ? 'completed_with_warnings' : 'completed';
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        reportFilePath: docxMeta.filePath,
        reportFileName: docxMeta.fileName,
        reportFileSize: docxMeta.fileSize,
        status: finalStatus,
        progress: 100,
        statusMessage: 'Project analysis, automated testing, and dual reports generated successfully.',
      },
    });
  } catch (err: any) {
    console.error(`[Process GitHub] Error processing GitHub repo ${projectId}:`, err);
    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      progress: 0,
      errorMessage: err.message || 'An error occurred during GitHub repository retrieval or analysis.',
      statusMessage: 'Analysis failed.',
    });
  } finally {
    if (extractPath) {
      cleanupDirectory(extractPath);
    }
  }
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    const projects = await Project.find()
      .select('projectName submissionType repositoryUrl uploadedFileName branch commitSha status progress statusMessage detectedTechnologies totalFilesCount faultSummary faultReportFileName createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ projects });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list projects.' });
  }
}

export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get project.' });
  }
}

export async function getProjectReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (project.status !== 'completed' && project.status !== 'completed_with_warnings') {
      res.status(400).json({
        error: `Report is not ready yet. Current status: ${project.status}`,
        status: project.status,
        progress: project.progress,
        statusMessage: project.statusMessage,
      });
      return;
    }

    const testRun = await TestRun.findOne({ projectId: id });

    res.json({
      projectId: project._id,
      projectName: project.projectName,
      submissionType: project.submissionType,
      repositoryUrl: project.repositoryUrl,
      uploadedFileName: project.uploadedFileName,
      branch: project.branch,
      commitSha: project.commitSha,
      detectedTechnologies: project.detectedTechnologies,
      components: project.components,
      databaseSchemas: project.databaseSchemas,
      apiEndpoints: project.apiEndpoints,
      architectureDiagramSvg: project.architectureDiagramSvg,
      architectureDescription: project.architectureDescription,
      documentation: project.documentation,
      reportFileName: project.reportFileName,
      reportFileSize: project.reportFileSize,
      faultReportFileName: project.faultReportFileName,
      faultReportFileSize: project.faultReportFileSize,
      faultSummary: project.faultSummary,
      testRun,
      aiProviderUsed: project.aiProviderUsed,
      aiModelUsed: project.aiModelUsed,
      usedAiFallback: project.usedAiFallback,
      structuredAnalysis: project.structuredAnalysis,
      createdAt: project.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get report.' });
  }
}

export async function downloadProjectDocx(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if ((project.status !== 'completed' && project.status !== 'completed_with_warnings') || !project.reportFilePath) {
      res.status(400).json({ error: 'DOCX report has not been generated for this project.' });
      return;
    }

    if (!fs.existsSync(project.reportFilePath)) {
      res.status(404).json({ error: 'Generated report file was not found on server.' });
      return;
    }

    const downloadFileName = project.reportFileName || `${project.projectName}_Documentation.docx`;
    res.download(project.reportFilePath, downloadFileName);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to download report.' });
  }
}

export async function downloadProjectFaultReportDocx(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (!project.faultReportFilePath || !fs.existsSync(project.faultReportFilePath)) {
      res.status(404).json({ error: 'Software Quality and Fault Report DOCX was not found on server.' });
      return;
    }

    const downloadFileName = project.faultReportFileName || `${project.projectName}_Fault_Report.docx`;
    res.download(project.faultReportFilePath, downloadFileName);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to download fault report.' });
  }
}

export async function getProjectTestRun(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const testRun = await TestRun.findOne({ projectId: id });
    if (!testRun) {
      res.status(404).json({ error: 'No test run found for this project.' });
      return;
    }
    res.json({ testRun });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get test run.' });
  }
}

export async function getProjectFindings(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { severity, category, status, search } = req.query;

    const testRun = await TestRun.findOne({ projectId: id });
    if (!testRun) {
      res.status(404).json({ error: 'No test run findings found for this project.' });
      return;
    }

    let findings: IFaultFinding[] = (testRun.findings as unknown as IFaultFinding[]) || [];

    if (severity && typeof severity === 'string' && severity !== 'all') {
      findings = findings.filter((f: IFaultFinding) => f.severity.toLowerCase() === severity.toLowerCase());
    }
    if (category && typeof category === 'string' && category !== 'all') {
      findings = findings.filter((f: IFaultFinding) => f.category.toLowerCase() === category.toLowerCase());
    }
    if (status && typeof status === 'string' && status !== 'all') {
      findings = findings.filter((f: IFaultFinding) => f.verificationStatus.toLowerCase() === status.toLowerCase());
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      findings = findings.filter(
        (f: IFaultFinding) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          (f.filePath && f.filePath.toLowerCase().includes(q)) ||
          (f.affectedRouteOrEndpoint && f.affectedRouteOrEndpoint.toLowerCase().includes(q))
      );
    }

    res.json({
      total: findings.length,
      findings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get findings.' });
  }
}

export async function getProjectFaultReportJson(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const testRun = await TestRun.findOne({ projectId: id });
    if (!testRun) {
      res.status(404).json({ error: 'No fault report data found for this project.' });
      return;
    }

    res.json({
      projectId: project._id,
      projectName: project.projectName,
      generatedAt: testRun.completedAt || testRun.updatedAt,
      summary: testRun.summary,
      environment: testRun.environment,
      testPlan: testRun.testPlan,
      findings: testRun.findings,
      detectedTechnologies: project.detectedTechnologies,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get fault report JSON.' });
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (project.reportFilePath && fs.existsSync(project.reportFilePath)) {
      try {
        fs.unlinkSync(project.reportFilePath);
      } catch {
        // ignore
      }
    }

    if (project.faultReportFilePath && fs.existsSync(project.faultReportFilePath)) {
      try {
        fs.unlinkSync(project.faultReportFilePath);
      } catch {
        // ignore
      }
    }

    await TestRun.deleteMany({ projectId: id });
    await FaultFinding.deleteMany({ projectId: id });
    await Project.findByIdAndDelete(id);

    res.json({ message: 'Project, associated test runs, and dual reports deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete project.' });
  }
}

export async function checkHealth(req: Request, res: Response): Promise<void> {
  const dbStatus = getDbStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Exapro Project Documentation & Automated Testing Engine',
    database: dbStatus,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN),
  });
}
