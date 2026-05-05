/**
 * InsightsPanel Component
 * -----------------------
 * Displays the AI-generated data story with key findings,
 * ML insights, recommendations, and top-5 highlights.
 */

import React, { useState } from 'react';
import {
  Sparkles, Lightbulb, TrendingUp, TrendingDown, AlertTriangle,
  Target, Brain, Users, Shield, RefreshCw, Star, ChevronDown, ChevronUp,
  Cpu, BarChart3
} from 'lucide-react';

const SQ = { aspectRatio: '1 / 1' };
const CARD = "bg-[#232533] rounded-[20px] p-8 border border-white/5 shadow-lg flex flex-col";

export default function InsightsPanel({ data, onRefreshStory }) {
  const { story, ml_results, eda_results } = data;
  const [refreshing, setRefreshing] = useState(false);
  const [expandedNarrative, setExpandedNarrative] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await onRefreshStory(); } finally { setRefreshing(false); }
  };

  const topCorrelations = eda_results?.correlation?.strong_correlations?.slice(0, 5) || [];

  return (
    <div className="space-y-8 w-full animate-fadeInUp">

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-gradient-to-r from-[#222431] to-[#2A2B3A] p-10 rounded-[28px] shadow-xl border border-white/5">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">AI-Generated Insights</h2>
            <p className="text-base text-gray-400 font-medium">
              Powered by {story.generated_by === 'gemini' ? 'Google Gemini' : 'Intelligent Analysis Engine'}
            </p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold bg-[#1E202C] border border-white/5 text-gray-300 hover:text-white hover:border-indigo-500/30 transition-all duration-300 shadow-inner shrink-0">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Regenerate Story
        </button>
      </div>

      {/* Executive Summary + Key Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={CARD} style={SQ}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Executive Summary</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <p className="text-[15px] text-gray-300 leading-[1.9] font-medium">{story.executive_summary}</p>
          </div>
        </div>

        <div className={CARD} style={SQ}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Top 5 Key Findings</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {(story.key_findings || []).slice(0, 5).map((f, i) => (
              <div key={i} className="flex gap-4 items-start bg-[#1E202C] rounded-xl p-4 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-white">{i + 1}</span>
                </div>
                <p className="text-[14px] text-gray-300 leading-[1.8] font-medium pt-1">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ML Insights */}
      {(ml_results?.regression || ml_results?.classification || ml_results?.clustering || (ml_results?.trends && ml_results.trends.length > 0)) && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Machine Learning Results</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ml_results?.regression && !ml_results.regression.error && (
              <div className={CARD} style={SQ}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div><h4 className="text-lg font-bold text-white">Regression</h4><p className="text-sm text-gray-500">{ml_results.regression.target_column}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1 content-center">
                  {[{ l: 'R² Score', v: ml_results.regression.r2_score?.toFixed(3) },{ l: 'MAE', v: ml_results.regression.mae?.toFixed(3) },{ l: 'Top Predictor', v: ml_results.regression.top_predictor || '—' },{ l: 'RMSE', v: ml_results.regression.rmse?.toFixed(3) }].map(({ l, v }) => (
                    <div key={l} className="bg-[#1E202C] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center" style={SQ}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{l}</p>
                      <p className="text-lg font-bold text-green-400 truncate w-full">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ml_results?.classification && !ml_results.classification.error && (
              <div className={CARD} style={SQ}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div><h4 className="text-lg font-bold text-white">Classification</h4><p className="text-sm text-gray-500">{ml_results.classification.target_column}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1 content-center">
                  {[{ l: 'Accuracy', v: `${(ml_results.classification.accuracy * 100).toFixed(1)}%` },{ l: 'Classes', v: ml_results.classification.classes?.length || '—' },{ l: 'Top Predictor', v: ml_results.classification.top_predictor || '—' },{ l: 'Model', v: 'RandomForest' }].map(({ l, v }) => (
                    <div key={l} className="bg-[#1E202C] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center" style={SQ}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{l}</p>
                      <p className="text-lg font-bold text-purple-400 truncate w-full">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ml_results?.clustering && !ml_results.clustering.error && (
              <div className={CARD} style={SQ}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div><h4 className="text-lg font-bold text-white">K-Means Clustering</h4><p className="text-sm text-gray-500">{ml_results.clustering.features_used?.length || 0} features</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1 content-center">
                  <div className="bg-[#1E202C] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center" style={SQ}>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Clusters</p>
                    <p className="text-lg font-bold text-indigo-400">{ml_results.clustering.optimal_k}</p>
                  </div>
                  <div className="bg-[#1E202C] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center" style={SQ}>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Features</p>
                    <p className="text-lg font-bold text-indigo-400">{ml_results.clustering.features_used?.length || '—'}</p>
                  </div>
                  {Object.entries(ml_results.clustering.cluster_profiles || {}).slice(0, 2).map(([n, p]) => (
                    <div key={n} className="bg-[#1E202C] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center" style={SQ}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{n}</p>
                      <p className="text-lg font-bold text-indigo-400">{p.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ml_results?.trends && ml_results.trends.length > 0 && (
              <div className={CARD} style={SQ}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Detected Trends</h4>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto flex flex-col justify-center pr-1">
                  {ml_results.trends.slice(0, 4).map((t, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1E202C] rounded-xl p-5 border border-white/5">
                      <span className="text-[15px] text-gray-300 font-medium">{t.column}</span>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${t.direction === 'increasing' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {t.direction === 'increasing' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(t.change_percentage)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patterns + Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={CARD} style={SQ}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Patterns & Relationships</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <p className="text-[15px] text-gray-300 leading-[1.9] font-medium">{story.patterns_and_relationships}</p>
          </div>
        </div>
        {topCorrelations.length > 0 && (
          <div className={CARD} style={SQ}>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">Strongest Correlations</p>
            <div className="space-y-3 flex-1 overflow-y-auto flex flex-col justify-center pr-1">
              {topCorrelations.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-[#1E202C] rounded-xl px-5 py-4 border border-white/5">
                  <span className="text-[14px] text-gray-300 font-medium">{c.column_1} <span className="text-purple-400 mx-2">↔</span> {c.column_2}</span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${c.direction === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>r = {c.correlation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Segmentation + Predictive */}
      {(story.segmentation_insights || story.predictive_insights) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {story.segmentation_insights && (
            <div className={CARD} style={SQ}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-400" /></div>
                <h3 className="text-xl font-bold text-white">Segmentation</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1"><p className="text-[15px] text-gray-300 leading-[1.9] font-medium">{story.segmentation_insights}</p></div>
            </div>
          )}
          {story.predictive_insights && (
            <div className={CARD} style={SQ}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center"><Target className="w-5 h-5 text-indigo-400" /></div>
                <h3 className="text-xl font-bold text-white">Predictive Insights</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1"><p className="text-[15px] text-gray-300 leading-[1.9] font-medium">{story.predictive_insights}</p></div>
            </div>
          )}
        </div>
      )}

      {/* Anomalies + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {story.anomalies_and_concerns && (
          <div className="bg-[#232533] rounded-[20px] p-8 border border-amber-500/10 shadow-lg flex flex-col" style={SQ}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
              <h3 className="text-xl font-bold text-white">Anomalies & Concerns</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1"><p className="text-[15px] text-gray-300 leading-[1.9] font-medium">{story.anomalies_and_concerns}</p></div>
          </div>
        )}
        <div className={CARD} style={SQ}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"><Lightbulb className="w-5 h-5 text-emerald-400" /></div>
            <h3 className="text-xl font-bold text-white">Recommendations</h3>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {(story.recommendations || []).map((rec, i) => (
              <div key={i} className="flex gap-4 items-start bg-[#1E202C] rounded-xl p-4 border border-white/5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                <p className="text-[14px] text-gray-300 leading-[1.85] font-medium">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Quality */}
      {story.data_quality_story && (
        <div className={CARD}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-500/20 border border-slate-500/30 flex items-center justify-center"><Shield className="w-5 h-5 text-slate-400" /></div>
            <h3 className="text-xl font-bold text-white">Data Quality Assessment</h3>
          </div>
          <div className="flex-1 pr-1"><p className="text-[15px] text-gray-300 leading-[1.9] font-medium">{story.data_quality_story}</p></div>
        </div>
      )}
    </div>
  );
}
