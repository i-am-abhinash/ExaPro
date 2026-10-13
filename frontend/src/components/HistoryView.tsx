import React, { useState, useEffect } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { IProjectListItem } from '../types';
import { fetchProjects, deleteProject, getDownloadDocxUrl } from '../services/api';

interface HistoryViewProps {
  onViewReport: (id: string) => void;
  onNewAnalysis: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onViewReport, onNewAnalysis }) => {
  const [projects, setProjects] = useState<IProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the evaluation for "${name}"?`)) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.projectName.toLowerCase().includes(q) ||
      (p.repositoryUrl && p.repositoryUrl.toLowerCase().includes(q)) ||
      (p.uploadedFileName && p.uploadedFileName.toLowerCase().includes(q)) ||
      p.detectedTechnologies.languages.some((l) => l.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Project Documentation History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and reopen previously generated project reports and DOCX deliverables
          </p>
        </div>

        <button
          onClick={onNewAnalysis}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          + New Evaluation
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by project name, GitHub URL, or technology..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      {/* History List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading project records from MongoDB...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">
            {searchQuery ? 'No matching projects found' : 'No documentation history recorded'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search criteria.' : 'Submit a new repository or project archive to begin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p._id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm truncate max-w-[170px]">{p.projectName}</h3>
                      <p className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : p.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center space-x-1.5 truncate">
                    {p.submissionType === 'github' ? (
                      <Github className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    )}
                    <span className="truncate">{p.repositoryUrl || p.uploadedFileName}</span>
                  </div>
                  {p.commitSha && (
                    <p className="text-[11px] font-mono text-slate-500">Rev: {p.commitSha}</p>
                  )}
                </div>

                {/* Tech chips */}
                <div className="flex flex-wrap gap-1">
                  {p.detectedTechnologies.languages.map((l) => (
                    <span key={l} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-cyan-300">
                      {l}
                    </span>
                  ))}
                  {p.detectedTechnologies.frameworks.slice(0, 2).map((f) => (
                    <span key={f} className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-[10px] text-slate-300">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {p.status === 'completed' && (
                    <>
                      <button
                        onClick={() => onViewReport(p._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold transition-colors"
                      >
                        Preview
                      </button>
                      <a
                        href={getDownloadDocxUrl(p._id)}
                        download
                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
                        title="Download DOCX"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(p._id, p.projectName)}
                  disabled={deletingId === p._id}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
