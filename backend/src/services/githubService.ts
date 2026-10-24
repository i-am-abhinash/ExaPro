import path from 'path';
import fs from 'fs';
import { GITHUB_TOKEN, TEMP_EXTRACT_DIR } from '../config/env';

export interface GitHubRepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  commitSha: string;
  description: string;
  rootDir: string;
  allFilePaths: string[];
  inspectedFilePaths: string[];
  failedFilePaths: string[];
  skippedFilePaths: string[];
}

const IGNORED_PATH_PREFIXES = [
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  '.next/',
  '.nuxt/',
  'out/',
  'coverage/',
  '.cache/',
  'vendor/',
  '.idea/',
  '.vscode/',
  '__pycache__/',
];

const IGNORED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.mp4',
  '.mp3',
  '.wav',
  '.exe',
  '.dll',
  '.bin',
  '.iso',
  '.zip',
  '.tar',
  '.gz',
  '.lock',
  '.pdf',
  '.ttf',
  '.woff',
  '.woff2',
]);

const MAX_GITHUB_FILES_TO_DOWNLOAD = 120;
const MAX_GITHUB_FILE_SIZE_BYTES = 512 * 1024; // 512KB per file max

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const cleanUrl = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const match = cleanUrl.match(/^https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL. Expected format: https://github.com/owner/repository');
  }
  return { owner: match[2], repo: match[3] };
}

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'Exapro-Project-Evaluator-Documentation-Engine/1.0',
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  return headers;
}

export async function fetchGitHubRepo(repoUrl: string, uniqueId: string): Promise<GitHubRepoMeta> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const headers = getGitHubHeaders();

  // 1. Fetch Repository Metadata
  const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (repoMetaRes.status === 404) {
    throw new Error(`Repository "${owner}/${repo}" was not found or is private. Only public repositories are supported.`);
  }
  if (repoMetaRes.status === 403) {
    const rateLimitRemaining = repoMetaRes.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0') {
      throw new Error('GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN in backend .env to increase quota.');
    }
    throw new Error(`Access forbidden to repository "${owner}/${repo}". Check GitHub API permissions.`);
  }
  if (!repoMetaRes.ok) {
    throw new Error(`GitHub API error (${repoMetaRes.status}): ${repoMetaRes.statusText}`);
  }

  const repoMetaData = (await repoMetaRes.json()) as any;
  const defaultBranch = repoMetaData.default_branch || 'main';
  const description = repoMetaData.description || '';

  // 2. Fetch latest commit SHA
  let commitSha = '';
  try {
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${defaultBranch}`, { headers });
    if (commitRes.ok) {
      const commitData = (await commitRes.json()) as any;
      commitSha = commitData.sha || '';
    }
  } catch (err: any) {
    console.warn(`[GitHub] Could not fetch commit SHA: ${err.message}`);
  }

  // 3. Fetch Git Tree recursively
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) {
    throw new Error(`Could not fetch repository file tree (${treeRes.status}): ${treeRes.statusText}`);
  }

  const treeData = (await treeRes.json()) as any;
  if (!Array.isArray(treeData.tree) || treeData.tree.length === 0) {
    throw new Error(`Repository "${owner}/${repo}" is empty or has no accessible files.`);
  }

  const allTreeItems = treeData.tree as Array<{ path: string; type: string; size?: number }>;
  const validFiles = allTreeItems.filter((item) => {
    if (item.type !== 'blob') return false;
    const lowerPath = item.path.toLowerCase();
    if (IGNORED_PATH_PREFIXES.some((prefix) => lowerPath.startsWith(prefix) || lowerPath.includes('/' + prefix))) return false;
    const ext = path.extname(item.path).toLowerCase();
    if (IGNORED_EXTENSIONS.has(ext)) return false;
    return true;
  });

  // Prioritize files to download: manifests, READMEs, configs, entry points, routes, models, source files
  const priorityScore = (filePath: string): number => {
    const lower = filePath.toLowerCase();
    const base = path.basename(lower);
    if (base === 'package.json' || base === 'requirements.txt' || base === 'pom.xml' || base === 'go.mod' || base === 'cargo.toml') return 100;
    if (base === 'readme.md' || base === 'readme') return 95;
    if (base.startsWith('tsconfig') || base.startsWith('vite.config') || base.startsWith('next.config') || base.startsWith('docker')) return 90;
    if (base === 'index.ts' || base === 'index.js' || base === 'main.ts' || base === 'server.ts' || base === 'app.ts' || base === 'server.js' || base === 'app.js' || base === 'app.py' || base === 'main.go') return 85;
    if (lower.includes('/routes/') || lower.includes('/controllers/') || lower.includes('/api/')) return 75;
    if (lower.includes('/models/') || lower.includes('/schemas/') || lower.includes('/entities/')) return 70;
    if (lower.includes('/services/') || lower.includes('/components/') || lower.includes('/pages/')) return 65;
    if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.py') || lower.endsWith('.java') || lower.endsWith('.go')) return 50;
    return 10;
  };

  const sortedFiles = [...validFiles].sort((a, b) => priorityScore(b.path) - priorityScore(a.path));
  const filesToDownload = sortedFiles.slice(0, MAX_GITHUB_FILES_TO_DOWNLOAD);

  // 4. Save into local temporary folder for unified analysis
  const targetExtractDir = path.resolve(TEMP_EXTRACT_DIR, uniqueId);
  if (!fs.existsSync(targetExtractDir)) {
    fs.mkdirSync(targetExtractDir, { recursive: true });
  }

  const inspectedFilePaths: string[] = [];
  const failedFilePaths: string[] = [];
  const skippedFilePaths: string[] = [];

  // Record files skipped because of priority cap
  if (sortedFiles.length > MAX_GITHUB_FILES_TO_DOWNLOAD) {
    sortedFiles.slice(MAX_GITHUB_FILES_TO_DOWNLOAD).forEach((f) => skippedFilePaths.push(f.path));
  }

  // Download files in chunks with raw github user content
  const chunkSize = 8;
  for (let i = 0; i < filesToDownload.length; i += chunkSize) {
    const chunk = filesToDownload.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (fileItem) => {
        try {
          // Path traversal safety validation
          const cleanRel = fileItem.path.replace(/\\/g, '/').replace(/^\.\//, '');
          const targetFilePath = path.resolve(targetExtractDir, cleanRel);
          if (!targetFilePath.startsWith(targetExtractDir + path.sep)) {
            console.warn(`[GitHub] Security: Path traversal blocked for remote file: ${fileItem.path}`);
            failedFilePaths.push(fileItem.path);
            return;
          }

          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${fileItem.path}`;
          const fileRes = await fetch(rawUrl, {
            headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
          });
          if (!fileRes.ok) {
            failedFilePaths.push(fileItem.path);
            return;
          }

          const content = await fileRes.text();
          if (content.length > MAX_GITHUB_FILE_SIZE_BYTES) {
            skippedFilePaths.push(fileItem.path);
            return;
          }

          const parentDir = path.dirname(targetFilePath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }

          fs.writeFileSync(targetFilePath, content, 'utf-8');
          inspectedFilePaths.push(fileItem.path);
        } catch (err: any) {
          failedFilePaths.push(fileItem.path);
          console.warn(`[GitHub] Error downloading file ${fileItem.path}: ${err.message}`);
        }
      })
    );
  }

  return {
    owner,
    repo,
    defaultBranch,
    commitSha: commitSha ? commitSha.substring(0, 10) : 'HEAD',
    description,
    rootDir: targetExtractDir,
    allFilePaths: validFiles.map((f) => f.path),
    inspectedFilePaths,
    failedFilePaths,
    skippedFilePaths,
  };
}
