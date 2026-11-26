import React, { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { Layers, LayoutDashboard, Plus, FolderOpen, FileText, Menu, PanelLeftClose, Home, Activity } from 'lucide-react';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { SubmissionView } from './components/SubmissionView';
import { ReportPreviewView } from './components/ReportPreviewView';
import { HistoryView } from './components/HistoryView';
import { IHealthStatus, IProjectListItem } from './types';
import { fetchHealth, fetchProjects } from './services/api';

type Page = 'landing' | 'dashboard' | 'new' | 'history' | 'report';
const pageNames: Record<Page, string> = { landing: 'Home', dashboard: 'Overview', new: 'New analysis', history: 'My projects', report: 'Project report' };

export const App: React.FC = () => {
  const [page, setPage] = useState<Page>('landing');
  const [collapsed, setCollapsed] = useState(false);
  const [source, setSource] = useState<'zip' | 'github'>('zip');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [health, setHealth] = useState<IHealthStatus | null>(null);
  const [projects, setProjects] = useState<IProjectListItem[]>([]);

  useEffect(() => {
    let active = true;
    fetchHealth().then(h => { if (active) setHealth(h); }).catch(() => { if (active) setHealth(null); });
    fetchProjects().then(p => { if (active) setProjects(p); }).catch(console.warn);
    return () => { active = false; };
  }, [page]);

  const navigate = (next: Page) => { setPage(next); window.scrollTo(0, 0); };
  const submit = (type: 'zip' | 'github') => { setSource(type); navigate('new'); };
  const openReport = (id: string) => { setProjectId(id); navigate('report'); };
  const links: { id: Page; icon: typeof Layers; label: string }[] = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Overview' },
    { id: 'new' as const, icon: Plus, label: 'New analysis' },
    { id: 'history' as const, icon: FolderOpen, label: 'My projects' },
  ];
  if (projectId) links.push({ id: 'report', icon: FileText, label: 'Project report' });
  return (
    <MotionConfig reducedMotion="user">
      {page === 'landing' ? (
        <div className="eclipse-landing"><LandingView onGetStarted={() => navigate('dashboard')} onDirectUpload={submit} health={health} /></div>
      ) : (
        <div className={`eclipse-shell ${collapsed ? 'is-collapsed' : ''}`}>
          <aside className="eclipse-sidebar">
            <div className="eclipse-brand">
              <button type="button" onClick={() => navigate('landing')} className="eclipse-brand-link" aria-label="ExaPro home">
                <span className="eclipse-logo"><Layers size={21}/></span>
                <span className="eclipse-nav-label"><strong>ExaPro</strong><small>ENGINEERING WORKSPACE</small></span>
              </button>
              <button type="button" className="eclipse-collapse" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>{collapsed ? <Menu size={17}/> : <PanelLeftClose size={17}/>}</button>
            </div>
            <p className="eclipse-nav-heading">WORKSPACE</p>
            <nav aria-label="Workspace navigation" className="eclipse-nav">
              {links.map(({id, icon: Icon, label}) => (
                <button key={id} type="button" title={label} aria-current={page === id ? 'page' : undefined} className={page === id ? 'active' : ''} onClick={() => id === 'new' ? submit('zip') : navigate(id)}>
                  <Icon size={18}/><span className="eclipse-nav-label">{label}</span>
                </button>
              ))}
            </nav>
            <div className="eclipse-sidebar-bottom">
              <button type="button" className="eclipse-home" onClick={() => navigate('landing')} title="Home"><Home size={18}/><span className="eclipse-nav-label">Home</span></button>
              <div className="eclipse-sidebar-status"><Activity size={17} className={health?.database.isConnected ? 'text-status-success' : 'text-cool-muted'}/><span className="eclipse-nav-label"><strong>System status</strong><small>{health?.database.isConnected ? 'Database connected' : 'Not connected / unknown'}</small></span></div>
            </div>
          </aside>
          <div className="eclipse-main">
            <header className="eclipse-topbar">
              <div className="text-xs sm:text-sm text-cool-muted">Workspace <span className="mx-2 text-cool-muted">/</span><span className="text-cool-primary font-semibold">{pageNames[page]}</span></div>
              <button type="button" className="eclipse-primary eclipse-top-action" onClick={() => submit('zip')}><Plus size={16}/> <span>New analysis</span></button>
            </header>
            <main key={page} className="eclipse-content">
              {page === 'dashboard' && <DashboardView onStartSubmission={submit} onViewReport={openReport} recentProjects={projects} health={health}/>}
              {page === 'new' && <SubmissionView initialType={source} onComplete={openReport}/>}
              {page === 'history' && <HistoryView onViewReport={openReport} onNewAnalysis={() => submit('zip')}/>}
              {page === 'report' && projectId && <ReportPreviewView key={projectId} projectId={projectId} onBack={() => navigate('dashboard')}/>}
            </main>
            <footer className="eclipse-footer">EXAPRO <span>Software analysis · Testing · Documentation</span></footer>
          </div>
        </div>
      )}
    </MotionConfig>
  );
};
export default App;
