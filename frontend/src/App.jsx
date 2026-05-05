/**
 * Smart Data Storytelling Tool - Main Application
 * ------------------------------------------------
 * Root component that orchestrates the entire UI:
 * file upload → dashboard → charts → insights → chat
 */

import React, { useState, useCallback } from 'react';
import {
  LayoutDashboard, BarChart3, Sparkles, MessageCircle,
  Upload, Download, History, BookOpen, ChevronRight,
  Loader2, Database, ArrowLeft
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

import FileUpload from './components/FileUpload.jsx';
import DashboardOverview from './components/DashboardOverview.jsx';
import ChartsPanel from './components/ChartsPanel.jsx';
import InsightsPanel from './components/InsightsPanel.jsx';
import DataStoryPanel from './components/DataStoryPanel.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import AnimatedBackground from './components/AnimatedBackground.jsx';
import { uploadAndAnalyze, chatWithData, exportPDF, refreshStory } from './services/api.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'charts', label: 'Visualizations', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: Sparkles },
  { id: 'story', label: 'Data Story', icon: BookOpen },
  { id: 'chat', label: 'Ask Data', icon: MessageCircle },
];

function Header({ hasData, onNewUpload, onExportPDF, isExporting }) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border-color)]"
      style={{
        background: 'rgba(10, 10, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-glow)' }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--text-primary)] leading-tight">
              DataStory<span className="gradient-text">AI</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              Smart Data Storytelling
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex items-center gap-2">
            <button onClick={onNewUpload} className="btn-ghost text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Dataset</span>
            </button>
            <button
              onClick={onExportPDF}
              disabled={isExporting}
              className="btn-primary text-xs"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function LandingHero({ children }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative z-10 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] absolute top-1/4 right-1/4" />
      </div>

      {/* Hero Text */}
      <div className="flex flex-col items-center justify-center text-center mb-6 relative z-10 w-full max-w-4xl mx-auto animate-fadeInUp">
        <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-semibold text-[var(--accent-primary)] bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md hover:bg-[rgba(99,102,241,0.15)] transition-colors duration-300">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Next-Generation Data Intelligence</span>
        </div>
        
        <h1 className="flex flex-col items-center justify-center text-5xl sm:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.1] w-full">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 pb-2">
            Turn Raw Data Into
          </span>
          <span className="gradient-text drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] mt-1 sm:mt-2 pb-2">
            Beautiful Stories
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed font-medium">
          Upload your dataset and let our AI instantly analyze, visualize, and narrate the hidden patterns in your numbers.
        </p>
      </div>

      {/* Upload Component — main action, highlighted with glow */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center justify-center animate-fadeInUp" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
        {children}
      </div>

      {/* Features Grid — 4 equal-width cards, same max-width centering */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-24 w-full max-w-4xl mx-auto relative z-10 animate-fadeInUp"
        style={{ animationDelay: '300ms', animationFillMode: 'both' }}
      >
        {[
          { icon: Database, label: 'Auto EDA', desc: 'Statistical analysis' },
          { icon: BarChart3, label: 'Smart Charts', desc: 'Interactive plots' },
          { icon: Sparkles, label: 'AI Stories', desc: 'LLM narratives' },
          { icon: MessageCircle, label: 'Data Chat', desc: 'Ask anything' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="glass-card p-6 text-center group hover:border-[var(--accent-primary)] transition-all duration-300 cursor-default">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-colors duration-300">
              <Icon className="w-6 h-6 text-[var(--accent-primary)] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1 group-hover:text-white transition-colors">{label}</p>
            <p className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabNav({ activeTab, onTabChange, chartCount, hasInsights }) {
  return (
    <nav
      className="sticky top-16 z-30 border-b border-[var(--border-color)] mb-6"
      style={{
        background: 'rgba(10, 10, 26, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-full px-6 sm:px-8 lg:px-12">
        <div className="flex items-center gap-1 overflow-x-auto py-1 -mb-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => onTabChange(id)}
              className={`tab-button flex items-center gap-2 ${activeTab === id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {id === 'charts' && chartCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === id ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: activeTab === id ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {chartCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleUpload = useCallback(async (file, setProgress) => {
    setIsLoading(true);
    try {
      const data = await uploadAndAnalyze(file, setProgress);
      setAnalysisData(data);
      setActiveTab('overview');
      toast.success('Analysis complete! Your data story is ready.', {
        duration: 4000,
        style: {
          background: '#161636',
          color: '#e2e8f0',
          border: '1px solid rgba(99,102,241,0.3)',
        },
        iconTheme: { primary: '#6366f1', secondary: '#fff' },
      });
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Upload failed';
      toast.error(message, {
        duration: 5000,
        style: {
          background: '#161636',
          color: '#e2e8f0',
          border: '1px solid rgba(239,68,68,0.3)',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (question) => {
    if (!analysisData?.session_id) return 'No active session.';
    const response = await chatWithData(analysisData.session_id, question);
    return response.answer;
  }, [analysisData]);

  const handleExportPDF = useCallback(async () => {
    if (!analysisData?.session_id) return;
    setIsExporting(true);
    try {
      const blob = await exportPDF(analysisData.session_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysisData.report_title?.replace(/\s+/g, '_') || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('PDF report downloaded!', {
        style: {
          background: '#161636',
          color: '#e2e8f0',
          border: '1px solid rgba(34,197,94,0.3)',
        },
        iconTheme: { primary: '#22c55e', secondary: '#fff' },
      });
    } catch (err) {
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [analysisData]);

  const handleRefreshStory = useCallback(async () => {
    if (!analysisData?.session_id) return;
    try {
      const response = await refreshStory(analysisData.session_id);
      setAnalysisData(prev => ({ ...prev, story: response.story }));
      toast.success('Story regenerated!', {
        style: {
          background: '#161636',
          color: '#e2e8f0',
          border: '1px solid rgba(99,102,241,0.3)',
        },
      });
    } catch (err) {
      toast.error('Failed to regenerate story.');
    }
  }, [analysisData]);

  const handleNewUpload = () => {
    setAnalysisData(null);
    setActiveTab('overview');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview data={analysisData} />;
      case 'charts':
        return <ChartsPanel charts={analysisData.charts || []} />;
      case 'insights':
        return (
          <InsightsPanel
            data={analysisData}
            onRefreshStory={handleRefreshStory}
          />
        );
      case 'story':
        return <DataStoryPanel data={analysisData} />;
      case 'chat':
        return (
          <ChatInterface
            sessionId={analysisData.session_id}
            chatHistory={analysisData.chat_history || []}
            onSendMessage={handleSendMessage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10">
      <Toaster position="top-right" />

      <Header
        hasData={!!analysisData}
        onNewUpload={handleNewUpload}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
      />

      {!analysisData ? (
        <LandingHero>
          <FileUpload onUpload={handleUpload} isLoading={isLoading} />
        </LandingHero>
      ) : (
        <div>
          <TabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            chartCount={analysisData.charts?.length || 0}
          />
          <main className="w-full px-6 sm:px-8 lg:px-12 pb-16">
            {renderTabContent()}
          </main>
        </div>
      )}
    </div>
    </>
  );
}
