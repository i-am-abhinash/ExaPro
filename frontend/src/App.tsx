import React, { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Layers, Plus, FolderOpen, FileText, Menu, PanelLeftClose, Home, ShieldCheck } from 'lucide-react';
import { LandingView } from './components/LandingView';
import { SubmissionView } from './components/SubmissionView';
import { ReportPreviewView } from './components/ReportPreviewView';
import { HistoryView } from './components/HistoryView';

type Page = 'landing' | 'new' | 'history' | 'report';
const pageNames: Record<Page, string> = { landing: 'Home', new: 'New analysis', history: 'My projects', report: 'Project report' };

export const App: React.FC = () => {
  const [page, setPage] = useState<Page>('landing');
  const [collapsed, setCollapsed] = useState(false);
  const [source, setSource] = useState<'zip' | 'github'>('zip');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [submissionKey, setSubmissionKey] = useState(0);

  const navigate = (next: Page) => { setPage(next); window.scrollTo(0, 0); };
  const submit = (type: 'zip' | 'github') => { setSource(type); setSubmissionKey(v=>v+1); setProjectId(null); navigate('new'); };
  const openReport = (id: string) => { setProjectId(id); navigate('report'); };
  const links: { id: Page; icon: typeof Layers; label: string }[] = [
    { id: 'new' as const, icon: Plus, label: 'New analysis' },
    { id: 'history' as const, icon: FolderOpen, label: 'My projects' },
  ];
  if (projectId) links.push({ id: 'report', icon: FileText, label: 'Project report' });
  return (
    <MotionConfig reducedMotion="user">
      {page === 'landing' ? (
        <div className="eclipse-landing"><LandingView onGetStarted={() => submit('zip')} onDirectUpload={submit} /></div>
      ) : (
        <div data-page={page} className={`eclipse-shell ${collapsed ? 'is-collapsed' : ''}`}>
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
              <div className="eclipse-sidebar-status"><ShieldCheck size={17} className="text-aurora"/><span className="eclipse-nav-label"><strong>Guest workspace</strong><small>History saved to this browser</small></span></div>
            </div>
          </aside>
          <div className="eclipse-main">
            <header className="eclipse-topbar">
              <div className="text-xs sm:text-sm text-cool-muted">Workspace <span className="mx-2 text-cool-muted">/</span><span className="text-cool-primary font-semibold">{pageNames[page]}</span></div>
              <button type="button" className="eclipse-primary eclipse-top-action" onClick={() => submit('zip')}><Plus size={16}/> <span>New analysis</span></button>
            </header>
            <main key={page} className="eclipse-content">

              {page === 'new' && <SubmissionView key={submissionKey} initialType={source} onComplete={openReport}/>}
              {page === 'history' && <HistoryView onViewReport={openReport} onNewAnalysis={() => submit('zip')}/>}
              {page === 'report' && projectId && <ReportPreviewView key={projectId} projectId={projectId} onBack={() => navigate('history')}/>}
            </main>
            <footer className="eclipse-footer">EXAPRO <span>Software analysis · Testing · Documentation</span></footer>
          </div>
        </div>
      )}
    </MotionConfig>
  );
};
export default App;
