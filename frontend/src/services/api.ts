import { IProjectListItem, IReportData, IHealthStatus } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<IHealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch backend health status');
  return res.json();
}

export async function fetchProjects(): Promise<IProjectListItem[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects list');
  const data = await res.json();
  return data.projects || [];
}

export async function fetchProject(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch project details');
  }
  const data = await res.json();
  return data.project;
}

export async function fetchProjectReport(id: string): Promise<IReportData> {
  const res = await fetch(`${API_BASE}/projects/${id}/report`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch report preview');
  }
  return res.json();
}

export async function uploadZipProject(file: File): Promise<{ projectId: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/projects/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload project ZIP');
  }

  const data = await res.json();
  return { projectId: data.projectId };
}

export async function submitGitHubRepo(repoUrl: string): Promise<{ projectId: string }> {
  const res = await fetch(`${API_BASE}/projects/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit GitHub repository');
  }

  const data = await res.json();
  return { projectId: data.projectId };
}

export function getDownloadDocxUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/download`;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete project');
  }
}
