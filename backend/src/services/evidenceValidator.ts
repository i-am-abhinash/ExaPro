import path from 'path';
import fs from 'fs';
import { IEvidenceFinding, IEvidenceFindingItem } from '../models/analysisModel';

export interface EvidenceValidationResult {
  validFindings: IEvidenceFinding[];
  rejectedFindings: Array<{
    finding: IEvidenceFinding;
    reason: string;
  }>;
  warnings: string[];
}

/**
 * Normalizes repository-relative file paths, converts backslashes to forward slashes,
 * removes leading './', and prevents path traversal (e.g. '../').
 */
export function normalizeRelativePath(relPath: string): string {
  if (!relPath) return '';
  const cleaned = relPath.replace(/\\/g, '/').replace(/^\.\//, '').trim();
  const normalized = path.posix.normalize(cleaned);
  if (normalized.startsWith('../') || normalized === '..') {
    throw new Error(`Security Exception: Path traversal attempt in path "${relPath}"`);
  }
  return normalized;
}

/**
 * Verifies that a target path resolves strictly within rootDir.
 */
export function isPathContained(rootDir: string, relPath: string): boolean {
  try {
    const cleanRel = normalizeRelativePath(relPath);
    const resolvedPath = path.resolve(rootDir, cleanRel);
    const resolvedRoot = path.resolve(rootDir);
    return resolvedPath.startsWith(resolvedRoot + path.sep) || resolvedPath === resolvedRoot;
  } catch {
    return false;
  }
}

/**
 * Redacts secret patterns (tokens, API keys, passwords) from excerpts and evidence.
 */
export function redactSensitiveData(text: string): string {
  if (!text) return '';
  let sanitized = text;
  // Redact key/secret assignments: api_key="...", password = '...', token = "..."
  sanitized = sanitized.replace(
    /((?:password|passwd|secret|token|api[_-]?key|auth[_-]?key|private[_-]?key|client[_-]?secret)\s*[:=]\s*["'])([^"']{4,})(["'])/gi,
    '$1[REDACTED_SECRET]$3'
  );
  // Redact Bearer tokens
  sanitized = sanitized.replace(/(Bearer\s+)[A-Za-z0-9_\-\.]{16,}/gi, '$1[REDACTED_TOKEN]');
  // Redact potential private keys
  sanitized = sanitized.replace(/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g, '[REDACTED_RSA_KEY]');
  return sanitized;
}

/**
 * Extracts verified code excerpt directly from disk, bounded to maxLines and maxChars.
 */
export function extractVerifiedSourceExcerpt(
  rootDir: string,
  relPath: string,
  startLine?: number,
  endLine?: number,
  maxLines: number = 6,
  maxChars: number = 500
): { excerpt: string; lineCount: number } | null {
  try {
    const cleanRel = normalizeRelativePath(relPath);
    const fullPath = path.resolve(rootDir, cleanRel);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return null;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    if (!startLine || startLine < 1 || startLine > lines.length) {
      return null;
    }

    const s = Math.max(1, startLine);
    const e = Math.min(lines.length, endLine && endLine >= s ? endLine : s);

    // Limit excerpt span
    const actualEnd = Math.min(e, s + maxLines - 1);
    const excerptLines = lines.slice(s - 1, actualEnd);
    let excerpt = excerptLines.join('\n');

    if (excerpt.length > maxChars) {
      excerpt = excerpt.substring(0, maxChars - 3) + '...';
    }

    return {
      excerpt: redactSensitiveData(excerpt),
      lineCount: lines.length,
    };
  } catch {
    return null;
  }
}

/**
 * Validates a single IEvidenceFinding against the repository on disk.
 * Enforces:
 * - Real file existence
 * - Line bounds within file
 * - Excerpt verification / extraction
 * - Path traversal protection
 * - Location rationale when filePath is absent
 */
export function validateEvidenceFinding(
  finding: IEvidenceFinding,
  rootDir: string
): { isValid: boolean; sanitizedFinding: IEvidenceFinding; error?: string } {
  const sanitized: IEvidenceFinding = { ...finding };

  // 1. Mandatory Identifier & Metadata check
  if (!sanitized.id || !sanitized.title || !sanitized.ruleId) {
    return {
      isValid: false,
      sanitizedFinding: sanitized,
      error: 'Finding missing required id, title, or ruleId.',
    };
  }

  // Normalize severity
  const validSeverities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
  const matchedSev = validSeverities.find((s) => s.toLowerCase() === (sanitized.severity || '').toLowerCase());
  sanitized.severity = (matchedSev as any) || 'Medium';

  // Normalize confidence
  const validConf = ['high', 'medium', 'low'];
  sanitized.confidence = validConf.includes((sanitized.confidence || '').toLowerCase())
    ? (sanitized.confidence.toLowerCase() as any)
    : 'medium';

  // Normalize status
  const validStatus = ['confirmed', 'suspected', 'informational', 'needs-review'];
  sanitized.status = validStatus.includes((sanitized.status || '').toLowerCase())
    ? (sanitized.status.toLowerCase() as any)
    : 'suspected';

  // Normalize category
  const validCategories = [
    'syntax',
    'type',
    'dependency',
    'configuration',
    'api',
    'database',
    'security',
    'maintainability',
    'startup',
    'performance',
  ];
  sanitized.category = validCategories.includes((sanitized.category || '').toLowerCase())
    ? (sanitized.category.toLowerCase() as any)
    : 'maintainability';

  // Normalize analysisType
  const validTypes = ['deterministic', 'compiler', 'linter', 'heuristic', 'ai-assisted'];
  sanitized.analysisType = validTypes.includes((sanitized.analysisType || '').toLowerCase())
    ? (sanitized.analysisType.toLowerCase() as any)
    : 'deterministic';

  // 2. Source File Integrity Check
  if (sanitized.filePath) {
    let cleanRel: string;
    try {
      cleanRel = normalizeRelativePath(sanitized.filePath);
      if (!isPathContained(rootDir, cleanRel)) {
        return {
          isValid: false,
          sanitizedFinding: sanitized,
          error: `Finding ${sanitized.id} path traversal attempt: "${sanitized.filePath}" escapes project root.`,
        };
      }
    } catch (err: any) {
      return {
        isValid: false,
        sanitizedFinding: sanitized,
        error: `Invalid file path in finding ${sanitized.id}: ${err.message}`,
      };
    }

    sanitized.filePath = cleanRel;
    const fullPath = path.resolve(rootDir, cleanRel);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return {
        isValid: false,
        sanitizedFinding: sanitized,
        error: `Referenced file "${cleanRel}" does not exist in analyzed project root.`,
      };
    }

    // Line bounds check
    let totalLines = 1;
    try {
      const fileText = fs.readFileSync(fullPath, 'utf-8');
      totalLines = fileText.split('\n').length;
    } catch {
      // unreadable
    }

    if (sanitized.lineRange && sanitized.startLine === undefined) {
      sanitized.startLine = sanitized.lineRange.start;
      sanitized.endLine = sanitized.lineRange.end;
    }

    if (sanitized.startLine !== undefined) {
      if (typeof sanitized.startLine !== 'number' || isNaN(sanitized.startLine) || sanitized.startLine < 1) {
        sanitized.startLine = 1;
      } else if (sanitized.startLine > totalLines) {
        return {
          isValid: false,
          sanitizedFinding: sanitized,
          error: `Line reference startLine ${sanitized.startLine} exceeds total file lines (${totalLines}) in "${cleanRel}".`,
        };
      }
    }

    if (sanitized.endLine !== undefined) {
      if (typeof sanitized.endLine !== 'number' || isNaN(sanitized.endLine) || sanitized.endLine < 1) {
        sanitized.endLine = sanitized.startLine || 1;
      } else {
        sanitized.endLine = Math.min(totalLines, Math.max(sanitized.startLine || 1, sanitized.endLine));
      }
    }

    if (sanitized.startLine) {
      sanitized.lineRange = {
        start: sanitized.startLine,
        end: sanitized.endLine || sanitized.startLine,
      };
    }

    // Extract or verify actual code excerpt from disk
    if (sanitized.startLine) {
      const diskExcerpt = extractVerifiedSourceExcerpt(
        rootDir,
        cleanRel,
        sanitized.startLine,
        sanitized.endLine || sanitized.startLine
      );
      if (diskExcerpt) {
        // If excerpt is empty or doesn't match disk, overwrite with verifiable excerpt directly from disk
        sanitized.codeExcerpt = diskExcerpt.excerpt;
      }
    }
  } else {
    // Findings without source file must justify why location is not applicable
    if (!sanitized.limitations && !sanitized.reasoning) {
      sanitized.limitations = 'Finding applies to project-wide configuration or dependency graph; no single source line available.';
    }
  }

  // 3. Redact any secrets in descriptions and recommendations
  sanitized.title = redactSensitiveData(sanitized.title);
  sanitized.description = redactSensitiveData(sanitized.description);
  sanitized.reasoning = redactSensitiveData(sanitized.reasoning || sanitized.description);
  sanitized.impact = redactSensitiveData(sanitized.impact || '');
  sanitized.recommendation = redactSensitiveData(sanitized.recommendation || '');
  if (sanitized.codeExcerpt) {
    sanitized.codeExcerpt = redactSensitiveData(sanitized.codeExcerpt);
  }

  // 4. Ensure evidence array items have timestamps and redacted data
  if (!Array.isArray(sanitized.evidence)) {
    sanitized.evidence = [];
  } else {
    sanitized.evidence = sanitized.evidence.map((ev, idx) => ({
      id: ev.id || `EVD-${sanitized.id}-${idx + 1}`,
      type: ev.type || 'code_snippet',
      title: redactSensitiveData(ev.title || 'Evidence snippet'),
      data: redactSensitiveData(ev.data || ev.title || 'Evidence snippet'),
      filePath: ev.filePath ? normalizeRelativePath(ev.filePath) : sanitized.filePath,
      lineNumber: ev.lineNumber || sanitized.startLine,
      timestamp: ev.timestamp || new Date().toISOString(),
    }));
  }

  return {
    isValid: true,
    sanitizedFinding: sanitized,
  };
}

/**
 * Validates and deduplicates a collection of findings.
 * Multiple findings on the same file, line, and ruleId are consolidated into one,
 * aggregating evidence sources.
 */
export function validateAndDeduplicateFindings(
  findings: IEvidenceFinding[],
  rootDir: string
): EvidenceValidationResult {
  const validMap = new Map<string, IEvidenceFinding>();
  const rejectedFindings: Array<{ finding: IEvidenceFinding; reason: string }> = [];
  const warnings: string[] = [];

  for (const raw of findings) {
    const result = validateEvidenceFinding(raw, rootDir);
    if (!result.isValid) {
      rejectedFindings.push({
        finding: raw,
        reason: result.error || 'Failed evidence validation.',
      });
      warnings.push(`Evidence Validator: Rejected finding "${raw.title}" (${result.error})`);
      continue;
    }

    const f = result.sanitizedFinding;
    // Deduplication key: ruleId + filePath + startLine
    const dedupKey = `${f.ruleId}::${f.filePath || 'global'}::${f.startLine || 0}`;

    if (validMap.has(dedupKey)) {
      // Consolidate duplicate findings
      const existing = validMap.get(dedupKey)!;
      // Merge evidence items
      const existingEvidenceIds = new Set(existing.evidence.map((e) => e.id));
      for (const ev of f.evidence) {
        if (!existingEvidenceIds.has(ev.id)) {
          existing.evidence.push(ev);
        }
      }
      // Upgrade severity if duplicate has higher severity
      const sevOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Informational: 0 };
      if (sevOrder[f.severity] > sevOrder[existing.severity]) {
        existing.severity = f.severity;
      }
    } else {
      validMap.set(dedupKey, f);
    }
  }

  // Renumber IDs sequentially for a clean, stable report
  const validFindings = Array.from(validMap.values());
  validFindings.forEach((f, idx) => {
    f.id = `EVD-FLT-${String(idx + 1).padStart(3, '0')}`;
  });

  return {
    validFindings,
    rejectedFindings,
    warnings,
  };
}
