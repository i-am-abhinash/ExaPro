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
} from 'lucide-react';
import { uploadZipProject, submitGitHubRepo, fetchProject, getDownloadDocxUrl } from '../services/api';
import { AnalysisStatus } from '../types';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { GlassBadge } from './ui/GlassBadge';
import { GlassInput } from './ui/GlassInput';

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
        console.warn('Status poll warning:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeProjectId, projectStatus]);

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
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Examine Project
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Submit your codebase for automated evidence extraction, architecture graph synthesis, and DOCX technical reporting.
        </p>
      </div>

      {!activeProjectId || projectStatus === 'failed' ? (
        <GlassCard elevation="floating" className="p-6 sm:p-10 space-y-6">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-midnight-900 border border-white/5">
            <button
              onClick={() => {
                setActiveTab('zip');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'zip'
                  ? 'bg-slate-800 text-cyan-300 shadow-glass-sm border border-cyan-500/30'
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
              className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'github'
                  ? 'bg-slate-800 text-violet-300 shadow-glass-sm border border-violet-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-4 h-4" />
              <span>Import from GitHub</span>
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start space-x-3 shadow-glass-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold text-red-200">Submission Notice</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Option A: ZIP Upload */}
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-glow-cyan'
                    : selectedFile
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : 'border-slate-700/60 hover:border-cyan-400/50 bg-slate-900/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg">
                    {selectedFile ? (
                      <FileArchive className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>

                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="font-bold text-white text-base sm:text-lg">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Archive Verified
                      </p>
                      <p className="text-xs text-cyan-400 font-semibold pt-1 underline">Click to choose another file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-slate-100 text-base sm:text-lg">
                        Drag and drop your project ZIP file here
                      </p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        Supports polyglot full-stack, React, Python FastAPI, Express, and BaaS architectures (up to 50MB)
                      </p>
                      <button
                        type="button"
                        className="mt-3 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors border border-slate-700/80 shadow-glass-sm"
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-surface-subtle border border-white/5 text-xs text-slate-400 space-y-1 flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-semibold text-slate-200">Security Guarantee:</span> Source code is strictly inspected statically via AST and symbol parsers. Scripts and binaries are never executed.
                </p>
              </div>
            </div>
          )}

          {/* Option B: GitHub Repository */}
          {activeTab === 'github' && (
            <div className="space-y-5">
              <GlassInput
                label="Public GitHub Repository URL"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                icon={<Github className="w-4 h-4 text-slate-400" />}
              />

              {/* Sample Repository Shortcuts */}
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-400 font-medium">Or select an example open-source repository:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'https://github.com/i-am-abhinash/Smart-news-Digest',
                    'https://github.com/expressjs/express',
                    'https://github.com/vitejs/vite',
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setRepoUrl(example)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-mono transition-colors"
                    >
                      {example.replace('https://github.com/', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <GlassButton
            variant="primary"
            size="lg"
            loading={isSubmitting}
            onClick={handleStartAnalysis}
            disabled={
              isSubmitting ||
              (activeTab === 'zip' && !selectedFile) ||
              (activeTab === 'github' && !repoUrl.trim())
            }
            className="w-full mt-2"
            icon={<ArrowRight className="w-5 h-5 text-slate-950" />}
          >
            Analyze & Generate DOCX Documentation
          </GlassButton>
        </GlassCard>
      ) : (
        /* Real Analysis Stepper Card */
        <GlassCard elevation="floating" className="p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Project Evaluation in Progress</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">{statusMessage}</p>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-white/5 p-0.5">
              <motion.div
                className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 h-2 rounded-full shadow-lg shadow-cyan-500/50"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono font-medium">
              <span>Status: {projectStatus?.toUpperCase()}</span>
              <span>{progressPercent}% Complete</span>
            </div>
          </div>

          {/* Stepper Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { title: '1. Ingestion', desc: 'Secure archive extraction & tree build', icon: FileArchive },
              { title: '2. Inspection', desc: 'Dependencies, routes & runtimes', icon: Cpu },
              { title: '3. Architecture', desc: 'Diagram synthesis & AI narrative', icon: Sparkles },
              { title: '4. DOCX Report', desc: 'Camera-ready Word file build', icon: FileText },
            ].map((step, idx) => {
              const state = getStageState(idx);
              const StepIcon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    state === 'completed'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : state === 'active'
                      ? 'bg-cyan-950/30 border-cyan-400/60 text-cyan-200 shadow-glow-cyan'
                      : 'bg-slate-900/30 border-white/5 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : state === 'active' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <StepIcon className="w-4 h-4 text-slate-500" />
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <GlassButton
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-5 h-5 text-slate-950" />}
                onClick={() => onComplete(activeProjectId)}
              >
                View Full Report & Diagram
              </GlassButton>

              <a
                href={getDownloadDocxUrl(activeProjectId)}
                download
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-sm font-semibold transition-colors shadow-glass-sm"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Download DOCX Directly</span>
              </a>
            </motion.div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
