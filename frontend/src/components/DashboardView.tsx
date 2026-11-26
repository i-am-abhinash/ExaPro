import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  UploadCloud,
  Github,
  FileText,
  Cpu,
  Database,
  Sparkles,
  GitBranch,
  Search,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { IProjectListItem, IHealthStatus } from '../types';
import { getDownloadDocxUrl, getDownloadFaultReportDocxUrl } from '../services/api';
import {
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassEmptyState,
} from './ui';

interface DashboardViewProps {
  onStartSubmission: (type: 'zip' | 'github') => void;
  onViewReport: (id: string) => void;
  recentProjects: IProjectListItem[];
  health: IHealthStatus | null;
}

// Native SVG avoids the third-party chart component's React hook dependency.
const QualityTrend: React.FC<{projects: IProjectListItem[]}> = ({projects}) => {
  const points = projects.map((p,i) => ({
    id:p._id, name:p.projectName, score:p.faultSummary!.qualityScore,
    x:projects.length === 1 ? 332 : 44+i*576/(projects.length-1),
    y:16+144*(1-Math.max(0,Math.min(100,p.faultSummary!.qualityScore))/100),
  }));
  const line = points.map(p=>p.x+','+p.y).join(' ');
  return (
    <figure className="mt-4" aria-label="Project quality scores by submission">
      <svg viewBox="0 0 640 190" className="w-full h-auto max-h-52 overflow-visible" role="img" aria-label={points.map(p=>p.name+': '+p.score+'/100').join('; ')}>
        <defs><linearGradient id="eclipse-trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60A5FA" stopOpacity=".26"/><stop offset="100%" stopColor="#60A5FA" stopOpacity="0"/></linearGradient></defs>
        {[0,25,50,75,100].map(v=>{const y=16+144*(1-v/100);return <g key={v}><line x1="44" y1={y} x2="620" y2={y} stroke="#94A3B8" strokeOpacity=".18" strokeDasharray="4 5"/><text x="34" y={y+4} textAnchor="end" fill="#94A3B8" fontSize="12">{v}</text></g>;})}
        {points.length>1&&<><polygon points={points[0].x+',160 '+line+' '+points[points.length-1].x+',160'} fill="url(#eclipse-trend-fill)"/><polyline points={line} fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></>}
        {points.map(p=><g key={p.id}><circle cx={p.x} cy={p.y} r="5" fill="#93C5FD" stroke="#080D19" strokeWidth="2"><title>{p.name}: {p.score}/100</title></circle></g>)}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-cool-muted mt-1">
        {points.map(p=><span key={p.id} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-aurora"/>{p.name}<strong className="text-cool-primary tabular-nums">{p.score}</strong></span>)}
      </figcaption>
    </figure>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartSubmission,
  onViewReport,
  recentProjects,
  health,
}) => {
  const [tableSearch, setTableSearch] = useState('');

  const ready = recentProjects.filter(p => p.status === 'completed' || p.status === 'completed_with_warnings');
  const assessed = recentProjects.filter(p => typeof p.faultSummary?.qualityScore === 'number' && Number.isFinite(p.faultSummary.qualityScore));
  const avg = assessed.length ? Math.round(assessed.reduce((n,p) => n + p.faultSummary!.qualityScore, 0) / assessed.length) : null;
  const findings = assessed.reduce((n,p) => n + p.faultSummary!.confirmedFaults + p.faultSummary!.potentialFaults, 0);
  const outcomes = assessed.reduce((n,p) => ({passed:n.passed+p.faultSummary!.passed,failed:n.failed+p.faultSummary!.failed,blocked:n.blocked+p.faultSummary!.blocked,total:n.total+p.faultSummary!.totalTests}), {passed:0,failed:0,blocked:0,total:0});
  const notTested = Math.max(0,outcomes.total-outcomes.passed-outcomes.failed-outcomes.blocked);
  const trend = [...assessed].sort((a,b) => new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()).slice(-8);
  const filteredProjects = recentProjects.filter(p => {
    const q = tableSearch.trim().toLowerCase();
    return [p.projectName,p.repositoryUrl,p.uploadedFileName,...(p.detectedTechnologies?.languages || [])].some(v => v?.toLowerCase().includes(q));
  });
  const itemVariants: Variants = { hidden:{opacity:0}, visible:{opacity:1} };
  const stats = [
    {label:'Total projects',value:recentProjects.length,icon:Cpu,detail:'Submitted repositories',color:'text-aurora'},
    {label:'Average quality',value:avg===null?'—':avg+'/100',icon:Activity,detail:assessed.length+' assessed projects',color:'text-status-success'},
    {label:'Detected findings',value:findings,icon:ShieldAlert,detail:'Confirmed + potential',color:'text-status-warning'},
    {label:'Reports ready',value:ready.length,icon:FileText,detail:'Completed evaluations',color:'text-ice'},
  ];
  const segments = [{label:'Passed',value:outcomes.passed,color:'#34D399'},{label:'Failed',value:outcomes.failed,color:'#F87171'},{label:'Blocked',value:outcomes.blocked,color:'#FBBF24'},{label:'Not tested',value:notTested,color:'#64748B'}];
  return (
    <motion.div initial="hidden" animate="visible" variants={itemVariants} className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 py-6 space-y-5">
      <div className="flex flex-wrap gap-4 items-end justify-between">
        <div><p className="text-xs font-semibold text-aurora tracking-widest uppercase mb-2">Engineering intelligence</p><h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Project overview</h1><p className="text-sm text-cool-muted mt-2">Analyze, test and understand your software.</p></div>
        <span className="text-xs text-cool-muted">Based on your stored project evaluations</span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map(({label,value,icon:Icon,detail,color}) => <div key={label} className="eclipse-card"><div className="flex items-center gap-2"><Icon size={17} className={color}/><span className="text-xs font-medium text-cool-muted">{label}</span></div><p className="text-2xl sm:text-3xl font-bold mt-4 tabular-nums">{value}</p><p className="text-xs text-cool-muted mt-2">{detail}</p></div>)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <section className="eclipse-card xl:col-span-2">
          <h2 className="font-semibold">Project quality trend</h2><p className="text-xs text-cool-muted mt-1">Latest assessed submissions · not version comparisons</p>
          {trend.length === 0 ? <div className="h-40 grid place-items-center text-sm text-cool-muted">Submit a project to see its quality score.</div> : <QualityTrend projects={trend}/>}
        </section>
        <section className="eclipse-card">
          <h2 className="font-semibold">Test results</h2><p className="text-xs text-cool-muted mt-1">Across recorded test plans</p>
          {outcomes.total > 0 ? <><div className="text-3xl font-bold mt-5">{Math.round(outcomes.passed/outcomes.total*100)}<span className="text-base text-cool-muted">%</span></div><p className="text-xs text-cool-muted mb-4">Planned checks passed</p><div className="flex h-2 rounded overflow-hidden">{segments.map(t=><div key={t.label} style={{width:100*t.value/outcomes.total+'%',background:t.color}}/>)}</div><div className="grid grid-cols-2 gap-3 mt-5">{segments.map(t=><div key={t.label} className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full" style={{background:t.color}}/><span className="text-cool-muted">{t.label}</span><span className="ml-auto font-semibold">{t.value}</span></div>)}</div></> : <div className="h-40 grid place-items-center text-sm text-cool-muted">No recorded tests yet.</div>}
        </section>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {([{type:'zip',icon:UploadCloud,title:'Upload ZIP archive',detail:'Analyze local project files · up to 50MB'},{type:'github',icon:Github,title:'Import GitHub repository',detail:'Inspect a public repository'}] as const).map(({type,icon:Icon,title,detail})=><button key={type} type="button" onClick={()=>onStartSubmission(type)} className="eclipse-card glass-tile-interactive text-left flex items-center gap-3"><span className="p-3 bg-aurora/10 text-aurora rounded-lg"><Icon size={20}/></span><span><strong className="block text-sm">{title}</strong><small className="text-cool-muted">{detail}</small></span></button>)}
        <section className="eclipse-card"><h2 className="text-xs font-semibold text-cool-muted uppercase tracking-wide">System status</h2><p className="flex items-center gap-2 text-xs mt-3"><Database size={14}/><span>MongoDB</span><span className={health?.database.isConnected?'ml-auto text-status-success':'ml-auto text-cool-muted'}>{health?.database.isConnected?'Connected':'Unknown / offline'}</span></p><p className="flex items-center gap-2 text-xs mt-3"><Sparkles size={14}/><span>AI mode</span><span className="ml-auto text-cool-secondary">{!health?'Unknown':health.geminiConfigured?'Gemini':'Deterministic'}</span></p></section>
      </div>
      {/* 3. Recent Project Evaluations Table Workspace */}
      <motion.div variants={itemVariants}>
        <div className="rounded-3xl glass-card overflow-hidden">
          {/* Table Header & Search Filter */}
          <div className="p-6 border-b border-white/[0.09] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-cool-primary tracking-tight">Recent Project Evaluations</h2>
              <p className="text-xs sm:text-sm text-cool-muted">
                Previously examined software repositories and camera-ready DOCX deliverable downloads
              </p>
            </div>

            <div className="w-full sm:w-80">
              <GlassInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filter by name, repo, or stack..."
                icon={<Search className="w-4 h-4 text-cool-muted" />}
              />
            </div>
          </div>

          {recentProjects.length === 0 ? (
            <GlassEmptyState
              icon={<FileText className="w-7 h-7" />}
              title="No project evaluations yet"
              description="Submit a project ZIP archive or public GitHub repository to generate your first technical evaluation report."
              actionText="Examine First Project"
              actionIcon={<UploadCloud className="w-4 h-4 text-[#080D19]" />}
              onAction={() => onStartSubmission('zip')}
            />
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-xs sm:text-sm text-cool-muted">
              No evaluated projects match &ldquo;{tableSearch}&rdquo;
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[rgba(16,24,39,0.85)] text-cool-muted border-b border-white/[0.12] uppercase tracking-wider font-bold text-[11px] backdrop-blur-md">
                  <tr>
                    <th className="py-3.5 px-6">Project Name</th>
                    <th className="py-3.5 px-6">Source</th>
                    <th className="py-3.5 px-6">Detected Stack</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Evaluated Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-cool-primary">
                  {filteredProjects.map((proj) => (
                    <tr key={proj._id} className="hover:bg-[rgba(59,130,246,0.08)] transition-colors group">
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(23,35,54,0.70)] border border-white/[0.12] flex items-center justify-center text-aurora flex-shrink-0 group-hover:border-aurora/40 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate max-w-[220px] font-bold text-cool-primary group-hover:text-aurora transition-colors">
                              {proj.projectName}
                            </p>
                            {proj.branch && (
                              <p className="text-[11px] text-cool-muted flex items-center space-x-1 font-mono">
                                <GitBranch className="w-3 h-3 text-cool-muted" />
                                <span>{proj.branch}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center space-x-1.5 text-cool-secondary">
                          {proj.submissionType === 'github' ? (
                            <>
                              <Github className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                              <span className="truncate max-w-[140px] font-mono text-[11px]">GitHub</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5 text-aurora flex-shrink-0" />
                              <span className="truncate max-w-[140px] text-[11px]">ZIP Archive</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(proj.detectedTechnologies?.languages || []).slice(0, 3).map((l) => (
                            <GlassBadge key={l} variant="neutral" size="sm">
                              {l}
                            </GlassBadge>
                          ))}
                          {(proj.detectedTechnologies?.languages || []).length > 3 && (
                            <span className="text-[10px] text-cool-muted self-center">
                              +{(proj.detectedTechnologies?.languages || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 space-y-1">
                        <div>
                          {proj.status === 'completed' ? (
                            <GlassBadge variant="success" dot size="sm">
                              Ready
                            </GlassBadge>
                          ) : proj.status === 'completed_with_warnings' ? (
                            <GlassBadge variant="warning" dot size="sm">
                              Warnings
                            </GlassBadge>
                          ) : proj.status === 'failed' ? (
                            <GlassBadge variant="error" dot size="sm">
                              Failed
                            </GlassBadge>
                          ) : (
                            <GlassBadge variant="aurora" dot pulse size="sm">
                              {proj.statusMessage || 'Analyzing...'}
                            </GlassBadge>
                          )}
                        </div>
                        {proj.faultSummary && (
                          <div className="flex items-center space-x-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                proj.faultSummary.qualityGrade === 'A'
                                  ? 'text-[#54D6A0] bg-[#54D6A0]/15 border border-[#54D6A0]/30'
                                  : proj.faultSummary.qualityGrade === 'B'
                                  ? 'text-[#60A5FA] bg-[#60A5FA]/15 border border-[#60A5FA]/30'
                                  : proj.faultSummary.qualityGrade === 'C'
                                  ? 'text-[#FFC66D] bg-[#FFC66D]/15 border border-[#FFC66D]/30'
                                  : 'text-[#FF8195] bg-[#FF8195]/15 border border-[#FF8195]/30'
                              }`}
                            >
                              Score: {proj.faultSummary.qualityScore} ({proj.faultSummary.qualityGrade})
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-cool-muted whitespace-nowrap text-xs">
                        {new Date(proj.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        {(proj.status === 'completed' || proj.status === 'completed_with_warnings') && (
                          <>
                            <GlassButton
                              variant="secondary"
                              size="sm"
                              onClick={() => onViewReport(proj._id)}
                            >
                              Inspect Reports
                            </GlassButton>
                            <a
                              href={getDownloadDocxUrl(proj._id)}
                              download
                              title="Download Technical Architecture DOCX"
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-aurora hover:bg-aurora-hover text-[#080D19] text-xs font-bold shadow-aurora-sm transition-colors"
                            >
                              <FileText className="w-3 h-3 text-[#080D19]" />
                              <span>Arch</span>
                            </a>
                            <a
                              href={getDownloadFaultReportDocxUrl(proj._id)}
                              download
                              title="Download Software Quality & Fault Report DOCX"
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl glass-tile-interactive text-cool-primary border border-white/[0.15] text-xs font-bold transition-colors"
                            >
                              <ShieldAlert className="w-3 h-3 text-[#FF8998]" />
                              <span>Faults</span>
                            </a>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
