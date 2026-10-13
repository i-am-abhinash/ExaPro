import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { TEMP_EXTRACT_DIR } from '../config/env';

const IGNORED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'out',
  'coverage',
  '.cache',
  'vendor',
  '.idea',
  '.vscode',
  '__pycache__',
]);

const IGNORED_EXTENSIONS = new Set([
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.iso',
  '.zip',
  '.tar',
  '.gz',
  '.mp4',
  '.mp3',
  '.wav',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.pdf',
  '.lock',
]);

const MAX_TOTAL_EXTRACTED_BYTES = 50 * 1024 * 1024; // 50MB max
const MAX_TOTAL_FILES = 1200;

export interface ExtractedProjectInfo {
  extractPath: string;
  rootDir: string;
  extractedFileCount: number;
}

export function extractZipSafely(zipFilePath: string, uniqueId: string): ExtractedProjectInfo {
  const targetExtractDir = path.resolve(TEMP_EXTRACT_DIR, uniqueId);
  if (!fs.existsSync(targetExtractDir)) {
    fs.mkdirSync(targetExtractDir, { recursive: true });
  }

  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  let totalExtractedBytes = 0;
  let fileCount = 0;

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    const normalizedEntryName = entry.entryName.replace(/\\/g, '/');
    const pathParts = normalizedEntryName.split('/');

    // Check if any path segment matches ignored directories
    const hasIgnoredDir = pathParts.some((part) => IGNORED_DIR_NAMES.has(part.toLowerCase()));
    if (hasIgnoredDir) continue;

    const ext = path.extname(normalizedEntryName).toLowerCase();
    if (IGNORED_EXTENSIONS.has(ext)) continue;

    // Check against Zip Slip / path traversal
    const destinationPath = path.resolve(targetExtractDir, normalizedEntryName);
    if (!destinationPath.startsWith(targetExtractDir + path.sep) && destinationPath !== targetExtractDir) {
      throw new Error(`Security Exception: Path traversal attempt detected in archive entry: ${normalizedEntryName}`);
    }

    // Protection against zip decompression bombs
    totalExtractedBytes += entry.header.size;
    if (totalExtractedBytes > MAX_TOTAL_EXTRACTED_BYTES) {
      throw new Error(`Archive exceeds maximum allowable uncompressed size (${MAX_TOTAL_EXTRACTED_BYTES / (1024 * 1024)}MB)`);
    }

    fileCount++;
    if (fileCount > MAX_TOTAL_FILES) {
      break; // Safe cap on number of files
    }

    const parentDir = path.dirname(destinationPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Write file content safely without executing
    fs.writeFileSync(destinationPath, entry.getData());
  }

  // Determine root directory (if root has single top-level directory)
  const topLevelItems = fs.readdirSync(targetExtractDir);
  let effectiveRootDir = targetExtractDir;
  if (topLevelItems.length === 1) {
    const singleItemPath = path.join(targetExtractDir, topLevelItems[0]);
    if (fs.statSync(singleItemPath).isDirectory()) {
      effectiveRootDir = singleItemPath;
    }
  }

  return {
    extractPath: targetExtractDir,
    rootDir: effectiveRootDir,
    extractedFileCount: fileCount,
  };
}

export function cleanupDirectory(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err: any) {
    console.warn(`[Cleanup] Failed to clean directory ${dirPath}: ${err.message}`);
  }
}
