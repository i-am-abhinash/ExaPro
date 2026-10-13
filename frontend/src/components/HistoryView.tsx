import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Github,
  UploadCloud,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
} from 'lucide-react';
import { IProjectListItem } from '../types';
import { fetchProjects, deleteProject, getDownloadDocxUrl } from '../services/api';
import { TiltCard } from './ui/TiltCard';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { GlassBadge } from './ui/GlassBadge';
import { GlassInput } from './ui/GlassInput';
import { GlassModal } from './ui/GlassModal';

interface HistoryViewProps {
  onViewReport: (id: string) => void;
  onNewAnalysis: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onViewReport, onNewAnalysis }) => {
  const [projects, setProjects] = useState<IProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  
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
          <h1 className="text-3xl font-black text-white tracking-tight">Project History</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Browse, inspect, and export previously evaluated software repositories and DOCX reports
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4 text-slate-950" />}
          onClick={onNewAnalysis}
          className="self-start sm:self-auto"
        >
          New Evaluation
        </GlassButton>
      </div>

      {/* Search & Filter Bar */}
      <GlassCard elevation="flat" className="p-4 sm:p-5 flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:flex-1">
          <GlassInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, GitHub URL, or technology..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* History Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 mx-auto border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading evaluation archives from MongoDB...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <GlassCard elevation="flat" className="p-16 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-200">
              {searchQuery ? 'No matching projects found' : 'No documentation history recorded'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search query or switching the status filter.'
                : 'Submit a new repository or project archive to generate an evaluation.'}
            </p>
          </div>
          {!searchQuery && (
            <GlassButton variant="primary" size="sm" onClick={onNewAnalysis}>
              Examine First Project
            </GlassButton>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <TiltCard
              key={p._id}
              elevation="elevated"
              className="p-6 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate" title={p.projectName}>
                        {p.projectName}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {p.status === 'completed' ? (
                    <GlassBadge variant="emerald" dot size="sm">
                      Ready
                    </GlassBadge>
                  ) : p.status === 'failed' ? (
                    <GlassBadge variant="rose" dot size="sm">
                      Failed
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="cyan" dot pulse size="sm">
                      Analyzing
                    </GlassBadge>
                  )}
                </div>

                <div className="text-xs text-slate-400 space-y-1 pt-1">
                  <div className="flex items-center space-x-1.5 truncate">
                    {p.submissionType === 'github' ? (
                      <Github className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    )}
                    <span className="truncate text-slate-300 font-mono text-[11px]">
                      {p.repositoryUrl || p.uploadedFileName}
                    </span>
                  </div>
                  {p.commitSha && (
                    <p className="text-[10px] font-mono text-slate-500">Rev: {p.commitSha}</p>
                  )}
                </div>

                {/* Tech Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.detectedTechnologies.languages.map((l) => (
                    <GlassBadge key={l} variant="neutral" size="sm">
                      {l}
                    </GlassBadge>
                  ))}
                  {p.detectedTechnologies.frameworks.slice(0, 2).map((f) => (
                    <GlassBadge key={f} variant="violet" size="sm">
                      {f}
                    </GlassBadge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {p.status === 'completed' && (
                    <>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewReport(p._id)}
                      >
                        Preview
                      </GlassButton>
                      <a
                        href={getDownloadDocxUrl(p._id)}
                        download
                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors shadow-sm"
                        title="Download DOCX"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setProjectToDelete({ id: p._id, name: p.projectName })}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </TiltCard>
          ))}
        </div>
      )}

      {/* Delete Confirmation Glass Modal */}
      <GlassModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Confirm Deletion"
        description="Are you sure you want to permanently remove this evaluation record and its generated deliverables?"
      >
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 font-mono">
          Project: <span className="text-white font-bold">{projectToDelete?.name}</span>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <GlassButton
            variant="ghost"
            size="md"
            onClick={() => setProjectToDelete(null)}
            disabled={isDeleting}
          >
            Cancel
          </GlassButton>

          <GlassButton
            variant="danger"
            size="md"
            loading={isDeleting}
            onClick={handleConfirmDelete}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete Evaluation
          </GlassButton>
        </div>
      </GlassModal>
    </div>
  );
};
