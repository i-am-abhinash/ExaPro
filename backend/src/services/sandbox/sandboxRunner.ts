import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import {
  ISandboxEnvironmentStatus,
  ITestCase,
  IFaultFinding,
  IFindingEvidence,
} from '../../models/testingModel';
import { AnalysisResult } from '../analyzerService';

const execAsync = promisify(execFile);

export interface SandboxExecutionResult {
  environment: ISandboxEnvironmentStatus;
  executedTestCases: ITestCase[];
  executionFindings: IFaultFinding[];
  evidenceList: IFindingEvidence[];
  logs: string[];
}

export class SandboxRunner {
  private static cachedStatus: ISandboxEnvironmentStatus | null = null;
  private static lastCheckTime = 0;

  /**
   * Safe check for Docker engine availability on host system.
   * Cached for 60 seconds to avoid unnecessary process spawns.
   */
  public static async checkEnvironment(): Promise<ISandboxEnvironmentStatus> {
    const now = Date.now();
    if (this.cachedStatus && now - this.lastCheckTime < 60000) {
      return this.cachedStatus;
    }

    const defaultLimits = {
      cpuLimit: '1.0',
      memoryLimit: '1024m',
      timeoutSeconds: 120,
      networkRestricted: true,
      nonRoot: true,
    };

    try {
      const { stdout } = await execAsync('docker', ['--version'], { timeout: 3000 });
      const version = stdout.trim();

      // Quick ping to daemon to confirm it's actually running
      try {
        await execAsync('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 4000 });
        this.cachedStatus = {
          isAvailable: true,
          runtimeType: 'docker',
          version,
          securityProfile: 'Docker available; execution requires explicit operator opt-in',
          resourceLimits: defaultLimits,
        };
      } catch (daemonErr: any) {
        this.cachedStatus = {
          isAvailable: false,
          runtimeType: 'docker',
          version,
          securityProfile: 'Docker CLI detected but Docker daemon is not running',
          reason: 'Docker CLI is installed, but the Docker daemon service is stopped or unreachable.',
          remediation: 'Start Docker Desktop or the system docker service (systemctl start docker) to enable containerized testing.',
          resourceLimits: defaultLimits,
        };
      }
    } catch {
      this.cachedStatus = {
        isAvailable: false,
        runtimeType: 'none',
        securityProfile: 'Host sandbox isolation enforcement',
        reason: 'Docker container runtime was not found on the host machine. Direct host execution of untrusted submitted code is strictly disabled to prevent remote code execution or file system compromise.',
        remediation: 'Install Docker Desktop or Docker Engine on the host machine. Exapro strictly requires containerization to execute untrusted code safely.',
        resourceLimits: defaultLimits,
      };
    }

    this.lastCheckTime = now;
    return this.cachedStatus;
  }

  /**
   * Execute test suite in isolated environment or record honest blocked state.
   */
  public static async executeTests(
    projectId: string,
    extractedDir: string,
    analysis: AnalysisResult,
    plannedTests: ITestCase[],
    staticFindings: IFaultFinding[]
  ): Promise<SandboxExecutionResult> {
    const envStatus = await this.checkEnvironment();
    const updatedTestCases = plannedTests.map((tc) => ({ ...tc }));
    const executionFindings: IFaultFinding[] = [];
    const evidenceList: IFindingEvidence[] = [];
    const executionLogs: string[] = [];

    // Evaluate static configuration sanity test case
    const configSanityTest = updatedTestCases.find((tc) => tc.category === 'configuration_sanity');
    if (configSanityTest) {
      const configDefects = staticFindings.filter(
        (f) => f.category === 'configuration' || f.category === 'startup'
      );
      if (configDefects.length > 0) {
        configSanityTest.status = 'failed';
        configSanityTest.actualOutcome = `Found ${configDefects.length} configuration/startup defect(s) in project manifests: ${configDefects.map((d) => d.title).join('; ')}`;
        configSanityTest.errorDetails = configDefects.map((d) => `${d.filePath || 'manifest'}: ${d.description}`).join('\n');
      } else {
        configSanityTest.status = 'passed';
        configSanityTest.actualOutcome = 'No static configuration defects reported; dependencies not verified.';
      }
    }

    // If Docker is NOT available: DO NOT run untrusted code on the host.
    // Mark runtime tests as BLOCKED with clear honest explanation.
    if (!envStatus.isAvailable) {
      executionLogs.push(`[Sandbox] Security check: Docker runtime is unavailable (${envStatus.reason || 'Not detected'}).`);
      executionLogs.push(`[Sandbox] Host execution of submitted project "${analysis.projectName}" is strictly prevented for security.`);

      const blockedReason = `Execution testing blocked: ${envStatus.reason || 'Containerized sandbox environment is not available on host'}. Host execution was prevented for security.`;

      for (const tc of updatedTestCases) {
        if (tc.status === 'pending') {
          tc.status = 'blocked';
          tc.blockingReason = blockedReason;
          tc.actualOutcome = 'Test could not execute because safe Docker container isolation is required but unavailable on host.';
        }
      }

      // Add Informational / Warning Finding for environment blocker
      executionFindings.push({
        id: `FLT-ENV-001`,
        projectId,
        title: 'Containerized Sandbox Execution Blocked',
        description: envStatus.reason || 'Docker container runtime is not available on host. Dynamic browser testing and execution tests were blocked for host security.',
        category: 'configuration',
        severity: 'Informational',
        confidence: 'high',
        verificationStatus: 'blocked',
        stepsToReproduce: ['Inspect Exapro host environment capabilities', 'Check Docker daemon status'],
        expectedBehavior: 'Container runtime (Docker) available to spin up isolated non-root test sandboxes.',
        actualBehavior: envStatus.reason || 'Docker daemon not running on host.',
        evidence: [
          {
            id: `EVD-ENV-1`,
            type: 'log',
            title: 'Sandbox Environment Diagnostics',
            data: JSON.stringify(envStatus, null, 2),
            timestamp: new Date().toISOString(),
          },
        ],
        suggestedFix: envStatus.remediation || 'Install and start Docker to enable full automated browser and execution testing.',
        ruleId: 'ENV-DOCKER-001',
        timestamp: new Date().toISOString(),
      });

      return {
        environment: envStatus,
        executedTestCases: updatedTestCases,
        executionFindings,
        evidenceList,
        logs: executionLogs,
      };
    }

    // If Docker IS available:
    // Execute containerized test runner with resource boundaries
    try {
      const containerResult = await this.runDockerSandbox(
        projectId,
        extractedDir,
        analysis,
        updatedTestCases,
        envStatus
      );
      return containerResult;
    } catch (err: any) {
      executionLogs.push(`[Sandbox Container Error] ${err.message}`);

      for (const tc of updatedTestCases) {
        if (tc.status === 'pending') {
          tc.status = 'blocked';
          tc.blockingReason = `Container execution error: ${err.message}`;
          tc.actualOutcome = 'Container failed to initialize or execute test script.';
        }
      }

      return {
        environment: envStatus,
        executedTestCases: updatedTestCases,
        executionFindings,
        evidenceList,
        logs: executionLogs,
      };
    }
  }

  /**
   * Run containerized execution testing inside Docker container with strict constraints.
   */
  private static async runDockerSandbox(
    projectId: string,
    extractedDir: string,
    analysis: AnalysisResult,
    testCases: ITestCase[],
    envStatus: ISandboxEnvironmentStatus
  ): Promise<SandboxExecutionResult> {
    const containerName = `exapro-test-${projectId.slice(-8)}-${Date.now()}`;
    const executionLogs: string[] = [];
    const executionFindings: IFaultFinding[] = [];
    const evidenceList: IFindingEvidence[] = [];

    // Redact sensitive patterns from logs
    const sanitize = (str: string) => {
      return str
        .replace(/mongodb\+srv:\/\/[^@]+@/g, 'mongodb+srv://***:***@')
        .replace(/api[_-]?key[:=]\s*['"]?[a-zA-Z0-9_-]+['"]?/gi, 'api_key=***REDACTED***')
        .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer ***REDACTED***');
    };

    executionLogs.push(`[Docker Sandbox] Initializing secure container: ${containerName}`);
    executionLogs.push(`[Docker Sandbox] Resource limits: CPU=${envStatus.resourceLimits.cpuLimit}, Memory=${envStatus.resourceLimits.memoryLimit}, Timeout=${envStatus.resourceLimits.timeoutSeconds}s`);

    for (const tc of testCases) {
      if (tc.status !== 'pending') continue;
      if (tc.category !== 'build' && tc.category !== 'project_unit_test') {
        tc.status = 'not_tested';
        tc.actualOutcome = 'No runtime adapter implemented for this category.';
        continue;
      }
      const block = (reason: string) => {
        tc.status = 'blocked';
        tc.blockingReason = reason;
        tc.actualOutcome = reason;
      };
      if (process.env.EXAPRO_ENABLE_RUNTIME_TESTS !== '1') {
        block('Runtime execution disabled; opt in only on a dedicated isolated worker.');
        continue;
      }
      const script = tc.category === 'build' ? 'build' : 'test';
      let manifest: any;
      try { manifest = JSON.parse(fs.readFileSync(path.join(extractedDir, 'package.json'), 'utf8')); }
      catch { block('Valid root package.json required.'); continue; }
      if (typeof manifest?.scripts?.[script] !== 'string' || manifest.workspaces ||
          (script === 'test' && manifest.scripts.test.includes('no test specified'))) {
        block('Unsupported or missing root npm script.'); continue;
      }
      const deps = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
        .some(key => Object.keys(manifest[key] || {}).length > 0);
      if (deps && !fs.existsSync(path.join(extractedDir, 'package-lock.json')) &&
          !fs.existsSync(path.join(extractedDir, 'npm-shrinkwrap.json'))) {
        block('Dependency installation requires an npm lockfile.'); continue;
      }
      const name = containerName + '-' + script;
      const started = Date.now();
      const setup = deps ? 'npm ci --offline --ignore-scripts --no-audit --no-fund || exit 78; ' : '';
      const command = 'cp -R /input/. /work/ || exit 78; cd /work || exit 78; ' + setup + 'npm run ' + script;
      const args = ['run', '--rm', '--name', name, '--pull=never', '--network=none',
        '--user=1000:1000', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges',
        '--memory=1024m', '--memory-swap=1024m', '--cpus=1', '--pids-limit=100', '--log-driver=none',
        '--tmpfs', '/work:rw,nosuid,nodev,size=512m,uid=1000,gid=1000',
        '--tmpfs', '/tmp:rw,nosuid,nodev,size=256m,uid=1000,gid=1000',
        '-e', 'HOME=/tmp', '-e', 'CI=true', '-e', 'npm_config_cache=/tmp/npm-cache',
        '-v', path.resolve(extractedDir) + ':/input:ro', '-w', '/work',
        process.env.EXAPRO_NODE_RUNNER_IMAGE || 'node:20-alpine', 'sh', '-c', command];
      try {
        await execAsync('docker', args, { timeout: 120000, maxBuffer: 256 * 1024 });
        tc.status = 'passed'; tc.exitCode = 0;
        tc.actualOutcome = 'Root npm ' + script + ' script exited with code 0.';
      } catch (err: any) {
        const code = typeof err.code === 'number' ? err.code : undefined;
        if (code === undefined || code === 78 || code >= 125 || err.killed) {
          block('Container setup, offline dependencies or resource limits prevented verification.');
        } else {
          tc.status = 'failed'; tc.exitCode = code;
          tc.actualOutcome = 'Root npm ' + script + ' script exited with code ' + code + '.';
        }
      } finally {
        tc.durationMs = Date.now() - started;
        executionLogs.push(tc.name + ': ' + tc.status);
        try { await execAsync('docker', ['rm', '-f', name], { timeout: 5000 }); } catch { /* already removed */ }
      }
    }

    return {
      environment: envStatus,
      executedTestCases: testCases,
      executionFindings,
      evidenceList,
      logs: executionLogs,
    };
  }
}
