import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Github,
  UploadCloud,
  Plus,
  LayoutGrid,
  List,
  GitBranch,
  ShieldAlert,
} from 'lucide-react';
import { IProjectListItem } from '../types';
import { fetchProjects, deleteProject, getDownloadDocxUrl, getDownloadFaultReportDocxUrl } from '../services/api';
import {
  TiltCard,
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassModal,
  GlassSkeleton,
  GlassEmptyState,
} from './ui';

interface HistoryViewProps {
  onViewReport: (id: string) => void;
  onNewAnalysis: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onViewReport, onNewAnalysis }) => {
  const [projects, setProjects] = useState<IProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Delete confirmation modal state
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load project history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.projectName.toLowerCase().includes(q) ||
      (p.repositoryUrl && p.repositoryUrl.toLowerCase().includes(q)) ||
      (p.uploadedFileName && p.uploadedFileName.toLowerCase().includes(q)) ||
      p.detectedTechnologies.languages.some((l) => l.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') return p.status === 'completed';
    if (statusFilter === 'failed') return p.status === 'failed';
    if (statusFilter === 'processing') return p.status !== 'completed' && p.status !== 'failed';

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-black text-cool-primary tracking-tight">Project History</h1>
            <GlassBadge variant="neutral" size="sm">
              {projects.length} Total Repositories
            </GlassBadge>
          </div>
          <p className="text-xs sm:text-sm text-cool-muted">
            Browse, inspect, and export previously evaluated software repositories and DOCX reports
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4 text-[#151C32]" />}
          onClick={onNewAnalysis}
          className="self-start sm:self-auto"
        >
          New Evaluation
        </GlassButton>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl glass-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96">
          <GlassInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, repository, or language..."
            icon={<Search className="w-4 h-4 text-cool-muted" />}
          />
        </div>

        {/* Filter Pills and View Mode Toggle */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'completed', label: 'Completed' },
              { id: 'processing', label: 'Analyzing' },
              { id: 'failed', label: 'Failed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'glass-tile-interactive text-cool-primary border border-white/[0.14] shadow-sm'
                    : 'text-cool-muted hover:text-cool-primary hover:bg-white/[0.08]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid vs Table View Toggle */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-[rgba(21,28,50,0.78)] border border-white/[0.12] backdrop-blur-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'glass-tile-interactive text-cool-primary shadow-sm border border-white/[0.12]' : 'text-cool-muted hover:text-cool-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'glass-tile-interactive text-cool-primary shadow-sm border border-white/[0.12]' : 'text-cool-muted hover:text-cool-primary'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassSkeleton variant="card" count={6} />
        </div>
      ) : projects.length === 0 ? (
        <GlassEmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No evaluations found"
          description="You haven't examined any repositories yet. Start by uploading a ZIP or specifying a GitHub URL."
          actionText="Examine First Project"
          actionIcon={<Plus className="w-4 h-4 text-[#151C32]" />}
          onAction={onNewAnalysis}
        />
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-cool-primary text-sm font-semibold">No projects match your filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-xs text-aurora hover:underline font-semibold"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 1. Grid of 3D TiltCards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <TiltCard
              key={project._id}
              elevation="floating"
              className="p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl glass-stat-tile flex items-center justify-center text-cool-primary flex-shrink-0 shadow-sm">
                    {project.submissionType === 'github' ? (
                      <Github className="w-5 h-5 text-cool-primary" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-aurora" />
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {project.status === 'completed' ? (
                      <GlassBadge variant="success" dot size="sm">
                        Ready
                      </GlassBadge>
                    ) : project.status === 'completed_with_warnings' ? (
                      <GlassBadge variant="warning" dot size="sm">
                        Warnings
                      </GlassBadge>
                    ) : project.status === 'failed' ? (
                      <GlassBadge variant="error" dot size="sm">
                        Failed
                      </GlassBadge>
                    ) : (
                      <GlassBadge variant="aurora" dot pulse size="sm">
                        Analyzing...
                      </GlassBadge>
                    )}
                    {project.faultSummary && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          project.faultSummary.qualityGrade === 'A'
                            ? 'text-[#54D6A0] bg-[#54D6A0]/15 border border-[#54D6A0]/30'
                            : project.faultSummary.qualityGrade === 'B'
                            ? 'text-[#8295FF] bg-[#8295FF]/15 border border-[#8295FF]/30'
                            : project.faultSummary.qualityGrade === 'C'
                            ? 'text-[#FFC66D] bg-[#FFC66D]/15 border border-[#FFC66D]/30'
                            : 'text-[#FF8195] bg-[#FF8195]/15 border border-[#FF8195]/30'
                        }`}
                      >
                        Score: {project.faultSummary.qualityScore} ({project.faultSummary.qualityGrade})
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-cool-primary text-base truncate" title={project.projectName}>
                    {project.projectName}
                  </h3>
                  <p className="text-xs text-cool-muted truncate font-mono">
                    {project.repositoryUrl || project.uploadedFileName}
                  </p>
                  {project.branch && (
                    <p className="text-[11px] text-cool-muted flex items-center space-x-1 font-mono">
                      <GitBranch className="w-3 h-3 text-cool-muted" />
                      <span>{project.branch}</span>
                    </p>
                  )}
                </div>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.detectedTechnologies.languages.slice(0, 4).map((lang) => (
                    <GlassBadge key={lang} variant="neutral" size="sm">
                      {lang}
                    </GlassBadge>
                  ))}
                  {project.detectedTechnologies.languages.length > 4 && (
                    <span className="text-[10px] text-cool-muted self-center">
                      +{project.detectedTechnologies.languages.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-white/[0.10] flex items-center justify-between">
                <span className="text-xs text-cool-muted">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center space-x-1.5">
                  {(project.status === 'completed' || project.status === 'completed_with_warnings') && (
                    <>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewReport(project._id)}
                      >
                        Inspect
                      </GlassButton>
                      <a
                        href={getDownloadDocxUrl(project._id)}
                        download
                        className="p-1.5 rounded-lg bg-aurora/18 hover:bg-aurora/28 text-aurora border border-aurora/40 transition-colors"
                        title="Download Architecture DOCX"
                      >
                        <FileText className="w-3.5 h-3.5 text-aurora" />
                      </a>
                      <a
                        href={getDownloadFaultReportDocxUrl(project._id)}
                        download
                        className="p-1.5 rounded-lg bg-[#FF8998]/15 hover:bg-[#FF8998]/25 text-[#FF8998] border border-[#FF8998]/30 transition-colors"
                        title="Download Fault Report DOCX"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-[#FF8998]" />
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => setProjectToDelete({ id: project._id, name: project.projectName })}
                    className="p-1.5 rounded-lg text-cool-muted hover:text-status-error hover:bg-status-error-bg transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      ) : (
        /* 2. Compact Table View */
        <div className="rounded-3xl glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[rgba(21,28,50,0.85)] text-cool-muted border-b border-white/[0.12] uppercase tracking-wider font-bold text-[11px] backdrop-blur-md">
                <tr>
                  <th className="py-3.5 px-6">Project Name</th>
                  <th className="py-3.5 px-6">Source</th>
                  <th className="py-3.5 px-6">Tech Stack</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Evaluated</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-cool-primary">
                {filteredProjects.map((proj) => (
                  <tr key={proj._id} className="hover:bg-[rgba(154,171,255,0.08)] transition-colors">
                    <td className="py-4 px-6 font-semibold">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(29,35,64,0.70)] border border-white/[0.12] flex items-center justify-center text-aurora flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="truncate max-w-[200px] font-bold text-cool-primary">{proj.projectName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-cool-muted truncate max-w-[150px] inline-block font-mono text-xs">
                        {proj.repositoryUrl || proj.uploadedFileName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {proj.detectedTechnologies.languages.slice(0, 3).map((l) => (
                          <GlassBadge key={l} variant="neutral" size="sm">
                            {l}
                          </GlassBadge>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      <div>
                        {proj.status === 'completed' ? (
                          <GlassBadge variant="success" dot size="sm">
                            Ready
                          </GlassBadge>
                        ) : proj.status === 'completed_with_warnings' ? (
                          <GlassBadge variant="warning" dot size="sm">
                            Warnings
                          </GlassBadge>
                        ) : proj.status === 'failed' ? (
                          <GlassBadge variant="error" dot size="sm">
                            Failed
                          </GlassBadge>
                        ) : (
                          <GlassBadge variant="aurora" dot pulse size="sm">
                            {proj.statusMessage || 'Analyzing...'}
                          </GlassBadge>
                        )}
                      </div>
                      {proj.faultSummary && (
                        <div className="flex items-center space-x-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              proj.faultSummary.qualityGrade === 'A'
                                ? 'text-[#54D6A0] bg-[#54D6A0]/15 border border-[#54D6A0]/30'
                                : proj.faultSummary.qualityGrade === 'B'
                                ? 'text-[#8295FF] bg-[#8295FF]/15 border border-[#8295FF]/30'
                                : proj.faultSummary.qualityGrade === 'C'
                                ? 'text-[#FFC66D] bg-[#FFC66D]/15 border border-[#FFC66D]/30'
                                : 'text-[#FF8195] bg-[#FF8195]/15 border border-[#FF8195]/30'
                            }`}
                          >
                            Score: {proj.faultSummary.qualityScore} ({proj.faultSummary.qualityGrade})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-cool-muted whitespace-nowrap text-xs">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      {(proj.status === 'completed' || proj.status === 'completed_with_warnings') && (
                        <>
                          <GlassButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onViewReport(proj._id)}
                          >
                            Inspect
                          </GlassButton>
                          <a
                            href={getDownloadDocxUrl(proj._id)}
                            download
                            title="Download Architecture DOCX"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-aurora hover:bg-aurora-hover text-[#151C32] text-xs font-bold shadow-aurora-sm transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#151C32]" />
                            <span>Arch</span>
                          </a>
                          <a
                            href={getDownloadFaultReportDocxUrl(proj._id)}
                            download
                            title="Download Fault Report DOCX"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl glass-tile-interactive text-cool-primary border border-white/[0.15] text-xs font-bold transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-[#FF8998]" />
                            <span>Faults</span>
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => setProjectToDelete({ id: proj._id, name: proj.projectName })}
                        className="p-1.5 rounded-lg text-cool-muted hover:text-status-error hover:bg-status-error-bg transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <GlassModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Confirm Deletion"
        footer={
          <div className="flex items-center justify-end space-x-3">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setProjectToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Delete Project Report
            </GlassButton>
          </div>
        }
      >
        <p className="text-sm text-cool-muted leading-relaxed">
          Are you sure you want to delete the evaluation report for{' '}
          <strong className="text-cool-primary font-bold">&ldquo;{projectToDelete?.name}&rdquo;</strong>? This will permanently remove the record and generated DOCX file from disk.
        </p>
      </GlassModal>
    </div>
  );
};
