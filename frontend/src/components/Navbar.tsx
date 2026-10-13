import React from 'react';
import { Layers, FileText, History, PlusCircle, Database, Sparkles, CheckCircle2 } from 'lucide-react';
import { IHealthStatus } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'new' | 'history' | 'report';
  setCurrentTab: (tab: 'dashboard' | 'new' | 'history' | 'report') => void;
  health: IHealthStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, health }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                EXAPRO
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                DOCX
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">AI Project Documentation Generator</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('new')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'new'
                ? 'bg-gradient-to-r from-violet-600/30 to-cyan-500/30 text-white border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-violet-400" />
            <span>New Analysis</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>History</span>
          </button>
        </nav>

        {/* System Health Indicators */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          {health?.database.isConnected ? (
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
              title={`MongoDB: ${health.database.connectionType}`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="font-medium">MongoDB Active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400">
              <Database className="w-3.5 h-3.5" />
              <span>Connecting DB...</span>
            </div>
          )}

          {health?.geminiConfigured ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini AI Ready</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400" title="Deterministic static inspection mode active">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deterministic Engine</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
