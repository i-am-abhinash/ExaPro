import path from 'path';
import fs from 'fs';
import { IFaultFinding, IFindingEvidence } from '../models/testingModel';

const NODE_BUILTIN_MODULES = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain', 'events', 'fs', 'fs/promises',
  'http', 'http2', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
  'process', 'punycode', 'querystring', 'readline', 'repl', 'stream', 'stream/promises',
  'stream/web', 'string_decoder', 'test', 'timers', 'timers/promises', 'tls', 'trace_events',
  'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
]);

const PYTHON_BUILTIN_MODULES = new Set([
  'os', 'sys', 'time', 'datetime', 'json', 're', 'math', 'random', 'typing',
  'pathlib', 'collections', 'itertools', 'functools', 'logging', 'subprocess',
  'threading', 'asyncio', 'socket', 'shutil', 'tempfile', 'unittest', 'dataclasses',
  'enum', 'abc', 'copy', 'hashlib', 'io', 'uuid', 'http', 'urllib',
]);

export interface StaticAnalysisDefectsResult {
  findings: IFaultFinding[];
  totalInspectedFiles: number;
  totalChecksRun: number;
  syntaxErrorsCount: number;
  brokenImportsCount: number;
  missingDependenciesCount: number;
  configurationIssuesCount: number;
  codeQualityIssuesCount: number;
}

export function performStaticDefectAnalysis(
  rootDir: string,
  allFiles: string[],
  inspectedFilePaths: string[]
): StaticAnalysisDefectsResult {
  const findings: IFaultFinding[] = [];
  let findingCounter = 1;

  const allFileSet = new Set(allFiles.map((f) => f.replace(/\\/g, '/')));
  const lowerFileMap = new Map<string, string>();
  for (const f of allFiles) {
    lowerFileMap.set(f.replace(/\\/g, '/').toLowerCase(), f.replace(/\\/g, '/'));
  }

  // Load package.json if present
  let declaredDependencies = new Set<string>();
  let hasPackageJson = false;
  let packageJsonContent: any = null;
  const packageJsonRel = allFiles.find((f) => path.basename(f) === 'package.json');
  if (packageJsonRel) {
    try {
      const pkgPath = path.join(rootDir, packageJsonRel);
      const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
      packageJsonContent = JSON.parse(pkgRaw);
      hasPackageJson = true;
      if (packageJsonContent.dependencies) {
        Object.keys(packageJsonContent.dependencies).forEach((d) => declaredDependencies.add(d));
      }
      if (packageJsonContent.devDependencies) {
        Object.keys(packageJsonContent.devDependencies).forEach((d) => declaredDependencies.add(d));
      }
      if (packageJsonContent.peerDependencies) {
        Object.keys(packageJsonContent.peerDependencies).forEach((d) => declaredDependencies.add(d));
      }
    } catch (err: any) {
      // package.json parse error is a Critical configuration finding!
      const pkgPath = path.join(rootDir, packageJsonRel);
      const lines = fs.existsSync(pkgPath) ? fs.readFileSync(pkgPath, 'utf-8').split('\n') : [];
      findings.push({
        id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
        projectId: '',
        title: 'Malformed package.json Manifest',
        description: `package.json contains invalid JSON syntax and cannot be parsed: ${err.message}`,
        category: 'configuration',
        severity: 'Critical',
        confidence: 'high',
        verificationStatus: 'potential',
        filePath: packageJsonRel,
        lineRange: { start: 1, end: Math.min(lines.length || 1, 10) },
        stepsToReproduce: ['Inspect root package.json file syntax', 'Execute node package resolution'],
        expectedBehavior: 'package.json must be valid RFC 8259 JSON format.',
        actualBehavior: `Parser threw syntax error: ${err.message}`,
        evidence: [
          {
            id: `EVD-${Date.now()}-1`,
            type: 'log',
            title: 'JSON Parse Exception',
            data: err.message,
            filePath: packageJsonRel,
            lineNumber: 1,
            timestamp: new Date().toISOString(),
          },
        ],
        suggestedFix: 'Fix JSON syntax errors such as trailing commas, unescaped characters, or mismatched braces.',
        ruleId: 'SEC-CONFIG-001',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check 1: Entry Point Existence in package.json
  if (hasPackageJson && packageJsonContent) {
    if (packageJsonContent.main) {
      const mainTarget = packageJsonContent.main.replace(/^\.\//, '');
      const mainExists = resolveFileExists(rootDir, mainTarget, allFileSet, lowerFileMap);
      if (!mainExists) {
        findings.push({
          id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
          projectId: '',
          title: `Declared Entry Point Missing: "${packageJsonContent.main}"`,
          description: `package.json defines "main": "${packageJsonContent.main}", but the file cannot be found in the repository.`,
          category: 'configuration',
          severity: 'High',
          confidence: 'high',
          verificationStatus: 'potential',
          filePath: packageJsonRel,
          lineRange: findKeyLineRange(rootDir, packageJsonRel || 'package.json', 'main'),
          stepsToReproduce: ['Read package.json "main" attribute', `Locate target file "${packageJsonContent.main}" on disk`],
          expectedBehavior: 'The declared entry point script must exist at the specified path.',
          actualBehavior: `Target path "${packageJsonContent.main}" does not exist in repository files.`,
          evidence: [
            {
              id: `EVD-${Date.now()}-2`,
              type: 'code_snippet',
              title: 'package.json entry point reference',
              data: `"main": "${packageJsonContent.main}"`,
              filePath: packageJsonRel,
              timestamp: new Date().toISOString(),
            },
          ],
          suggestedFix: `Update "main" in package.json to point to an existing entry point or create "${packageJsonContent.main}".`,
          ruleId: 'SEC-CONFIG-002',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // Check 2: index.html entry script resolution (for Vite/SPA)
  const indexHtmlRel = allFiles.find((f) => path.basename(f) === 'index.html');
  if (indexHtmlRel) {
    try {
      const fullHtmlPath = path.join(rootDir, indexHtmlRel);
      const htmlContent = fs.readFileSync(fullHtmlPath, 'utf-8');
      const scriptMatches = htmlContent.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi);
      const htmlLines = htmlContent.split('\n');

      for (const match of scriptMatches) {
        const srcAttr = match[1];
        if (srcAttr && !srcAttr.startsWith('http://') && !srcAttr.startsWith('https://') && !srcAttr.startsWith('//')) {
          const cleanSrc = srcAttr.replace(/^\//, '').replace(/^\.\//, '');
          const scriptExists = resolveFileExists(rootDir, cleanSrc, allFileSet, lowerFileMap);
          if (!scriptExists) {
            const lineNum = findLineNumberForSubstring(htmlLines, match[0]);
            findings.push({
              id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
              projectId: '',
              title: `HTML Missing Script Reference: "${srcAttr}"`,
              description: `index.html references script "${srcAttr}" which does not exist in the project files.`,
              category: 'startup',
              severity: 'Critical',
              confidence: 'high',
              verificationStatus: 'potential',
              filePath: indexHtmlRel,
              lineRange: { start: lineNum, end: lineNum },
              stepsToReproduce: ['Inspect index.html script tags', `Check existence of file "${cleanSrc}"`],
              expectedBehavior: 'All referenced bundle or module scripts must resolve to valid files in repository.',
              actualBehavior: `Target script file "${cleanSrc}" not found on disk.`,
              evidence: [
                {
                  id: `EVD-${Date.now()}-3`,
                  type: 'code_snippet',
                  title: 'index.html script tag',
                  data: match[0],
                  filePath: indexHtmlRel,
                  lineNumber: lineNum,
                  timestamp: new Date().toISOString(),
                },
              ],
              suggestedFix: `Ensure "${cleanSrc}" is created or update the src attribute in index.html.`,
              ruleId: 'STARTUP-HTML-001',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Check 3: Deep inspection of individual source files
  const filesToInspect = inspectedFilePaths.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs', '.cjs', '.py'].includes(ext);
  });

  for (const relFile of filesToInspect) {
    const fullPath = path.join(rootDir, relFile);
    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    const ext = path.extname(relFile).toLowerCase();

    // Check 3A: JSON files validation
    if (ext === '.json') {
      try {
        JSON.parse(content);
      } catch (err: any) {
        let errLine = 1;
        const lineMatch = err.message.match(/line (\d+)/i) || err.message.match(/position (\d+)/i);
        if (lineMatch) {
          errLine = Math.min(parseInt(lineMatch[1], 10) || 1, lines.length);
        }
        findings.push({
          id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
          projectId: '',
          title: `JSON Syntax Error in ${path.basename(relFile)}`,
          description: `Failed to parse ${relFile}: ${err.message}`,
          category: 'static_analysis',
          severity: 'High',
          confidence: 'high',
          verificationStatus: 'potential',
          filePath: relFile,
          lineRange: { start: errLine, end: errLine },
          stepsToReproduce: [`Parse JSON content of ${relFile}`],
          expectedBehavior: 'JSON configuration data must be strictly valid JSON.',
          actualBehavior: err.message,
          evidence: [
            {
              id: `EVD-${Date.now()}-${findingCounter}`,
              type: 'code_snippet',
              title: 'Invalid JSON line excerpt',
              data: lines[errLine - 1] || content.slice(0, 200),
              filePath: relFile,
              lineNumber: errLine,
              timestamp: new Date().toISOString(),
            },
          ],
          suggestedFix: 'Correct the syntax issue (check for unescaped quotes, trailing commas, or missing brackets).',
          ruleId: 'SYNTAX-JSON-001',
          timestamp: new Date().toISOString(),
        });
      }
      continue;
    }

    // Check 3B: JS / TS Import Verification (Relative imports & Undeclared modules)
    if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
      const dirOfFile = path.dirname(relFile).replace(/\\/g, '/');

      // Scan import and require statements
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Skip comments
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // Relative imports: import ... from './...' or require('./...')
        const relativeMatch =
          line.match(/from\s+['"](\.[^'"]+)['"]/i) ||
          line.match(/import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/i) ||
          line.match(/require\s*\(\s*['"](\.[^'"]+)['"]\s*\)/i);

        if (relativeMatch) {
          const importPath = relativeMatch[1];
          const resolvedRel = path.posix.normalize(path.posix.join(dirOfFile, importPath));
          const exists = resolveFileExists(rootDir, resolvedRel, allFileSet, lowerFileMap);

          if (!exists) {
            findings.push({
              id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
              projectId: '',
              title: `Broken Relative Import: "${importPath}"`,
              description: `Module "${relFile}" attempts to import "${importPath}", but no matching file exists on disk.`,
              category: 'static_analysis',
              severity: 'High',
              confidence: 'high',
              verificationStatus: 'potential',
              filePath: relFile,
              lineRange: { start: lineNum, end: lineNum },
              affectedRouteOrEndpoint: relFile,
              stepsToReproduce: [`Open ${relFile} at line ${lineNum}`, `Trace import target "${importPath}"`],
              expectedBehavior: `Target file for import "${importPath}" must exist relative to ${dirOfFile}.`,
              actualBehavior: `Target "${resolvedRel}" does not exist in repository files.`,
              evidence: [
                {
                  id: `EVD-${Date.now()}-${findingCounter}`,
                  type: 'code_snippet',
                  title: 'Broken import statement',
                  data: line.trim(),
                  filePath: relFile,
                  lineNumber: lineNum,
                  timestamp: new Date().toISOString(),
                },
              ],
              suggestedFix: `Check if file was renamed, verify the relative path, or create the missing module at "${resolvedRel}".`,
              ruleId: 'IMPORT-RELATIVE-001',
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Package imports: import ... from 'package-name' or require('package-name')
        if (hasPackageJson && declaredDependencies.size > 0) {
          const packageMatch =
            line.match(/from\s+['"]([a-zA-Z0-9@][^'"\.\/][^'"]*)['"]/i) ||
            line.match(/require\s*\(\s*['"]([a-zA-Z0-9@][^'"\.\/][^'"]*)['"]\s*\)/i);

          if (packageMatch) {
            const rawPkg = packageMatch[1];
            // Extract base package name (e.g. "@scope/pkg/sub" -> "@scope/pkg", "lodash/get" -> "lodash")
            const pkgName = rawPkg.startsWith('@')
              ? rawPkg.split('/').slice(0, 2).join('/')
              : rawPkg.split('/')[0];

            if (!NODE_BUILTIN_MODULES.has(pkgName) && !declaredDependencies.has(pkgName)) {
              // Only report if it's not a root alias like @/ or ~/
              if (!pkgName.startsWith('@/') && !pkgName.startsWith('~/')) {
                findings.push({
                  id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
                  projectId: '',
                  title: `Undeclared Dependency Imported: "${pkgName}"`,
                  description: `File ${relFile} imports module "${pkgName}", but it is not declared in package.json dependencies.`,
                  category: 'configuration',
                  severity: 'Medium',
                  confidence: 'high',
                  verificationStatus: 'potential',
                  filePath: relFile,
                  lineRange: { start: lineNum, end: lineNum },
                  stepsToReproduce: [
                    `Inspect ${relFile} line ${lineNum}`,
                    `Verify "${pkgName}" presence in package.json dependencies or devDependencies`,
                  ],
                  expectedBehavior: `All imported external libraries must be explicitly declared in package.json to guarantee reproducible builds.`,
                  actualBehavior: `Package "${pkgName}" is absent from package.json manifest.`,
                  evidence: [
                    {
                      id: `EVD-${Date.now()}-${findingCounter}`,
                      type: 'code_snippet',
                      title: 'Undeclared package import line',
                      data: line.trim(),
                      filePath: relFile,
                      lineNumber: lineNum,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                  suggestedFix: `Run "npm install ${pkgName}" or add "${pkgName}" to dependencies in package.json.`,
                  ruleId: 'DEP-UNDECLARED-001',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        }

        // Check 3C: Silent Error Swallowing (empty catch blocks)
        if (
          trimmed.match(/catch\s*(\([^)]*\))?\s*\{\s*\}/) ||
          (trimmed.startsWith('catch') && i + 1 < lines.length && lines[i + 1].trim() === '}')
        ) {
          findings.push({
            id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
            projectId: '',
            title: 'Empty Catch Block (Silent Error Swallowing)',
            description: `A try/catch block at line ${lineNum} catches exceptions but performs no logging, handling, or re-throwing.`,
            category: 'static_analysis',
            severity: 'Low',
            confidence: 'high',
            verificationStatus: 'potential',
            filePath: relFile,
            lineRange: { start: lineNum, end: lineNum + 1 },
            stepsToReproduce: [`Review error handling block in ${relFile} at line ${lineNum}`],
            expectedBehavior: 'Exceptions should be logged, reported, or propagated to prevent hidden runtime failures.',
            actualBehavior: 'Exceptions are silently ignored with an empty block.',
            evidence: [
              {
                id: `EVD-${Date.now()}-${findingCounter}`,
                type: 'code_snippet',
                title: 'Empty catch block',
                data: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join('\n'),
                filePath: relFile,
                lineNumber: lineNum,
                timestamp: new Date().toISOString(),
              },
            ],
            suggestedFix: 'Add error logging (console.error) or appropriate fallback logic inside the catch block.',
            ruleId: 'QUALITY-SWALLOW-001',
            timestamp: new Date().toISOString(),
          });
        }

        // Check 3D: Hardcoded Insecure URLs (HTTP for sensitive APIs)
        const httpMatch = line.match(/https?:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^'"`\s]+/i);
        if (httpMatch && httpMatch[0].startsWith('http://')) {
          findings.push({
            id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
            projectId: '',
            title: `Insecure Plaintext HTTP URL Reference`,
            description: `Found plaintext HTTP URL "${httpMatch[0]}" at line ${lineNum}. May cause Mixed Content or Man-In-The-Middle vulnerabilities.`,
            category: 'security',
            severity: 'Low',
            confidence: 'medium',
            verificationStatus: 'potential',
            filePath: relFile,
            lineRange: { start: lineNum, end: lineNum },
            stepsToReproduce: [`Inspect network endpoint in ${relFile} at line ${lineNum}`],
            expectedBehavior: 'Remote endpoints should use TLS (https://) for encrypted transmission.',
            actualBehavior: `Uses plaintext protocol: ${httpMatch[0]}`,
            evidence: [
              {
                id: `EVD-${Date.now()}-${findingCounter}`,
                type: 'code_snippet',
                title: 'Insecure URL excerpt',
                data: line.trim(),
                filePath: relFile,
                lineNumber: lineNum,
                timestamp: new Date().toISOString(),
              },
            ],
            suggestedFix: `Upgrade endpoint protocol to "https://" if supported by destination.`,
            ruleId: 'SEC-TLS-001',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Check 3E: Python Import Checks
    if (ext === '.py') {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;

        // from .foo import bar
        const pyRelMatch = trimmed.match(/^from\s+\.([a-zA-Z0-9_]+)\s+import/i);
        if (pyRelMatch) {
          const modName = pyRelMatch[1];
          const dirOfFile = path.dirname(relFile).replace(/\\/g, '/');
          const targetRel = path.posix.join(dirOfFile, `${modName}.py`);
          const targetDir = path.posix.join(dirOfFile, modName, '__init__.py');
          const exists = allFileSet.has(targetRel) || allFileSet.has(targetDir);

          if (!exists) {
            findings.push({
              id: `FLT-STATIC-${String(findingCounter++).padStart(3, '0')}`,
              projectId: '',
              title: `Broken Python Relative Import: ".${modName}"`,
              description: `Module "${relFile}" attempts to import relative module ".${modName}", but neither "${modName}.py" nor "${modName}/__init__.py" exist.`,
              category: 'static_analysis',
              severity: 'High',
              confidence: 'high',
              verificationStatus: 'potential',
              filePath: relFile,
              lineRange: { start: lineNum, end: lineNum },
              stepsToReproduce: [`Inspect python import in ${relFile} line ${lineNum}`],
              expectedBehavior: `Relative module "${modName}" must exist in the package directory.`,
              actualBehavior: `File "${targetRel}" does not exist.`,
              evidence: [
                {
                  id: `EVD-${Date.now()}-${findingCounter}`,
                  type: 'code_snippet',
                  title: 'Broken Python import',
                  data: line.trim(),
                  filePath: relFile,
                  lineNumber: lineNum,
                  timestamp: new Date().toISOString(),
                },
              ],
              suggestedFix: `Create "${modName}.py" or verify the relative module path.`,
              ruleId: 'PY-IMPORT-001',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  // Deduplicate findings by title + filePath + lineStart
  const deduped: IFaultFinding[] = [];
  const seenKeys = new Set<string>();

  for (const f of findings) {
    const key = `${f.title}|${f.filePath || ''}|${f.lineRange?.start || 0}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduped.push(f);
    }
  }

  return {
    findings: deduped,
    totalInspectedFiles: filesToInspect.length,
    totalChecksRun: filesToInspect.length * 6,
    syntaxErrorsCount: deduped.filter((f) => f.ruleId?.startsWith('SYNTAX')).length,
    brokenImportsCount: deduped.filter((f) => f.ruleId?.startsWith('IMPORT') || f.ruleId?.startsWith('PY-IMPORT')).length,
    missingDependenciesCount: deduped.filter((f) => f.ruleId?.startsWith('DEP')).length,
    configurationIssuesCount: deduped.filter((f) => f.category === 'configuration').length,
    codeQualityIssuesCount: deduped.filter((f) => f.category === 'static_analysis' || f.category === 'security').length,
  };
}

function resolveFileExists(
  rootDir: string,
  targetRelPath: string,
  allFileSet: Set<string>,
  lowerFileMap: Map<string, string>
): boolean {
  const clean = targetRelPath.replace(/^\//, '').replace(/\\/g, '/');

  // Exact match
  if (allFileSet.has(clean)) return true;

  // Try extensions
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.html', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  for (const ext of exts) {
    if (allFileSet.has(clean + ext)) return true;
  }

  // Case-insensitive check
  const lower = clean.toLowerCase();
  if (lowerFileMap.has(lower)) return true;
  for (const ext of exts) {
    if (lowerFileMap.has(lower + ext)) return true;
  }

  // Filesystem check as fallback
  const full = path.join(rootDir, clean);
  if (fs.existsSync(full)) return true;
  for (const ext of exts) {
    if (fs.existsSync(full + ext)) return true;
  }

  return false;
}

function findKeyLineRange(rootDir: string, relFile: string, keyName: string): { start: number; end: number } {
  try {
    const content = fs.readFileSync(path.join(rootDir, relFile), 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"${keyName}"`)) {
        return { start: i + 1, end: i + 1 };
      }
    }
  } catch {
    // ignore
  }
  return { start: 1, end: 1 };
}

function findLineNumberForSubstring(lines: string[], substring: string): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(substring)) {
      return i + 1;
    }
  }
  return 1;
}
