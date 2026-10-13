import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Github,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileArchive,
  Download,
  ShieldCheck,
  Cpu,
  Sparkles,
  FileText,
  X,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { uploadZipProject, submitGitHubRepo, fetchProject, getDownloadDocxUrl } from '../services/api';
import { AnalysisStatus } from '../types';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassInput,
} from './ui';

interface SubmissionViewProps {
  initialType?: 'zip' | 'github';
  onComplete: (projectId: string) => void;
}

export const SubmissionView: React.FC<SubmissionViewProps> = ({
  initialType = 'zip',
  onComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'github'>(initialType);

  // ZIP form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GitHub form state
  const [repoUrl, setRepoUrl] = useState('');

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<AnalysisStatus | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please select a valid .zip archive file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please select a valid .zip archive file.');
      }
    }
  };

  // Submit Handler
  const handleStartAnalysis = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    setProgressPercent(10);
    setStatusMessage('Initiating repository evaluation...');

    try {
      let createdId = '';
      if (activeTab === 'zip') {
        if (!selectedFile) {
          throw new Error('Please select a ZIP file to upload.');
        }
        setStatusMessage('Uploading project archive to secure backend...');
        const result = await uploadZipProject(selectedFile);
        createdId = result.projectId;
      } else {
        if (!repoUrl.trim()) {
          throw new Error('Please enter a public GitHub repository URL.');
        }
        setStatusMessage('Validating GitHub repository accessibility...');
        const result = await submitGitHubRepo(repoUrl.trim());
        createdId = result.projectId;
      }

      setActiveProjectId(createdId);
      setProjectStatus('queued');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit project.');
      setIsSubmitting(false);
    }
  };

  // Status Polling Effect
  useEffect(() => {
    if (!activeProjectId || projectStatus === 'completed' || projectStatus === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const proj = await fetchProject(activeProjectId);
        if (proj) {
          setProjectStatus(proj.status);
          setProgressPercent(proj.progress || 0);
          setStatusMessage(proj.statusMessage || '');

          if (proj.status === 'completed') {
            setIsSubmitting(false);
          } else if (proj.status === 'failed') {
            setIsSubmitting(false);
            setErrorMessage(proj.errorMessage || 'Analysis encountered an error.');
          }
        }
      } catch (err: any) {
        console.warn('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeProjectId, projectStatus]);

  const pipelineStages = [
    { key: 'inspecting', label: '1. Ingestion & Extraction', pct: 25 },
    { key: 'analyzing', label: '2. Codebase & AST Inspection', pct: 50 },
    { key: 'generating_docx', label: '3. Topology & AI Synthesis', pct: 75 },
    { key: 'completed', label: '4. DOCX Report Compilation', pct: 100 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Workflow Header */}
      <div className="text-center space-y-2">
        <GlassBadge variant="cyan" dot size="sm">
          Guided Ingestion Workflow
        </GlassBadge>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Examine Project Repository
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Upload a ZIP archive or specify a public GitHub repository for static analysis, architecture synthesis, and camera-ready technical documentation.
        </p>
      </div>

      {/* Main Guided Card */}
      <GlassCard elevation="floating" className="p-6 sm:p-10 relative overflow-hidden">
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-br" />

        {/* 1. Selection Tabs */}
        {!isSubmitting && projectStatus !== 'completed' && (
          <div className="space-y-6">
            <div className="flex p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-md mx-auto shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('zip');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'zip'
                    ? 'bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-cyan-200 border border-cyan-400/40 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>ZIP Archive</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('github');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'github'
                    ? 'bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 text-violet-200 border border-violet-400/40 shadow-glow-violet'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repository</span>
              </button>
            </div>

            {/* TAB 1: ZIP Archive Upload Area */}
            {activeTab === 'zip' && (
              <div className="space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 group ${
                      isDragging
                        ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                        : 'border-slate-700/70 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-lg">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm sm:text-base font-bold text-white">
                        Drop project ZIP archive here, or <span className="text-cyan-400 underline underline-offset-4">browse</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Supports Node.js, Python, React, Vite, FastAPI, Express, and polyglot mono-repos up to 50MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl glass-surface-elevated border border-cyan-500/30 flex items-center justify-between shadow-glass-md">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        <FileArchive className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Static Inspection
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Remove selected file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GitHub Repository URL */}
            {activeTab === 'github' && (
              <div className="space-y-4">
                <GlassInput
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="https://github.com/owner/repository"
                  label="Public GitHub Repository URL"
                  icon={<Github className="w-4 h-4 text-violet-400" />}
                />

                {/* Sample Repositories */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Or try a sample repository:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Smart-news-Digest (FastAPI + React)', url: 'https://github.com/i-am-abhinash/Smart-news-Digest' },
                      { name: 'ClubAttendance (React + Firestore BaaS)', url: 'https://github.com/i-am-abhinash/ExaPro' },
                    ].map((sample) => (
                      <button
                        key={sample.url}
                        type="button"
                        onClick={() => setRepoUrl(sample.url)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-violet-300 font-mono transition-colors"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start space-x-3 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Submission error</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="pt-4 flex items-center justify-end">
              <GlassButton
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-5 h-5 text-slate-950" />}
                onClick={handleStartAnalysis}
                disabled={activeTab === 'zip' ? !selectedFile : !repoUrl.trim()}
              >
                Launch Codebase Examination
              </GlassButton>
            </div>
          </div>
        )}

        {/* 2. Processing Pipeline Live Stepper */}
        {(isSubmitting || (projectStatus && projectStatus !== 'completed' && projectStatus !== 'failed')) && (
          <div className="py-8 space-y-8 max-w-xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-glow-cyan animate-pulse">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white">Inspecting Architecture & Codebase</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {statusMessage || 'Analyzing repository manifests, AST structure, and service routes...'}
              </p>
            </div>

            {/* Glowing Luminous Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Pipeline Execution</span>
                <span className="text-cyan-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 rounded-full transition-all duration-500 shadow-glow-cyan"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>
            </div>

            {/* 4 Pipeline Stages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {pipelineStages.map((stage) => {
                const isDone = progressPercent >= stage.pct;
                const isCurrent = progressPercent >= stage.pct - 25 && progressPercent < stage.pct;
                return (
                  <div
                    key={stage.key}
                    className={`p-3 rounded-xl border transition-all text-xs flex items-center space-x-2.5 ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : isCurrent
                        ? 'bg-cyan-950/30 border-cyan-400/50 text-cyan-200 shadow-glow-cyan'
                        : 'bg-slate-900/40 border-white/5 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                    )}
                    <span className="font-semibold truncate">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Completed State Card */}
        {projectStatus === 'completed' && activeProjectId && (
          <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white">Project Examination Complete</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Repository evaluation finished successfully. Verified architecture diagram and 14-section DOCX report generated.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <GlassButton
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4 text-slate-950" />}
                onClick={() => onComplete(activeProjectId)}
              >
                Preview Technical Report
              </GlassButton>

              <a
                href={getDownloadDocxUrl(activeProjectId)}
                download
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm font-bold transition-colors shadow-glass-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download DOCX</span>
              </a>
            </div>
          </div>
        )}

        {/* 4. Failed State Card */}
        {projectStatus === 'failed' && (
          <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white">Examination Failed</h2>
              <p className="text-xs text-rose-200 leading-relaxed">{errorMessage || 'Analysis encountered an error.'}</p>
            </div>

            <GlassButton
              variant="secondary"
              size="md"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                setProjectStatus(null);
                setActiveProjectId(null);
                setErrorMessage(null);
                setIsSubmitting(false);
              }}
            >
              Try Again
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
