import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SubmissionView } from './components/SubmissionView';
import { ReportPreviewView } from './components/ReportPreviewView';
import { HistoryView } from './components/HistoryView';
import { IHealthStatus, IProjectListItem } from './types';
import { fetchHealth, fetchProjects } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'new' | 'history' | 'report'>('dashboard');
  const [submissionInitialType, setSubmissionInitialType] = useState<'zip' | 'github'>('zip');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [health, setHealth] = useState<IHealthStatus | null>(null);
  const [recentProjects, setRecentProjects] = useState<IProjectListItem[]>([]);

  // Load health and recent projects
  useEffect(() => {
    async function initData() {
      try {
        const h = await fetchHealth();
        setHealth(h);
      } catch (err) {
        console.warn('Backend health check error:', err);
      }

      try {
        const projects = await fetchProjects();
        setRecentProjects(projects);
      } catch (err) {
        console.warn('Projects fetch error:', err);
      }
    }
    initData();
  }, [currentTab]);

  const handleStartSubmission = (type: 'zip' | 'github') => {
    setSubmissionInitialType(type);
    setCurrentTab('new');
  };

  const handleViewReport = (id: string) => {
    setSelectedProjectId(id);
    setCurrentTab('report');
  };

  const handleSubmissionComplete = (id: string) => {
    setSelectedProjectId(id);
    setCurrentTab('report');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <div>
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} health={health} />

        <main className="pb-16">
          {currentTab === 'dashboard' && (
            <DashboardView
              onStartSubmission={handleStartSubmission}
              onViewReport={handleViewReport}
              recentProjects={recentProjects}
            />
          )}

          {currentTab === 'new' && (
            <SubmissionView
              initialType={submissionInitialType}
              onComplete={handleSubmissionComplete}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              onViewReport={handleViewReport}
              onNewAnalysis={() => {
                setSubmissionInitialType('zip');
                setCurrentTab('new');
              }}
            />
          )}

          {currentTab === 'report' && selectedProjectId && (
            <ReportPreviewView
              projectId={selectedProjectId}
              onBack={() => setCurrentTab('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">EXAPRO</span>
            <span>•</span>
            <span>AI-Powered Software Project Evaluator & Documentation Generator</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>React + Vite + Tailwind CSS</span>
            <span>•</span>
            <span>Node.js + Express + TypeScript</span>
            <span>•</span>
            <span>MongoDB + Mongoose</span>
            <span>•</span>
            <span>Word DOCX + SVG</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
