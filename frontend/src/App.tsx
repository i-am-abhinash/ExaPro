import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { SubmissionView } from './components/SubmissionView';
import { ReportPreviewView } from './components/ReportPreviewView';
import { HistoryView } from './components/HistoryView';
import { AmbientBackground } from './components/ui/AmbientBackground';
import { IHealthStatus, IProjectListItem } from './types';
import { fetchHealth, fetchProjects } from './services/api';

export const App: React.FC = () => {
  // App navigation state: 'landing' | 'dashboard' | 'new' | 'history' | 'report'
  const [currentTab, setCurrentTab] = useState<'landing' | 'dashboard' | 'new' | 'history' | 'report'>('landing');
  const [submissionInitialType, setSubmissionInitialType] = useState<'zip' | 'github'>('zip');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasSeenLanding, setHasSeenLanding] = useState<boolean>(false);

  const [health, setHealth] = useState<IHealthStatus | null>(null);
  const [recentProjects, setRecentProjects] = useState<IProjectListItem[]>([]);

  // Load backend health and recent projects
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

  // Transition from landing page to dashboard
  const handleGetStarted = () => {
    setHasSeenLanding(true);
    setCurrentTab('dashboard');
  };

  const handleDirectUpload = (type: 'zip' | 'github') => {
    setSubmissionInitialType(type);
    setHasSeenLanding(true);
    setCurrentTab('new');
  };

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

  const handleReturnToLanding = () => {
    setCurrentTab('landing');
  };

  return (
    <div className="relative min-h-screen bg-graphite text-cool-primary flex flex-col justify-between selection:bg-electric/25 selection:text-electric">
      {/* Restrained Graphite & Electric Canvas */}
      <AmbientBackground />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Navbar is displayed when not on the opening landing screen */}
        {currentTab !== 'landing' && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Navbar
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              health={health}
              hasSeenLanding={hasSeenLanding}
              onReturnToLanding={handleReturnToLanding}
            />
          </motion.div>
        )}

        <main className="flex-1 pb-16">
          <AnimatePresence mode="wait">
            {/* 1. Dedicated Opening Landing Experience */}
            {currentTab === 'landing' && (
              <motion.div
                key="landing-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  y: -10,
                  transition: { duration: 0.3, ease: 'easeOut' },
                }}
              >
                <LandingView
                  onGetStarted={handleGetStarted}
                  onDirectUpload={handleDirectUpload}
                  health={health}
                />
              </motion.div>
            )}

            {/* 2. Main Dashboard Command Center */}
            {currentTab === 'dashboard' && (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <DashboardView
                  onStartSubmission={handleStartSubmission}
                  onViewReport={handleViewReport}
                  recentProjects={recentProjects}
                  health={health}
                />
              </motion.div>
            )}

            {/* 3. Examine Project Submission Workflow */}
            {currentTab === 'new' && (
              <motion.div
                key="submission-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <SubmissionView
                  initialType={submissionInitialType}
                  onComplete={handleSubmissionComplete}
                />
              </motion.div>
            )}

            {/* 4. Project History */}
            {currentTab === 'history' && (
              <motion.div
                key="history-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <HistoryView
                  onViewReport={handleViewReport}
                  onNewAnalysis={() => {
                    setSubmissionInitialType('zip');
                    setCurrentTab('new');
                  }}
                />
              </motion.div>
            )}

            {/* 5. Report Preview & Technical Details */}
            {currentTab === 'report' && selectedProjectId && (
              <motion.div
                key="report-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <ReportPreviewView
                  projectId={selectedProjectId}
                  onBack={() => setCurrentTab('dashboard')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Minimalist Footer */}
      <footer className="relative z-10 border-t border-white/[0.10] bg-graphite-secondary/85 backdrop-blur-md py-6 text-xs text-cool-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-cool-primary">EXAPRO</span>
            <span>•</span>
            <span>AI-Powered Software Architecture Evaluator & Technical Documentation Engine</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-cool-muted font-mono">
            <span>Graphite + Electric Workspace</span>
            <span>•</span>
            <span>Layered Spatial Glass</span>
            <span>•</span>
            <span>Camera-Ready DOCX</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
