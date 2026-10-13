import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Github, ArrowRight, AlertCircle, CheckCircle2, Loader2, FileArchive, Download } from 'lucide-react';
import { uploadZipProject, submitGitHubRepo, fetchProject, getDownloadDocxUrl } from '../services/api';
import { IProjectListItem, AnalysisStatus } from '../types';

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

  // Handle Drag & Drop
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
    setStatusMessage('Initiating submission...');

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

  // Polling Effect
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
        console.warn('Status poll warning:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeProjectId, projectStatus]);

  // Stage indicator calculation
  const getStageState = (stageIndex: number) => {
    if (projectStatus === 'completed') return 'completed';
    if (projectStatus === 'failed') return 'failed';

    const currentIdx =
      projectStatus === 'inspecting'
        ? 1
        : projectStatus === 'analyzing'
        ? 2
        : projectStatus === 'generating_docx'
        ? 3
        : 0;

    if (currentIdx > stageIndex) return 'completed';
    if (currentIdx === stageIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Submit Software Project for Documentation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Choose to upload a local project ZIP archive or specify a public GitHub repository URL.
        </p>
      </div>

      {!activeProjectId || projectStatus === 'failed' ? (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('zip');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'zip'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Project ZIP</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('github');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'github'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-4 h-4" />
              <span>Import from GitHub</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Submission Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Option A: ZIP Upload */}
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : selectedFile
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg">
                    {selectedFile ? <FileArchive className="w-7 h-7 text-emerald-400" /> : <UploadCloud className="w-7 h-7" />}
                  </div>

                  {selectedFile ? (
                    <div>
                      <p className="font-bold text-slate-100 text-sm sm:text-base">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                      </p>
                      <p className="text-[11px] text-cyan-400 font-semibold mt-2 underline">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-200 text-sm sm:text-base">
                        Drag and drop your project ZIP file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports Node.js, React, Express, Python, and multi-tier architectures (up to 50MB)
                      </p>
                      <button
                        type="button"
                        className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors border border-slate-700"
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">Security Guarantee:</span> Source code is strictly inspected statically. Scripts and binaries are never executed. Temporary extracted files are immediately sanitized.
              </div>
            </div>
          )}

          {/* Option B: GitHub Repository */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Public GitHub Repository URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Github className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/facebook/react or https://github.com/owner/repository"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Sample Repository Shortcuts */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-slate-400 font-medium">Or try an example open-source repository:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'https://github.com/expressjs/express',
                    'https://github.com/vitejs/vite',
                    'https://github.com/facebook/docusaurus',
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setRepoUrl(example)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-mono transition-colors"
                    >
                      {example.replace('https://github.com/', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleStartAnalysis}
            disabled={isSubmitting || (activeTab === 'zip' && !selectedFile) || (activeTab === 'github' && !repoUrl.trim())}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Starting Analysis...</span>
              </>
            ) : (
              <>
                <span>Analyze & Generate DOCX Documentation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        /* Real Analysis Stepper Card */
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">Project Evaluation in Progress</h2>
            <p className="text-xs text-slate-400">{statusMessage}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 h-3 rounded-full transition-all duration-700 ease-out shadow-lg shadow-cyan-500/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono font-medium">
              <span>Status: {projectStatus?.toUpperCase()}</span>
              <span>{progressPercent}% Complete</span>
            </div>
          </div>

          {/* Stepper Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { title: '1. Ingestion', desc: 'Secure archive extraction & tree build' },
              { title: '2. Inspection', desc: 'Dependencies, routes & schemas' },
              { title: '3. Architecture', desc: 'Diagram synthesis & AI narrative' },
              { title: '4. DOCX Report', desc: 'Compiling Word document' },
            ].map((step, idx) => {
              const state = getStageState(idx);
              return (
                <div
                  key={step.title}
                  className={`p-4 rounded-xl border transition-all ${
                    state === 'completed'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : state === 'active'
                      ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-200 glow-cyan'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : state === 'active' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </div>
                    )}
                    <span className="font-bold text-xs">{step.title}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-80">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Completed State Actions */}
          {projectStatus === 'completed' && (
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => onComplete(activeProjectId)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <span>View Full Report & Diagram</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={getDownloadDocxUrl(activeProjectId)}
                download
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-sm font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Download DOCX Directly</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
