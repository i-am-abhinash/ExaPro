import path from 'path';
import fs from 'fs';
import ts from 'typescript';
import { IEvidenceFinding } from '../models/analysisModel';
import { IFaultFinding } from '../models/testingModel';
import {
  normalizeRelativePath,
  validateAndDeduplicateFindings,
  extractVerifiedSourceExcerpt,
  redactSensitiveData,
} from './evidenceValidator';

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
  findings: IEvidenceFinding[];
  faultFindings: IFaultFinding[]; // backwards compatibility
  totalInspectedFiles: number;
  totalChecksRun: number;
  syntaxErrorsCount: number;
  brokenImportsCount: number;
  missingDependenciesCount: number;
  configurationIssuesCount: number;
  codeQualityIssuesCount: number;
  rulesExecuted: string[];
  parseFailedFiles: string[];
}

export function performStaticDefectAnalysis(
  rootDir: string,
  allFiles: string[],
  inspectedFilePaths: string[],
  discoveredServerEndpoints?: Array<{ method: string; path: string }>
): StaticAnalysisDefectsResult {
  const rawFindings: IEvidenceFinding[] = [];
  let findingCounter = 1;
  const parseFailedFiles: string[] = [];

  const rulesExecuted = [
    'SYNTAX-TS-001',
    'SYNTAX-JSON-001',
    'IMPORT-RELATIVE-001',
    'DEP-UNDECLARED-001',
    'SEC-CONFIG-001',
    'SEC-CONFIG-002',
    'SEC-CONFIG-003',
    'STARTUP-HTML-001',
    'QUALITY-UNREACHABLE-001',
    'QUALITY-SWALLOW-001',
    'SEC-DANGEROUS-001',
    'SEC-SECRETS-001',
    'API-MISMATCH-001',
    'SEC-TLS-001',
  ];

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
      parseFailedFiles.push(packageJsonRel);
      const pkgPath = path.join(rootDir, packageJsonRel);
      const lines = fs.existsSync(pkgPath) ? fs.readFileSync(pkgPath, 'utf-8').split('\n') : [];
      rawFindings.push({
        id: `RAW-${findingCounter++}`,
        title: 'Malformed package.json Manifest',
        description: `package.json contains invalid JSON syntax: ${err.message}`,
        severity: 'Critical',
        confidence: 'high',
        status: 'confirmed',
        category: 'configuration',
        analysisType: 'compiler',
        filePath: packageJsonRel,
        startLine: 1,
        endLine: Math.min(lines.length || 1, 5),
        startColumn: 1,
        codeExcerpt: lines.slice(0, 5).join('\n'),
        ruleId: 'SEC-CONFIG-001',
        evidence: [
          {
            id: `EVD-PKG-JSON`,
            type: 'log',
            title: 'JSON Parse Exception',
            data: err.message,
            filePath: packageJsonRel,
            lineNumber: 1,
            timestamp: new Date().toISOString(),
          },
        ],
        reasoning: 'The root package.json file is unparseable according to RFC 8259 JSON syntax rules, halting dependency installation and package scripts execution.',
        impact: 'Node.js package managers cannot install dependencies or execute scripts.',
        recommendation: 'Fix JSON syntax errors such as trailing commas, unescaped characters, or mismatched braces.',
      });
    }
  }

  // Check 1: Entry Point Existence in package.json
  if (hasPackageJson && packageJsonContent) {
    if (packageJsonContent.main) {
      const mainTarget = packageJsonContent.main.replace(/^\.\//, '');
      const mainExists = resolveFileExists(rootDir, mainTarget, allFileSet, lowerFileMap);
      if (!mainExists) {
        const lineRange = findKeyLineRange(rootDir, packageJsonRel || 'package.json', 'main');
        rawFindings.push({
          id: `RAW-${findingCounter++}`,
          title: `Declared Entry Point Missing: "${packageJsonContent.main}"`,
          description: `package.json defines "main": "${packageJsonContent.main}", but the file cannot be found in the repository.`,
          severity: 'High',
          confidence: 'high',
          status: 'confirmed',
          category: 'configuration',
          analysisType: 'deterministic',
          filePath: packageJsonRel,
          startLine: lineRange.start,
          endLine: lineRange.end,
          codeExcerpt: `"main": "${packageJsonContent.main}"`,
          ruleId: 'SEC-CONFIG-002',
          evidence: [
            {
              id: `EVD-MAIN-MISSING`,
              type: 'code_snippet',
              title: 'package.json entry point reference',
              data: `"main": "${packageJsonContent.main}"`,
              filePath: packageJsonRel,
              lineNumber: lineRange.start,
              timestamp: new Date().toISOString(),
            },
          ],
          reasoning: 'When this package is imported as a library or executed as a service, the module loader will fail with MODULE_NOT_FOUND.',
          impact: 'Application startup or external imports will fail at runtime.',
          recommendation: `Update "main" in package.json to point to an existing entry point or build target.`,
        });
      }
    }

    // Check 1B: Package scripts target resolution
    if (packageJsonContent.scripts && typeof packageJsonContent.scripts === 'object') {
      for (const [scriptName, scriptCmd] of Object.entries(packageJsonContent.scripts)) {
        if (typeof scriptCmd === 'string') {
          // Detect simple node file invocations: node index.js or node server/app.js
          const nodeMatch = scriptCmd.match(/^node\s+([a-zA-Z0-9_\-\.\/]+)/);
          if (nodeMatch) {
            const targetFile = nodeMatch[1].replace(/^\.\//, '');
            // Only check if it's not a build artifact like dist/ or build/
            if (!targetFile.startsWith('dist/') && !targetFile.startsWith('build/') && !targetFile.startsWith('.next/')) {
              const scriptExists = resolveFileExists(rootDir, targetFile, allFileSet, lowerFileMap);
              if (!scriptExists) {
                const lineRange = findKeyLineRange(rootDir, packageJsonRel || 'package.json', scriptName);
                rawFindings.push({
                  id: `RAW-${findingCounter++}`,
                  title: `Package Script Target Missing: "${scriptName}"`,
                  description: `Script "${scriptName}" executes "node ${targetFile}", but "${targetFile}" does not exist in repository files.`,
                  severity: 'Medium',
                  confidence: 'high',
                  status: 'confirmed',
                  category: 'configuration',
                  analysisType: 'deterministic',
                  filePath: packageJsonRel,
                  startLine: lineRange.start,
                  endLine: lineRange.end,
                  codeExcerpt: `"${scriptName}": "${scriptCmd}"`,
                  ruleId: 'SEC-CONFIG-003',
                  evidence: [
                    {
                      id: `EVD-SCRIPT-${scriptName}`,
                      type: 'code_snippet',
                      title: 'Invalid script declaration',
                      data: `"${scriptName}": "${scriptCmd}"`,
                      filePath: packageJsonRel,
                      lineNumber: lineRange.start,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                  reasoning: `Executing npm run ${scriptName} will immediately throw error: Cannot find module '${targetFile}'.`,
                  impact: `Developers or CI/CD pipelines running this script will encounter execution failure.`,
                  recommendation: `Update script "${scriptName}" to target a valid existing source or build output file.`,
                });
              }
            }
          }
        }
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
            rawFindings.push({
              id: `RAW-${findingCounter++}`,
              title: `HTML Missing Script Reference: "${srcAttr}"`,
              description: `index.html references script "${srcAttr}" which does not exist in the project files.`,
              severity: 'Critical',
              confidence: 'high',
              status: 'confirmed',
              category: 'startup',
              analysisType: 'deterministic',
              filePath: indexHtmlRel,
              startLine: lineNum,
              endLine: lineNum,
              codeExcerpt: match[0],
              ruleId: 'STARTUP-HTML-001',
              evidence: [
                {
                  id: `EVD-HTML-SCRIPT`,
                  type: 'code_snippet',
                  title: 'index.html script tag',
                  data: match[0],
                  filePath: indexHtmlRel,
                  lineNumber: lineNum,
                  timestamp: new Date().toISOString(),
                },
              ],
              reasoning: 'Browser and bundlers will encounter 404 Not Found loading the primary bundle script, resulting in a blank page.',
              impact: 'Application fails to mount in the browser.',
              recommendation: `Ensure "${cleanSrc}" exists or update the script src attribute in index.html.`,
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

  const clientFetchCalls: Array<{ path: string; line: number; file: string }> = [];

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
        parseFailedFiles.push(relFile);
        let errLine = 1;
        let errCol = 1;
        const lineMatch = err.message.match(/line (\d+)/i) || err.message.match(/position (\d+)/i);
        if (lineMatch) {
          errLine = Math.min(parseInt(lineMatch[1], 10) || 1, lines.length);
        }
        rawFindings.push({
          id: `RAW-${findingCounter++}`,
          title: `JSON Syntax Error in ${path.basename(relFile)}`,
          description: `Failed to parse ${relFile}: ${err.message}`,
          severity: 'High',
          confidence: 'high',
          status: 'confirmed',
          category: 'syntax',
          analysisType: 'compiler',
          filePath: relFile,
          startLine: errLine,
          endLine: errLine,
          startColumn: errCol,
          codeExcerpt: lines[errLine - 1] || content.slice(0, 150),
          ruleId: 'SYNTAX-JSON-001',
          evidence: [
            {
              id: `EVD-JSON-${errLine}`,
              type: 'code_snippet',
              title: 'Invalid JSON line excerpt',
              data: lines[errLine - 1] || content.slice(0, 150),
              filePath: relFile,
              lineNumber: errLine,
              timestamp: new Date().toISOString(),
            },
          ],
          reasoning: 'JSON files must conform strictly to RFC 8259 syntax specifications.',
          impact: 'Any reader or loader parsing this configuration file will encounter unhandled SyntaxError.',
          recommendation: 'Fix JSON syntax issues (unescaped quotes, trailing commas, or missing brackets).',
        });
      }
      continue;
    }

    // Check 3B: TypeScript / JavaScript AST Compiler Diagnostics
    if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
      const isTs = ext === '.ts' || ext === '.tsx';
      const isJsx = ext === '.tsx' || ext === '.jsx';

      try {
        const sourceFile = ts.createSourceFile(
          relFile,
          content,
          ts.ScriptTarget.Latest,
          true,
          isJsx ? ts.ScriptKind.TSX : isTs ? ts.ScriptKind.TS : ts.ScriptKind.JS
        );

        // Compiler syntax parse diagnostics
        const parseDiagnostics = (sourceFile as any).parseDiagnostics;
        if (Array.isArray(parseDiagnostics) && parseDiagnostics.length > 0) {
          parseFailedFiles.push(relFile);
          for (const diag of parseDiagnostics.slice(0, 3)) { // limit per file to avoid report saturation
            const pos = diag.start !== undefined ? sourceFile.getLineAndCharacterOfPosition(diag.start) : { line: 0, character: 0 };
            const lineNum = pos.line + 1;
            const colNum = pos.character + 1;
            const msgText = ts.flattenDiagnosticMessageText(diag.messageText, ' ');

            rawFindings.push({
              id: `RAW-${findingCounter++}`,
              title: `TypeScript/JavaScript Syntax Diagnostic: TS${diag.code}`,
              description: `Compiler parse error in ${relFile}:${lineNum}:${colNum}: ${msgText}`,
              severity: 'Critical',
              confidence: 'high',
              status: 'confirmed',
              category: 'syntax',
              analysisType: 'compiler',
              filePath: relFile,
              startLine: lineNum,
              endLine: lineNum,
              startColumn: colNum,
              codeExcerpt: lines[lineNum - 1] || '',
              ruleId: 'SYNTAX-TS-001',
              evidence: [
                {
                  id: `EVD-SYNTAX-${lineNum}`,
                  type: 'code_snippet',
                  title: `Syntax Diagnostic TS${diag.code}`,
                  data: lines[lineNum - 1] || '',
                  filePath: relFile,
                  lineNumber: lineNum,
                  timestamp: new Date().toISOString(),
                },
              ],
              reasoning: `TypeScript compiler parser failed to build AST: ${msgText}`,
              impact: 'Compilation, type checking, and bundling will fail for this module.',
              recommendation: 'Resolve compiler syntax diagnostic at the reported line and column.',
            });
          }
        }

        // AST Traversal Checks
        function inspectAstNode(node: ts.Node) {
          // Rule: QUALITY-UNREACHABLE-001
          if (ts.isBlock(node)) {
            let reachedTermination = false;
            let terminatingStatement: ts.Statement | null = null;
            for (const stmt of node.statements) {
              if (reachedTermination) {
                const pos = sourceFile.getLineAndCharacterOfPosition(stmt.getStart(sourceFile));
                const lineNum = pos.line + 1;
                rawFindings.push({
                  id: `RAW-${findingCounter++}`,
                  title: 'Unreachable Code Detected',
                  description: `Statement at line ${lineNum} appears after an unconditional return, throw, or exit statement.`,
                  severity: 'Low',
                  confidence: 'high',
                  status: 'confirmed',
                  category: 'maintainability',
                  analysisType: 'compiler',
                  filePath: relFile,
                  startLine: lineNum,
                  endLine: lineNum,
                  codeExcerpt: stmt.getText(sourceFile).slice(0, 100),
                  ruleId: 'QUALITY-UNREACHABLE-001',
                  evidence: [
                    {
                      id: `EVD-UNREACHABLE-${lineNum}`,
                      type: 'code_snippet',
                      title: 'Unreachable statement',
                      data: stmt.getText(sourceFile).slice(0, 100),
                      filePath: relFile,
                      lineNumber: lineNum,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                  reasoning: 'Control flow cannot reach this statement under any execution path because the prior statement unconditionally transferred control.',
                  impact: 'Dead code increases maintenance burden and indicates potential logic mistakes.',
                  recommendation: 'Remove dead code or verify whether return/throw was placed prematurely.',
                });
                break; // One per block is sufficient
              }

              if (ts.isReturnStatement(stmt) || ts.isThrowStatement(stmt)) {
                reachedTermination = true;
                terminatingStatement = stmt;
              } else if (ts.isExpressionStatement(stmt)) {
                const text = stmt.expression.getText(sourceFile);
                if (text.startsWith('process.exit(')) {
                  reachedTermination = true;
                  terminatingStatement = stmt;
                }
              }
            }
          }

          // Rule: QUALITY-SWALLOW-001 (Empty Catch Block)
          if (ts.isCatchClause(node)) {
            if (node.block.statements.length === 0) {
              const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
              const lineNum = pos.line + 1;
              rawFindings.push({
                id: `RAW-${findingCounter++}`,
                title: 'Empty Catch Block (Silent Error Swallowing)',
                description: `A catch clause at line ${lineNum} catches exceptions but contains no statements.`,
                severity: 'Low',
                confidence: 'high',
                status: 'confirmed',
                category: 'maintainability',
                analysisType: 'compiler',
                filePath: relFile,
                startLine: lineNum,
                endLine: lineNum + 1,
                codeExcerpt: node.getText(sourceFile).slice(0, 100),
                ruleId: 'QUALITY-SWALLOW-001',
                evidence: [
                  {
                    id: `EVD-CATCH-${lineNum}`,
                    type: 'code_snippet',
                    title: 'Empty catch clause',
                    data: node.getText(sourceFile).slice(0, 100),
                    filePath: relFile,
                    lineNumber: lineNum,
                    timestamp: new Date().toISOString(),
                  },
                ],
                reasoning: 'Silently discarding errors deprives developers of logging or diagnostic traces during failures.',
                impact: 'Errors fail silently, making troubleshooting in production difficult.',
                recommendation: 'Add logging or appropriate fallback handling inside the catch block.',
              });
            }
          }

          // Rule: SEC-DANGEROUS-001 (eval or dangerouslySetInnerHTML)
          if (ts.isCallExpression(node)) {
            const exprText = node.expression.getText(sourceFile);
            if (exprText === 'eval') {
              const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
              const lineNum = pos.line + 1;
              rawFindings.push({
                id: `RAW-${findingCounter++}`,
                title: 'Use of eval() Dynamic Code Execution',
                description: `eval() executed at line ${lineNum}. Dynamic code execution risks arbitrary script injection (XSS / RCE).`,
                severity: 'High',
                confidence: 'high',
                status: 'confirmed',
                category: 'security',
                analysisType: 'compiler',
                filePath: relFile,
                startLine: lineNum,
                endLine: lineNum,
                codeExcerpt: node.getText(sourceFile).slice(0, 100),
                ruleId: 'SEC-DANGEROUS-001',
                evidence: [
                  {
                    id: `EVD-EVAL-${lineNum}`,
                    type: 'code_snippet',
                    title: 'eval() invocation',
                    data: node.getText(sourceFile).slice(0, 100),
                    filePath: relFile,
                    lineNumber: lineNum,
                    timestamp: new Date().toISOString(),
                  },
                ],
                reasoning: 'eval() executes arbitrary strings as code within caller scope, creating significant injection attack surfaces.',
                impact: 'Untrusted input passed to eval may lead to remote code execution.',
                recommendation: 'Refactor dynamic string evaluation to use standard data structures, JSON.parse, or explicit mappings.',
              });
            }
          }

          if (ts.isJsxAttribute(node)) {
            if (node.name.getText(sourceFile) === 'dangerouslySetInnerHTML') {
              const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
              const lineNum = pos.line + 1;
              rawFindings.push({
                id: `RAW-${findingCounter++}`,
                title: 'Use of dangerouslySetInnerHTML',
                description: `Component uses dangerouslySetInnerHTML at line ${lineNum}, bypassing React built-in XSS protections.`,
                severity: 'Medium',
                confidence: 'high',
                status: 'confirmed',
                category: 'security',
                analysisType: 'compiler',
                filePath: relFile,
                startLine: lineNum,
                endLine: lineNum,
                codeExcerpt: node.getText(sourceFile).slice(0, 120),
                ruleId: 'SEC-DANGEROUS-001',
                evidence: [
                  {
                    id: `EVD-JSX-DANGEROUS-${lineNum}`,
                    type: 'code_snippet',
                    title: 'dangerouslySetInnerHTML attribute',
                    data: node.getText(sourceFile).slice(0, 120),
                    filePath: relFile,
                    lineNumber: lineNum,
                    timestamp: new Date().toISOString(),
                  },
                ],
                reasoning: 'Directly injecting unsanitized HTML into the DOM permits Cross-Site Scripting (XSS).',
                impact: 'May permit script injection if injected content incorporates user input.',
                recommendation: 'Sanitize HTML with DOMPurify before rendering or use safe React JSX child components.',
              });
            }
          }

          // Rule: SEC-SECRETS-001 (Heuristic: Suspicious Hardcoded Credentials)
          if (ts.isVariableDeclaration(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
            const varName = node.name.getText(sourceFile);
            const val = node.initializer.text;
            if (
              /(api_?key|auth_?token|jwt_?secret|private_?key|client_?secret)/i.test(varName) &&
              val.length >= 18 &&
              !val.startsWith('http') &&
              !val.includes(' ') &&
              !val.startsWith('process.env')
            ) {
              const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
              const lineNum = pos.line + 1;
              rawFindings.push({
                id: `RAW-${findingCounter++}`,
                title: `Suspected Hardcoded Secret: "${varName}"`,
                description: `Variable "${varName}" at line ${lineNum} appears to contain a hardcoded credential or token.`,
                severity: 'High',
                confidence: 'medium',
                status: 'suspected',
                category: 'security',
                analysisType: 'heuristic',
                filePath: relFile,
                startLine: lineNum,
                endLine: lineNum,
                codeExcerpt: `const ${varName} = "[REDACTED_CREDENTIAL]";`,
                ruleId: 'SEC-SECRETS-001',
                evidence: [
                  {
                    id: `EVD-SECRET-${lineNum}`,
                    type: 'code_snippet',
                    title: 'Suspected secret variable declaration',
                    data: `const ${varName} = "[REDACTED_CREDENTIAL]";`,
                    filePath: relFile,
                    lineNumber: lineNum,
                    timestamp: new Date().toISOString(),
                  },
                ],
                reasoning: 'Hardcoding authentication tokens or API keys in source repositories permits credential extraction from git history or frontend bundles.',
                impact: 'Exposed credentials can compromise external services or databases.',
                recommendation: 'Move credentials into environment variables (process.env) and add .env to .gitignore.',
                limitations: 'Heuristic pattern detection; verify whether value is a dummy/mock test token or active credential.',
              });
            }
          }

          ts.forEachChild(node, inspectAstNode);
        }

        ts.forEachChild(sourceFile, inspectAstNode);
      } catch (err: any) {
        parseFailedFiles.push(relFile);
      }

      // Check 3C: Local and Package Imports
      const dirOfFile = path.dirname(relFile).replace(/\\/g, '/');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // Relative imports
        const relativeMatch =
          line.match(/from\s+['"](\.[^'"]+)['"]/i) ||
          line.match(/import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/i) ||
          line.match(/require\s*\(\s*['"](\.[^'"]+)['"]\s*\)/i);

        if (relativeMatch) {
          const importPath = relativeMatch[1];
          const resolvedRel = path.posix.normalize(path.posix.join(dirOfFile, importPath));
          const exists = resolveFileExists(rootDir, resolvedRel, allFileSet, lowerFileMap);

          if (!exists) {
            rawFindings.push({
              id: `RAW-${findingCounter++}`,
              title: `Broken Relative Import: "${importPath}"`,
              description: `Module "${relFile}" attempts to import "${importPath}", but no matching file exists on disk.`,
              severity: 'High',
              confidence: 'high',
              status: 'confirmed',
              category: 'dependency',
              analysisType: 'deterministic',
              filePath: relFile,
              startLine: lineNum,
              endLine: lineNum,
              codeExcerpt: line.trim(),
              ruleId: 'IMPORT-RELATIVE-001',
              evidence: [
                {
                  id: `EVD-IMPORT-${lineNum}`,
                  type: 'code_snippet',
                  title: 'Broken import statement',
                  data: line.trim(),
                  filePath: relFile,
                  lineNumber: lineNum,
                  timestamp: new Date().toISOString(),
                },
              ],
              reasoning: `Target path "${resolvedRel}" cannot be resolved against existing repository files.`,
              impact: 'Module bundler or runtime loader will throw MODULE_NOT_FOUND.',
              recommendation: `Check if file was renamed, verify relative path, or create "${resolvedRel}".`,
            });
          }
        }

        // Package imports
        if (hasPackageJson && declaredDependencies.size > 0) {
          const packageMatch =
            line.match(/from\s+['"]([a-zA-Z0-9@][^'"\.\/][^'"]*)['"]/i) ||
            line.match(/require\s*\(\s*['"]([a-zA-Z0-9@][^'"\.\/][^'"]*)['"]\s*\)/i);

          if (packageMatch) {
            const rawPkg = packageMatch[1];
            const pkgName = rawPkg.startsWith('@')
              ? rawPkg.split('/').slice(0, 2).join('/')
              : rawPkg.split('/')[0];

            if (!NODE_BUILTIN_MODULES.has(pkgName) && !declaredDependencies.has(pkgName)) {
              if (!pkgName.startsWith('@/') && !pkgName.startsWith('~/')) {
                rawFindings.push({
                  id: `RAW-${findingCounter++}`,
                  title: `Undeclared Dependency Imported: "${pkgName}"`,
                  description: `File ${relFile} imports module "${pkgName}", but it is not declared in package.json dependencies.`,
                  severity: 'Medium',
                  confidence: 'high',
                  status: 'confirmed',
                  category: 'dependency',
                  analysisType: 'deterministic',
                  filePath: relFile,
                  startLine: lineNum,
                  endLine: lineNum,
                  codeExcerpt: line.trim(),
                  ruleId: 'DEP-UNDECLARED-001',
                  evidence: [
                    {
                      id: `EVD-DEP-${pkgName}`,
                      type: 'code_snippet',
                      title: 'Undeclared package import line',
                      data: line.trim(),
                      filePath: relFile,
                      lineNumber: lineNum,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                  reasoning: 'External npm modules must be declared in package.json dependencies to guarantee reproducible builds across developer machines and CI.',
                  impact: 'Builds will fail in clean environments where node_modules is installed from scratch.',
                  recommendation: `Add "${pkgName}" to dependencies in package.json.`,
                });
              }
            }
          }
        }

        // Client HTTP fetch calls collection for API contract check
        const fetchMatch = line.match(/(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*['"`](\/api\/[a-zA-Z0-9_\-\/]+)['"`]/i);
        if (fetchMatch) {
          clientFetchCalls.push({
            path: fetchMatch[1],
            line: lineNum,
            file: relFile,
          });
        }

        // Plaintext HTTP URLs
        const httpMatch = line.match(/https?:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^'"`\s]+/i);
        if (httpMatch && httpMatch[0].startsWith('http://')) {
          rawFindings.push({
            id: `RAW-${findingCounter++}`,
            title: `Insecure Plaintext HTTP URL Reference`,
            description: `Found plaintext HTTP URL "${httpMatch[0]}" at line ${lineNum}.`,
            severity: 'Low',
            confidence: 'medium',
            status: 'suspected',
            category: 'security',
            analysisType: 'heuristic',
            filePath: relFile,
            startLine: lineNum,
            endLine: lineNum,
            codeExcerpt: line.trim(),
            ruleId: 'SEC-TLS-001',
            evidence: [
              {
                id: `EVD-HTTP-${lineNum}`,
                type: 'code_snippet',
                title: 'Insecure URL excerpt',
                data: line.trim(),
                filePath: relFile,
                lineNumber: lineNum,
                timestamp: new Date().toISOString(),
              },
            ],
            reasoning: 'Transmission over plaintext HTTP lacks encryption and integrity verification, exposing traffic to Man-In-The-Middle inspection.',
            impact: 'May trigger mixed content warnings in browsers or allow network eavesdropping.',
            recommendation: 'Upgrade endpoint protocol to "https://".',
          });
        }
      }
    }

    // Check 3D: Python Import Verification
    if (ext === '.py') {
      const dirOfFile = path.dirname(relFile).replace(/\\/g, '/');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;

        // from .foo import bar
        const pyRelMatch = trimmed.match(/^from\s+\.([a-zA-Z0-9_]+)\s+import/i);
        if (pyRelMatch) {
          const modName = pyRelMatch[1];
          const targetPy = path.posix.join(dirOfFile, `${modName}.py`);
          const targetDirInit = path.posix.join(dirOfFile, modName, '__init__.py');
          if (!allFileSet.has(targetPy) && !allFileSet.has(targetDirInit)) {
            rawFindings.push({
              id: `RAW-${findingCounter++}`,
              title: `Python Broken Relative Import: ".${modName}"`,
              description: `Module "${relFile}" attempts to import ".${modName}", but no matching Python file or package exists.`,
              severity: 'High',
              confidence: 'high',
              status: 'confirmed',
              category: 'dependency',
              analysisType: 'deterministic',
              filePath: relFile,
              startLine: lineNum,
              endLine: lineNum,
              codeExcerpt: trimmed,
              ruleId: 'IMPORT-RELATIVE-001',
              evidence: [
                {
                  id: `EVD-PY-IMPORT-${lineNum}`,
                  type: 'code_snippet',
                  title: 'Python relative import line',
                  data: trimmed,
                  filePath: relFile,
                  lineNumber: lineNum,
                  timestamp: new Date().toISOString(),
                },
              ],
              reasoning: `Python module loader will raise ModuleNotFoundError: No module named '${modName}'.`,
              impact: 'Python service will fail on module load.',
              recommendation: `Verify module path or create "${targetPy}".`,
            });
          }
        }
      }
    }
  }

  // Check 4: Frontend / Backend API Contract Mismatches
  let effectiveServerEndpoints = discoveredServerEndpoints ? [...discoveredServerEndpoints] : [];
  if (effectiveServerEndpoints.length === 0 && clientFetchCalls.length > 0) {
    for (const relFile of filesToInspect) {
      if (!['.js', '.ts', '.jsx', '.tsx', '.py'].includes(path.extname(relFile).toLowerCase())) continue;
      try {
        const full = path.resolve(rootDir, relFile);
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          const txt = fs.readFileSync(full, 'utf-8');
          const expressMatches = txt.matchAll(/(?:router|app)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g);
          for (const m of expressMatches) {
            effectiveServerEndpoints.push({ method: m[1].toUpperCase(), path: m[2] });
          }
          const pyMatches = txt.matchAll(/@(?:app|router)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g);
          for (const m of pyMatches) {
            effectiveServerEndpoints.push({ method: m[1].toUpperCase(), path: m[2] });
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (effectiveServerEndpoints.length > 0 && clientFetchCalls.length > 0) {
    const serverPathSet = new Set(
      effectiveServerEndpoints.map((ep) => ep.path.toLowerCase().replace(/\/$/, ''))
    );

    for (const call of clientFetchCalls) {
      const cleanCallPath = call.path.toLowerCase().replace(/\/$/, '');
      // Check if server endpoints include this path or parameter pattern
      const hasMatch = Array.from(serverPathSet).some((sp) => {
        if (sp === cleanCallPath) return true;
        // Regex match for parameterized routes like /api/users/:id or /api/users/{id}
        const pattern = sp.replace(/:[a-zA-Z0-9_]+/g, '[^/]+').replace(/\{[a-zA-Z0-9_]+\}/g, '[^/]+');
        return new RegExp(`^${pattern}$`).test(cleanCallPath);
      });

      if (!hasMatch) {
        rawFindings.push({
          id: `RAW-${findingCounter++}`,
          title: `API Route Mismatch: Client Calls Undefined Endpoint "${call.path}"`,
          description: `Frontend module "${call.file}" makes HTTP request to "${call.path}", but no matching route handler is declared in backend controllers.`,
          severity: 'Medium',
          confidence: 'medium',
          status: 'suspected',
          category: 'api',
          analysisType: 'deterministic',
          filePath: call.file,
          startLine: call.line,
          endLine: call.line,
          codeExcerpt: `fetch("${call.path}")`,
          ruleId: 'API-MISMATCH-001',
          evidence: [
            {
              id: `EVD-API-MISMATCH-${call.line}`,
              type: 'code_snippet',
              title: 'Frontend API request',
              data: `fetch("${call.path}")`,
              filePath: call.file,
              lineNumber: call.line,
              timestamp: new Date().toISOString(),
            },
          ],
          reasoning: 'The client requests a backend path that was not discovered in server route manifests or router definitions.',
          impact: 'Client request will likely receive HTTP 404 Not Found at runtime.',
          recommendation: `Implement matching route handler in backend server or update frontend request URL.`,
          limitations: 'Dynamic routing or proxy middleware may forward this route externally.',
        });
      }
    }
  }

  // Pass all raw findings through the strict Evidence Validator
  const validationResult = validateAndDeduplicateFindings(rawFindings, rootDir);
  const validatedFindings = validationResult.validFindings;

  // Convert to backwards-compatible IFaultFinding format
  const faultFindings = convertEvidenceToFaultFindings(validatedFindings);

  return {
    findings: validatedFindings,
    faultFindings,
    totalInspectedFiles: filesToInspect.length,
    totalChecksRun: filesToInspect.length * rulesExecuted.length,
    syntaxErrorsCount: validatedFindings.filter((f) => f.ruleId.startsWith('SYNTAX')).length,
    brokenImportsCount: validatedFindings.filter((f) => f.ruleId.startsWith('IMPORT')).length,
    missingDependenciesCount: validatedFindings.filter((f) => f.ruleId.startsWith('DEP')).length,
    configurationIssuesCount: validatedFindings.filter((f) => f.category === 'configuration').length,
    codeQualityIssuesCount: validatedFindings.filter((f) => f.category === 'maintainability' || f.category === 'security').length,
    rulesExecuted,
    parseFailedFiles: Array.from(new Set(parseFailedFiles)),
  };
}

export function convertEvidenceToFaultFindings(
  evidenceFindings: IEvidenceFinding[],
  projectId: string = ''
): IFaultFinding[] {
  return evidenceFindings.map((ef) => ({
    id: ef.id,
    projectId,
    title: ef.title,
    description: ef.description,
    category:
      ef.category === 'syntax' || ef.category === 'maintainability'
        ? 'static_analysis'
        : ef.category === 'startup'
        ? 'startup'
        : ef.category === 'api'
        ? 'api'
        : ef.category === 'security'
        ? 'security'
        : 'configuration',
    severity: ef.severity,
    confidence: ef.confidence,
    verificationStatus: ef.status === 'confirmed' ? 'confirmed' : 'potential',
    filePath: ef.filePath,
    lineRange: ef.startLine ? { start: ef.startLine, end: ef.endLine || ef.startLine } : undefined,
    affectedRouteOrEndpoint: ef.filePath,
    stepsToReproduce: [
      `Open file "${ef.filePath || 'manifest'}" at line ${ef.startLine || 1}`,
      `Review diagnostic rule ${ef.ruleId}: ${ef.title}`,
    ],
    expectedBehavior: ef.recommendation,
    actualBehavior: ef.reasoning,
    evidence: ef.evidence.map((ev) => ({
      id: ev.id,
      type: ev.type as any,
      title: ev.title,
      data: ev.data || ev.title || 'Verified evidence snippet',
      filePath: ev.filePath,
      lineNumber: ev.lineNumber,
      timestamp: ev.timestamp,
    })),
    suggestedFix: ef.recommendation,
    ruleId: ef.ruleId,
    timestamp: new Date().toISOString(),
  }));
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
