import React, { useState, useEffect } from 'react';
import { dataService } from '../services/api';
import PlotlyChart from './PlotlyChart';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function Dashboard({ initialSession, user, onNewUpload, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [session, setSession] = useState(initialSession);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [sendingChat, setSendingChat] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [refreshingStory, setRefreshingStory] = useState(false);

  const sessionId = session?.session_id;

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Sync chat history when active session changes
  useEffect(() => {
    if (session?.chat_history) {
      // Chat history is formatted as a list of { question, answer, timestamp }
      const messages = [];
      session.chat_history.forEach(item => {
        messages.push({ role: 'user', text: item.question });
        messages.push({ role: 'assistant', text: item.answer });
      });
      setChatMessages(messages);
    } else {
      setChatMessages([]);
    }
  }, [session]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await dataService.getSessions();
      setHistory(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectHistory = async (histId) => {
    if (histId === sessionId) return;
    toast.loading('Loading analysis...', { id: 'load-session' });
    try {
      const data = await dataService.getSession(histId);
      setSession(data);
      setActiveTab('overview');
      toast.success('Loaded successfully', { id: 'load-session' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analysis', { id: 'load-session' });
    }
  };

  const handleDeleteHistory = async (e, histId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this analysis session?')) return;
    
    try {
      await dataService.deleteSession(histId);
      toast.success('Session deleted');
      // If deleted active session, clean active session state
      if (histId === sessionId) {
        if (history.length > 1) {
          const nextIndex = history.findIndex(h => h.session_id === histId) === 0 ? 1 : 0;
          handleSelectHistory(history[nextIndex].session_id);
        } else {
          onNewUpload();
        }
      }
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete session');
    }
  };

  const handleRefreshStory = async () => {
    setRefreshingStory(true);
    try {
      const data = await dataService.refreshStory(sessionId);
      setSession({
        ...session,
        story: data.story
      });
      toast.success('AI story regenerated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to regenerate story');
    } finally {
      setRefreshingStory(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;

    const userMsg = chatQuestion;
    setChatQuestion('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSendingChat(true);

    try {
      const data = await dataService.chatWithData(sessionId, userMsg);
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (err) {
      console.error(err);
      toast.error('Chat error: failed to fetch answer');
    } finally {
      setSendingChat(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    toast.loading('Generating PDF report...', { id: 'pdf-toast' });
    try {
      await dataService.downloadPdf(sessionId, session.report_title);
      toast.success('PDF downloaded!', { id: 'pdf-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF', { id: 'pdf-toast' });
    } finally {
      setExportingPdf(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'analytics' },
    { id: 'preprocessing', name: 'Data Prep', icon: 'cleaning_services' },
    { id: 'visualizations', name: 'Charts', icon: 'query_stats' },
    { id: 'ml', name: 'ML Insights', icon: 'psychology' },
    { id: 'story', name: 'AI Narrative', icon: 'auto_stories' },
    { id: 'chat', name: 'Chat Data', icon: 'forum' },
  ];

  return (
    <div className="flex h-screen bg-[#0d0e0f] text-[#e3e2e2] overflow-hidden select-none font-sans">
      
      {/* 1. SIDEBAR */}
      <aside className="w-80 border-r border-white/8 bg-[#121414]/90 flex flex-col z-20 backdrop-blur-md">
        {/* Sidebar Header */}
        <div className="h-16 border-b border-white/8 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb0c8]">analytics</span>
            <span className="font-bold text-lg font-mono tracking-wider text-white">DataStoryAi</span>
          </div>
          <button
            onClick={onNewUpload}
            className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer tooltip"
            title="Upload new dataset"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-white/40 px-2">
            <span>Analysis History</span>
            <span className="material-symbols-outlined text-xs">history</span>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-xs text-white/30 py-8">
              No analysis history yet
            </div>
          ) : (
            <div className="space-y-1.5">
              {history.map((hist) => {
                const isActive = hist.session_id === sessionId;
                return (
                  <div
                    key={hist.session_id}
                    onClick={() => handleSelectHistory(hist.session_id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-[#ffb0c8]/8 border-[#ffb0c8]/25 text-white font-medium' 
                        : 'bg-transparent border-transparent hover:bg-white/3 hover:border-white/5 text-white/60'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs truncate font-medium">{hist.report_title}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40 font-mono">
                        <span className="truncate">{hist.filename}</span>
                        <span>•</span>
                        <span className="uppercase text-[#efbc94]">{hist.domain}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistory(e, hist.session_id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-all cursor-pointer ml-2"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer User profile */}
        <div className="p-4 border-t border-white/8 bg-black/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ffb0c8] to-[#efbc94] flex items-center justify-center text-[#5e1133] font-bold text-sm select-none shadow-md">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{user?.username}</span>
                <span className="text-[10px] text-white/40 truncate font-mono">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0e0f]">
        
        {/* Main Header */}
        <header className="h-16 border-b border-white/8 px-8 flex items-center justify-between bg-[#121414]/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight truncate max-w-md">
              {session?.report_title}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#efbc94]/10 text-[#efbc94] border border-[#efbc94]/20 shadow-sm">
              {session?.domain} Domain
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/45 hidden sm:inline truncate max-w-xs font-mono">
              Dataset: {session?.filename}
            </span>
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-2 bg-white text-black hover:bg-white/90 px-4 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {exportingPdf ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-sm font-bold">picture_as_pdf</span>
              )}
              Export PDF
            </button>
          </div>
        </header>

        {/* Tab Controls Bar */}
        <div className="h-12 border-b border-white/8 px-8 flex items-center bg-[#121414]/15">
          <div className="flex gap-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#ffb0c8] text-[#5e1133] font-black'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Canvas */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#090a0a]/30">
          <div className="max-w-[1200px] mx-auto space-y-6">

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && session?.data_overview && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Stats Summary Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card rounded-2xl p-5 border border-white/8">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">Total Rows</span>
                    <span className="text-3xl font-mono font-semibold text-white mt-1 block">
                      {session.data_overview.shape?.[0]?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/8">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">Total Columns</span>
                    <span className="text-3xl font-mono font-semibold text-white mt-1 block">
                      {session.data_overview.shape?.[1]?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/8">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">Numerical Columns</span>
                    <span className="text-3xl font-mono font-semibold text-[#ffb0c8] mt-1 block">
                      {session.data_overview.numerical_cols?.length || 0}
                    </span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/8">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">Categorical Columns</span>
                    <span className="text-3xl font-mono font-semibold text-[#efbc94] mt-1 block">
                      {session.data_overview.categorical_cols?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Columns Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card rounded-2xl p-6 border border-white/8 md:col-span-2 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#ffb0c8]">view_list</span>
                      Columns Metadata
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/8 text-white/45">
                            <th className="py-2.5 font-mono uppercase tracking-wider">Column Name</th>
                            <th className="py-2.5 font-mono uppercase tracking-wider">Data Type</th>
                            <th className="py-2.5 font-mono uppercase tracking-wider text-right">Missing (Null) Values</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {Object.entries(session.data_overview.column_types || {}).map(([colName, colType]) => {
                            const nullCount = session.data_overview.null_counts?.[colName] || 0;
                            const isNumeric = session.data_overview.numerical_cols?.includes(colName);
                            return (
                              <tr key={colName} className="hover:bg-white/2 text-white/85">
                                <td className="py-2.5 font-medium">{colName}</td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isNumeric ? 'bg-[#ffb0c8]/10 text-[#ffb0c8]' : 'bg-[#efbc94]/10 text-[#efbc94]'
                                  }`}>
                                    {colType}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-semibold">
                                  {nullCount > 0 ? (
                                    <span className="text-red-400">{nullCount.toLocaleString()}</span>
                                  ) : (
                                    <span className="text-emerald-400">0</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6 border border-white/8 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#efbc94]">pie_chart</span>
                      Dataset Quality
                    </h3>
                    <div className="space-y-4">
                      {/* Calculate total missing values */}
                      {(() => {
                        const totalCells = session.data_overview.shape?.[0] * session.data_overview.shape?.[1] || 1;
                        const totalNulls = Object.values(session.data_overview.null_counts || {}).reduce((a, b) => a + b, 0);
                        const fillRate = (((totalCells - totalNulls) / totalCells) * 100).toFixed(2);
                        const nullRate = ((totalNulls / totalCells) * 100).toFixed(2);

                        return (
                          <>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-white/60">Data Density Fill Rate</span>
                                <span className="text-white font-bold">{fillRate}%</span>
                              </div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${fillRate}%` }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-white/60">Missing Values Rate</span>
                                <span className="text-white font-bold">{nullRate}%</span>
                              </div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-red-400 rounded-full" style={{ width: `${nullRate}%` }} />
                              </div>
                            </div>

                            <div className="pt-3 border-t border-white/5 space-y-2">
                              <div className="flex justify-between text-xs font-mono text-white/50">
                                <span>Total cells</span>
                                <span className="text-white/80">{totalCells.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-mono text-white/50">
                                <span>Missing elements</span>
                                <span className="text-white/80">{totalNulls.toLocaleString()}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Dataset Preview */}
                {session.data_overview.head_preview && (
                  <div className="glass-card rounded-2xl p-6 border border-white/8 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#ffb0c8]">table_rows</span>
                      Dataset Preview (First 5 Rows)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-white/8 text-white/45 font-mono">
                            <th className="py-2 px-3">#</th>
                            {Object.keys(session.data_overview.head_preview[0] || {}).map(header => (
                              <th key={header} className="py-2 px-3 truncate max-w-[150px]">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-white/85">
                          {session.data_overview.head_preview.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/2">
                              <td className="py-2.5 px-3 text-white/40">{idx + 1}</td>
                              {Object.values(row).map((val, cellIdx) => (
                                <td key={cellIdx} className="py-2.5 px-3 truncate max-w-[150px]" title={String(val)}>
                                  {val === null || val === undefined ? (
                                    <span className="text-red-400/50 italic">null</span>
                                  ) : typeof val === 'number' ? (
                                    val.toLocaleString(undefined, { maximumFractionDigits: 4 })
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PREPROCESSING */}
            {activeTab === 'preprocessing' && session?.preprocessing_report && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="glass-card rounded-2xl p-6 border border-white/8 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/8 pb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#ffb0c8]">cleaning_services</span>
                      Data Quality Engineering & Imputations
                    </h3>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono uppercase rounded-full">
                      Pipeline Clean Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columns Imputed */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono">Missing Values Imputations</h4>
                      {Object.keys(session.preprocessing_report.imputations || {}).length === 0 ? (
                        <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-xs text-white/45 italic font-mono">
                          No missing values required imputation.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(session.preprocessing_report.imputations).map(([col, method]) => (
                            <div key={col} className="flex justify-between items-center p-3 rounded-xl bg-white/2 border border-white/5 font-mono text-xs">
                              <span className="font-semibold text-white/80">{col}</span>
                              <span className="px-2 py-0.5 rounded bg-[#ffb0c8]/10 text-[#ffb0c8] font-bold">
                                {String(method)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cleaning Stats */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono">Cleaning & Duplication Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/2 border border-white/5 font-mono">
                          <span className="text-[10px] text-white/40 block">Duplicates Deleted</span>
                          <span className="text-xl font-bold text-white mt-1 block">
                            {session.preprocessing_report.duplicates_removed || 0}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/2 border border-white/5 font-mono">
                          <span className="text-[10px] text-white/40 block">Outliers Detected</span>
                          <span className="text-xl font-bold text-[#efbc94] mt-1 block">
                            {session.preprocessing_report.outliers_detected || 0}
                          </span>
                        </div>
                      </div>

                      {/* Summary Notes */}
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-xs text-white/55 leading-relaxed space-y-2">
                        <div className="flex gap-2">
                          <span className="material-symbols-outlined text-xs text-emerald-400 mt-0.5">check_circle</span>
                          <p>Whitespace trimmed and standard category casings normalized automatically.</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="material-symbols-outlined text-xs text-emerald-400 mt-0.5">check_circle</span>
                          <p>Numeric values normalized. Outliers detected via standard IQR (Interquartile Range) boundary tests.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VISUALIZATIONS */}
            {activeTab === 'visualizations' && session?.charts && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#ffb0c8]">query_stats</span>
                    Exploratory Visualizations
                  </h3>
                  <span className="text-xs text-white/40 font-mono">
                    Total Plots: {session.charts.length}
                  </span>
                </div>

                {session.charts.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 border border-white/8 text-center text-white/40 italic text-sm">
                    No charts generated for this dataset.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {session.charts.map((c, idx) => {
                      if (!c.chart) return null;
                      return (
                        <div key={c.id || idx} className="glass-card rounded-2xl p-5 border border-white/8 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-white/6 pb-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                              {c.title || 'Data Chart'}
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-white/45 text-[9px] font-bold uppercase tracking-wider font-mono">
                              {c.type || 'Plotly'}
                            </span>
                          </div>
                          <div className="w-full flex items-center justify-center">
                            <PlotlyChart data={c.chart.data} layout={c.chart.layout} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ML INSIGHTS */}
            {activeTab === 'ml' && session?.ml_results && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#ffb0c8]">psychology</span>
                    Machine Learning Models & Patterns
                  </h3>
                  <span className="px-2.5 py-1 bg-[#efbc94]/10 text-[#efbc94] border border-[#efbc94]/20 text-[10px] font-bold font-mono uppercase rounded-full">
                    Auto-ML Engine Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Clustering Insights */}
                  {session.ml_results.clustering && (
                    <div className="glass-card rounded-2xl p-6 border border-white/8 space-y-4">
                      <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-[#ffb0c8]">blur_on</span>
                        <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">K-Means Segment Clusters</h4>
                      </div>
                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between border-b border-white/5 py-1.5 text-white/60">
                          <span>Clusters Formed (K)</span>
                          <span className="text-white font-bold">{session.ml_results.clustering.n_clusters || 3}</span>
                        </div>
                        {session.ml_results.clustering.silhouette_score && (
                          <div className="flex justify-between border-b border-white/5 py-1.5 text-white/60">
                            <span>Silhouette Score</span>
                            <span className="text-white font-bold">{session.ml_results.clustering.silhouette_score.toFixed(4)}</span>
                          </div>
                        )}
                        {session.ml_results.clustering.cluster_sizes && (
                          <div className="space-y-1.5 pt-2">
                            <span className="text-[10px] text-white/40 uppercase block">Cluster Distribution Sizes</span>
                            {Object.entries(session.ml_results.clustering.cluster_sizes).map(([cls, size]) => (
                              <div key={cls} className="flex justify-between items-center">
                                <span>Segment {cls}</span>
                                <span className="font-bold text-[#ffb0c8]">{Number(size).toLocaleString()} rows</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trend / Regression Insights */}
                  {session.ml_results.regression && (
                    <div className="glass-card rounded-2xl p-6 border border-white/8 space-y-4">
                      <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-[#efbc94]">trending_up</span>
                        <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">Trend Line Regression Model</h4>
                      </div>
                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between border-b border-white/5 py-1.5 text-white/60">
                          <span>Dependent variable (Y)</span>
                          <span className="text-white font-bold truncate max-w-[150px]" title={session.ml_results.regression.target_var}>
                            {session.ml_results.regression.target_var}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 py-1.5 text-white/60">
                          <span>Independent predictor (X)</span>
                          <span className="text-white font-bold truncate max-w-[150px]" title={session.ml_results.regression.predictor_var}>
                            {session.ml_results.regression.predictor_var}
                          </span>
                        </div>
                        {session.ml_results.regression.r_squared !== undefined && (
                          <div className="flex justify-between border-b border-white/5 py-1.5 text-white/60">
                            <span>R-Squared (Accuracy fit)</span>
                            <span className="text-white font-bold">{session.ml_results.regression.r_squared.toFixed(4)}</span>
                          </div>
                        )}
                        {session.ml_results.regression.slope !== undefined && (
                          <div className="flex justify-between border-b border-white/5 py-1.5 text-white/60">
                            <span>Equation Model Slope</span>
                            <span className={`font-bold ${session.ml_results.regression.slope >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {session.ml_results.regression.slope.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* General ML analysis details if available */}
                  {!session.ml_results.clustering && !session.ml_results.regression && (
                    <div className="glass-card rounded-2xl p-12 border border-white/8 text-center text-white/40 italic text-sm md:col-span-2">
                      Analytical modelling completed. Review charts and summary report for model breakdowns.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: AI STORY */}
            {activeTab === 'story' && session?.story && (() => {
              const story = typeof session.story === 'object' ? session.story : null;
              const rawNarrative = story 
                ? (story.story_narrative || story.narrative || '') 
                : session.story;

              return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Tab Header Actions */}
                  <div className="flex items-center justify-between border-b border-white/8 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#efbc94]">auto_stories</span>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
                        AI Data Insights Report
                      </h3>
                    </div>
                    <button
                      onClick={handleRefreshStory}
                      disabled={refreshingStory}
                      className="flex items-center gap-1.5 text-[11px] font-bold font-mono text-[#ffb0c8] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${refreshingStory ? 'animate-spin' : ''}`}>sync</span>
                      Regenerate Narrative
                    </button>
                  </div>

                  {story ? (
                    <div className="space-y-6">
                      
                      {/* 1. Hero Headline & Sub-insights */}
                      <div className="glass-card rounded-2xl p-6 border-l-4 border-l-[#ffb0c8] space-y-2.5 shadow-xl relative overflow-hidden bg-gradient-to-r from-[#ffb0c8]/5 to-transparent">
                        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#ffb0c8]">Core Narrative Insight</span>
                        <h1 className="text-xl md:text-2xl font-bold text-white leading-tight font-sans">
                          {story.headline || 'Dataset Analysis Complete'}
                        </h1>
                        <p className="text-xs md:text-sm text-[#efbc94] font-medium leading-relaxed font-mono">
                          {story.one_liner}
                        </p>
                      </div>

                      {/* 2. Executive Big Picture & Data Quality Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-2 shadow-lg">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">The Big Picture</span>
                          <p className="text-xs text-white/80 leading-relaxed font-sans">
                            {story.the_big_picture}
                          </p>
                        </div>
                        <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-2 shadow-lg">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">Data Quality Integrity</span>
                          <p className="text-xs text-white/80 leading-relaxed font-sans">
                            {story.data_quality_story}
                          </p>
                        </div>
                      </div>

                      {/* 3. Key Findings Cards Matrix */}
                      {story.key_takeaways && story.key_takeaways.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 px-1">Key Takeaway Findings</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {story.key_takeaways.map((takeaway, idx) => {
                              const typeColors = {
                                positive: 'border-emerald-500/25 bg-emerald-500/3 text-emerald-400',
                                warning: 'border-amber-500/25 bg-amber-500/3 text-amber-400',
                                negative: 'border-red-500/25 bg-red-500/3 text-red-400',
                                error: 'border-red-500/25 bg-red-500/3 text-red-400',
                                neutral: 'border-white/8 bg-white/2 text-white/80',
                              };
                              const borderTheme = typeColors[takeaway.type] || typeColors.neutral;

                              return (
                                <div key={idx} className={`border rounded-2xl p-4.5 space-y-2 shadow-md transition-all hover:scale-[1.01] ${borderTheme}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-bold font-mono tracking-tight line-clamp-1 truncate block">{takeaway.title}</span>
                                    <span className="material-symbols-outlined text-sm font-semibold select-none">
                                      {takeaway.type === 'positive' ? 'trending_up' : takeaway.type === 'warning' || takeaway.type === 'negative' ? 'warning' : 'insights'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                                    {takeaway.detail}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. Deep-Dive Analytical Segments */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* Patterns & Relationships */}
                        {story.patterns_and_relationships && (
                          <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-3 shadow-lg">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[#ffb0c8]">
                              <span className="material-symbols-outlined text-base">insights</span>
                              <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">Trends & Relationships</h4>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed font-sans">
                              {story.patterns_and_relationships}
                            </p>
                          </div>
                        )}

                        {/* Customer / Group Cohort Segments */}
                        {story.segmentation_insights && (
                          <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-3 shadow-lg">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[#efbc94]">
                              <span className="material-symbols-outlined text-base">groups</span>
                              <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">Segmentation Cohorts</h4>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed font-sans">
                              {story.segmentation_insights}
                            </p>
                          </div>
                        )}

                        {/* Predictive Insights */}
                        {story.predictive_insights && (
                          <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-3 shadow-lg">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-emerald-400">
                              <span className="material-symbols-outlined text-base">timeline</span>
                              <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">Predictive Capabilities</h4>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed font-sans">
                              {story.predictive_insights}
                            </p>
                          </div>
                        )}

                        {/* Anomalies & Alerts */}
                        {story.anomalies_and_concerns && (
                          <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-3 shadow-lg bg-red-500/1 border-red-500/10">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-red-400">
                              <span className="material-symbols-outlined text-base">warning</span>
                              <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">Anomalies & Warnings</h4>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed font-sans">
                              {story.anomalies_and_concerns}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 5. Recommended Actions Plan */}
                      {story.action_items && story.action_items.length > 0 && (
                        <div className="glass-card rounded-2xl p-6 border border-white/8 space-y-4 shadow-xl bg-gradient-to-tr from-white/1 to-transparent">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#ffb0c8]">playlist_add_check</span>
                            Recommended Action Plan
                          </h4>
                          <div className="space-y-3">
                            {story.action_items.map((item, idx) => (
                              <div key={idx} className="flex gap-4 p-4.5 rounded-xl bg-white/2 border border-white/5 font-sans">
                                <div className="w-6 h-6 rounded-lg bg-[#ffb0c8]/10 text-[#ffb0c8] flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                                  {idx + 1}
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                  <span className="text-xs font-bold text-white block leading-snug">{item.action}</span>
                                  <p className="text-[11px] text-white/60 leading-relaxed block font-mono">
                                    <span className="text-[#efbc94] font-semibold">Reason:</span> {item.why}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ) : null}

                  {/* 6. Long-form Deep-Dive Narrative (Journalistic story) */}
                  {rawNarrative && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 px-1">Long-form Data Narrative</h4>
                      <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/8 leading-relaxed prose prose-invert max-w-none shadow-lg">
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-3 mt-1 font-mono uppercase tracking-wider border-b border-white/5 pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mb-2 mt-3 font-mono" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-[#ffb0c8] mb-1.5 mt-3 uppercase tracking-wide font-mono" {...props} />,
                            p: ({node, ...props}) => <p className="text-xs text-white/75 mb-3 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-xs text-white/75" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-xs text-white/75" {...props} />,
                            li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-[#efbc94]" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-[#ffb0c8] pl-3 italic text-white/60 my-3 text-xs" {...props} />,
                            code: ({node, ...props}) => <code className="bg-white/5 px-1 py-0.5 rounded font-mono text-[10px] text-white" {...props} />,
                          }}
                        >
                          {rawNarrative}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* TAB: CHAT WITH DATA */}
            {activeTab === 'chat' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 border-b border-white/8 pb-4">
                  <span className="material-symbols-outlined text-[#ffb0c8]">forum</span>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
                    Conversational Data Chat
                  </h3>
                </div>

                <div className="glass-card rounded-2xl border border-white/8 flex flex-col h-[550px] overflow-hidden">
                  
                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2 px-8 select-none">
                        <span className="material-symbols-outlined text-4xl text-white/20">chat_bubble</span>
                        <h4 className="font-semibold text-xs uppercase tracking-wider">Ask Your Data</h4>
                        <p className="text-xs max-w-sm">
                          Query statistical correlations, anomalies, distribution summaries, or predictions.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div 
                            key={index} 
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-xs leading-relaxed ${
                              isUser 
                                ? 'bg-[#ffb0c8] text-[#5e1133] rounded-tr-none font-medium' 
                                : 'bg-[#161618] border border-white/6 text-white/90 rounded-tl-none prose prose-invert'
                            }`}>
                              {!isUser ? (
                                <ReactMarkdown
                                  components={{
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props} />,
                                    li: ({node, ...props}) => <li className="list-item" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-[#efbc94]" {...props} />,
                                  }}
                                >
                                  {msg.text}
                                </ReactMarkdown>
                              ) : (
                                msg.text
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {sendingChat && (
                      <div className="flex justify-start">
                        <div className="bg-[#161618] border border-white/6 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#ffb0c8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-[#ffb0c8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-[#ffb0c8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Console */}
                  <form onSubmit={handleSendChat} className="p-4 border-t border-white/8 bg-[#121414]/50 flex gap-3">
                    <input
                      type="text"
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      placeholder="e.g. Which product category has the highest profit margin?"
                      disabled={sendingChat}
                      className="flex-1 px-4 py-3 bg-[#161618] border border-white/8 rounded-xl text-xs text-white placeholder:text-white/20 focus:ring-1 focus:ring-[#ffb0c8]/30 focus:border-[#ffb0c8] outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || !chatQuestion.trim()}
                      className="bg-[#ffb0c8] text-[#5e1133] disabled:opacity-50 hover:bg-[#ffa0bd] px-5 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">send</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
