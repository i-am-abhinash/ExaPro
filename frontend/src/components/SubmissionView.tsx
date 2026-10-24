import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Github,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileArchive,
  Download,
  Cpu,
  X,
  RefreshCw,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { uploadZipProject, submitGitHubRepo, fetchProject, getDownloadDocxUrl, getDownloadFaultReportDocxUrl } from '../services/api';
import { AnalysisStatus } from '../types';
import {
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
    if (!activeProjectId || projectStatus === 'completed' || projectStatus === 'completed_with_warnings' || projectStatus === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const proj = await fetchProject(activeProjectId);
        if (proj) {
          setProjectStatus(proj.status);
          setProgressPercent(proj.progress || 0);
          setStatusMessage(proj.statusMessage || '');

          if (proj.status === 'completed' || proj.status === 'completed_with_warnings') {
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
    { key: 'inspecting', label: '1. Ingestion & Extraction', pct: 20 },
    { key: 'analyzing', label: '2. Architecture & Documentation', pct: 40 },
    { key: 'planning_tests', label: '3. Static Defect Inspection', pct: 60 },
    { key: 'running_tests', label: '4. Isolated Test Execution', pct: 80 },
    { key: 'completed', label: '5. Dual Reports Compilation', pct: 100 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Workflow Header */}
      <div className="text-center space-y-2">
        <GlassBadge variant="aurora" dot size="sm">
          Guided Ingestion Workflow
        </GlassBadge>
        <h1 className="text-3xl sm:text-4xl font-black text-cool-primary tracking-tight">
          Examine Project Repository
        </h1>
        <p className="text-xs sm:text-sm text-cool-muted max-w-xl mx-auto leading-relaxed">
          Upload a ZIP archive or specify a public GitHub repository for static analysis, architecture synthesis, and camera-ready technical documentation.
        </p>
      </div>

      {/* Main Guided Form Container - Elevated Aurora Glass */}
      <div className="rounded-3xl glass-card-elevated p-6 sm:p-10 relative overflow-hidden">
        {/* 1. Selection Tabs */}
        {!isSubmitting && projectStatus !== 'completed' && (
          <div className="space-y-6">
            <div className="flex p-1.5 rounded-2xl bg-[rgba(21,28,50,0.70)] border border-white/[0.10] max-w-md mx-auto backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('zip');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'zip'
                    ? 'glass-tile-interactive text-cool-primary shadow-sm border border-white/[0.14]'
                    : 'text-cool-muted hover:text-cool-primary'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-aurora" />
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
                    ? 'glass-tile-interactive text-cool-primary shadow-sm border border-white/[0.14]'
                    : 'text-cool-muted hover:text-cool-primary'
                }`}
              >
                <Github className="w-4 h-4 text-teal" />
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
                    className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 group ${
                      isDragging
                        ? 'border-aurora bg-aurora/10 scale-[1.01]'
                        : 'border-white/[0.14] hover:border-aurora/50 bg-[rgba(29,35,64,0.45)] hover:bg-[rgba(35,46,80,0.60)] backdrop-blur-md'
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto rounded-2xl glass-stat-tile flex items-center justify-center text-aurora group-hover:scale-105 transition-transform shadow-glass-sm">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm sm:text-base font-bold text-cool-primary">
                        Drop project ZIP archive here, or <span className="text-aurora underline underline-offset-4">browse</span>
                      </p>
                      <p className="text-xs text-cool-muted">
                        Supports Node.js, Python, React, Vite, FastAPI, Express, and polyglot mono-repos up to 50MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl glass-tile-interactive flex items-center justify-between">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-aurora/15 text-aurora flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <FileArchive className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-cool-primary text-sm truncate">{selectedFile.name}</p>
                        <p className="text-xs text-cool-muted">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Static Inspection
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-2 rounded-xl text-cool-muted hover:text-status-error hover:bg-white/[0.08] transition-colors"
                      title="Remove file"
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
                  icon={<Github className="w-4 h-4 text-cool-muted" />}
                />

                {/* Sample Repositories */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-bold text-cool-muted uppercase tracking-wider">
                    Or select a verified sample repository:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Smart-news-Digest (FastAPI + React)', url: 'https://github.com/i-am-abhinash/Smart-news-Digest' },
                      { name: 'ExaPro Repository', url: 'https://github.com/i-am-abhinash/ExaPro' },
                    ].map((sample) => (
                      <button
                        key={sample.url}
                        type="button"
                        onClick={() => setRepoUrl(sample.url)}
                        className="text-xs px-3 py-1.5 rounded-xl glass-tile-interactive text-cool-primary font-mono transition-colors"
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
              <div className="p-4 rounded-xl bg-status-error-bg border border-status-error-border flex items-start space-x-3 text-xs text-status-error backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0 mt-0.5" />
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
                icon={<ArrowRight className="w-5 h-5 text-[#151C32]" />}
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
              <div className="w-14 h-14 mx-auto rounded-2xl bg-aurora/15 text-aurora flex items-center justify-center animate-pulse shadow-aurora-sm">
                <Cpu className="w-7 h-7 text-aurora" />
              </div>
              <h3 className="text-2xl font-black text-cool-primary tracking-tight">Inspecting Architecture & Codebase</h3>
              <p className="text-xs sm:text-sm text-cool-muted leading-relaxed font-mono">
                {statusMessage || 'Analyzing repository manifests, AST structure, and service routes...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cool-muted">Pipeline Execution</span>
                <span className="text-aurora font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-[rgba(21,28,50,0.70)] rounded-full overflow-hidden p-0.5 border border-white/[0.12]">
                <div
                  className="h-full bg-aurora rounded-full transition-all duration-500 shadow-sm"
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
                    className={`p-3.5 rounded-xl border transition-all text-xs flex items-center space-x-3 backdrop-blur-sm ${
                      isDone
                        ? 'bg-status-success-bg border-status-success-border text-status-success font-medium'
                        : isCurrent
                        ? 'bg-aurora/15 border-aurora/40 text-aurora font-bold shadow-sm'
                        : 'bg-[rgba(29,35,64,0.45)] border-white/[0.10] text-cool-muted'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-aurora animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/[0.2] flex-shrink-0" />
                    )}
                    <span className="truncate">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Completed State Card */}
        {(projectStatus === 'completed' || projectStatus === 'completed_with_warnings') && activeProjectId && (
          <div className="py-8 text-center space-y-6 max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-status-success-bg border border-status-success-border flex items-center justify-center text-status-success shadow-sm backdrop-blur-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-cool-primary tracking-tight">Project Examination & Testing Complete</h2>
              <p className="text-xs sm:text-sm text-cool-secondary leading-relaxed">
                Source code analysis, automated defect inspection, and test evaluations finished. Technical architecture documentation and software quality & fault reports are ready.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <GlassButton
                variant="primary"
                size="md"
                onClick={() => onComplete(activeProjectId)}
              >
                Inspect Full Reports & Findings
              </GlassButton>

              <a
                href={getDownloadDocxUrl(activeProjectId)}
                download
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl glass-tile-interactive text-cool-primary border border-white/[0.15] text-xs font-bold transition-colors"
                title="Download 14-section Technical Architecture DOCX"
              >
                <FileText className="w-4 h-4 text-aurora" />
                <span>Docx Architecture</span>
              </a>

              <a
                href={getDownloadFaultReportDocxUrl(activeProjectId)}
                download
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl glass-tile-interactive text-cool-primary border border-white/[0.15] text-xs font-bold transition-colors"
                title="Download Quality & Fault Findings DOCX"
              >
                <ShieldAlert className="w-4 h-4 text-[#FF8998]" />
                <span>Fault Report DOCX</span>
              </a>
            </div>
          </div>
        )}

        {/* 4. Failed State Card */}
        {projectStatus === 'failed' && (
          <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-status-error-bg border border-status-error-border flex items-center justify-center text-status-error shadow-sm backdrop-blur-md">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-cool-primary tracking-tight">Examination Failed</h2>
              <p className="text-xs sm:text-sm text-status-error leading-relaxed">{errorMessage || 'Analysis encountered an error.'}</p>
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
      </div>
    </div>
  );
};
