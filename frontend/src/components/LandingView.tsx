import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, UploadCloud, Github, Layers, ShieldCheck, FileText, Cpu, Activity, GitBranch } from 'lucide-react';

interface LandingViewProps {
  onGetStarted: () => void;
  onDirectUpload: (type: 'zip' | 'github') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({onGetStarted,onDirectUpload}) => (
  <div className="min-h-screen max-w-[1440px] mx-auto px-5 sm:px-10 flex flex-col">
    <header className="flex items-center justify-between gap-4 py-6 border-b border-white/10">
      <div className="flex items-center gap-3"><span className="eclipse-logo"><Layers size={22}/></span><span className="text-xl font-bold tracking-tight">ExaPro</span></div>
      <button type="button" className="eclipse-primary" onClick={onGetStarted}>Get started <ArrowRight size={16}/></button>
    </header>
    <main className="flex-1 flex flex-col justify-center py-16 gap-12">
      <motion.section initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3}} className="grid lg:grid-cols-2 items-center gap-12">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-aurora/30 bg-aurora/10 text-aurora text-xs font-medium"><Activity size={13}/> AI-powered software analysis</p>
          <h1 className="mt-6 text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.07]">Your code.<br/><span className="text-aurora">Understood.</span></h1>
          <p className="mt-6 text-cool-secondary text-base sm:text-lg leading-relaxed max-w-xl">Inspect your software architecture, evaluate source findings and testing results, and generate professional technical reports from a ZIP archive or GitHub repository.</p>
          <div className="mt-8 flex flex-wrap gap-3"><button className="eclipse-primary" type="button" onClick={onGetStarted}>Get started <ArrowRight size={17}/></button><button className="glass-tile-interactive px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2" type="button" onClick={()=>onDirectUpload('github')}><Github size={17}/> Import GitHub</button><button className="glass-tile-interactive px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2" type="button" onClick={()=>onDirectUpload('zip')}><UploadCloud size={17}/> Upload ZIP</button></div>
        </div>
        <div className="eclipse-card space-y-4 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-sm font-semibold"><GitBranch size={17} className="text-aurora"/> Analysis workflow</span><span className="text-[10px] text-cool-muted">EXAPRO ENGINE</span></div>
          {([{icon:UploadCloud,title:'01 / Import project',desc:'Local archive or public GitHub repository'},{icon:Cpu,title:'02 / Inspect architecture',desc:'Detect languages, components and relationships'},{icon:ShieldCheck,title:'03 / Evaluate quality',desc:'Review testing results and source findings'},{icon:FileText,title:'04 / Export reports',desc:'Technical architecture and fault documentation'}]).map(({icon:Icon,title,desc})=><div className="silk-workflow-step flex items-center gap-4 border rounded-xl p-4" key={title}><span className="rounded-lg bg-aurora/10 text-aurora p-3"><Icon size={20}/></span><div><h2 className="text-sm font-semibold">{title}</h2><p className="text-xs text-cool-muted mt-1">{desc}</p></div></div>)}
        </div>
      </motion.section>
      <section className="grid sm:grid-cols-3 gap-3" aria-label="Platform capabilities">
        {([{icon:Layers,title:'Architecture intelligence',desc:'Explore the detected stack and system topology.'},{icon:ShieldCheck,title:'Evidence-based findings',desc:'Inspect recorded defects and test outcomes.'},{icon:FileText,title:'Technical documentation',desc:'Preview and export generated Word reports.'}]).map(({icon:Icon,title,desc})=><article className="eclipse-card" key={title}><Icon size={20} className="text-aurora"/><h2 className="font-semibold mt-3">{title}</h2><p className="text-sm text-cool-muted mt-2">{desc}</p></article>)}
      </section>
    </main>
    <footer className="border-t border-white/10 py-5 flex flex-wrap justify-between gap-3 text-xs text-cool-muted"><span>EXAPRO · ECLIPSE WORKSPACE</span><span>Architecture · Quality · Documentation</span></footer>
  </div>
);
