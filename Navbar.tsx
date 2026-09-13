import React from 'react';
import { 
  Cpu, 
  Sparkles, 
  FileText, 
  GitMerge, 
  Landmark, 
  BookOpen, 
  Sliders, 
  Bot, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'intake' | 'matching' | 'bank' | 'journal' | 'assistant';
  setActiveTab: (tab: 'intake' | 'matching' | 'bank' | 'journal' | 'assistant') => void;
  onOpenSettings: () => void;
  onRunBatchSTP: () => void;
  onUploadClick?: () => void;
  isProcessingBatch: boolean;
  hasGeminiKey: boolean;
  exceptionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onRunBatchSTP,
  onUploadClick,
  isProcessingBatch,
  hasGeminiKey,
  exceptionCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  AUTONOMOUS <span className="text-cyan-400">AP</span>
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full">
                  AI v4.2
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Autonomous Invoice OCR • 3-Way Reconciliation • GL Posting
              </p>
            </div>
          </div>

          {/* AI Engine Status & Quick Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <div className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {hasGeminiKey ? 'Gemini 3.8 Flash Active' : 'Intelligent Fallback Engine'}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 ml-1" />
            </div>

            {onUploadClick && (
              <button
                id="btn-nav-upload"
                onClick={onUploadClick}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload Invoice</span>
              </button>
            )}

            <button
              id="btn-batch-stp"
              onClick={onRunBatchSTP}
              disabled={isProcessingBatch}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              <span>{isProcessingBatch ? 'Matching...' : 'Run Auto-STP Batch'}</span>
            </button>

            <button
              id="btn-settings-config"
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Automation Rules & Tolerance Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none text-xs sm:text-sm font-medium">
          <button
            id="tab-intake"
            onClick={() => setActiveTab('intake')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'intake'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Invoice Ingestion & OCR</span>
          </button>

          <button
            id="tab-matching"
            onClick={() => setActiveTab('matching')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all relative ${
              activeTab === 'matching'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>2. 3-Way PO Reconciliation</span>
            {exceptionCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                {exceptionCount}
              </span>
            )}
          </button>

          <button
            id="tab-bank"
            onClick={() => setActiveTab('bank')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'bank'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>3. Bank Statement Matching</span>
          </button>

          <button
            id="tab-journal"
            onClick={() => setActiveTab('journal')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'journal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>4. GL Journal & Double-Entry</span>
          </button>

          <button
            id="tab-assistant"
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'assistant'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-300" />
            <span>5. AI Accounting Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
