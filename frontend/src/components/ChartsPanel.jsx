/**
 * ChartsPanel Component
 * ---------------------
 * Renders interactive Plotly charts in a responsive grid.
 * Supports filtering by chart type.
 */

import React, { useState, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import PlotFactory from 'react-plotly.js/factory';
const createPlotlyComponent = PlotFactory.default || PlotFactory;
const Plot = createPlotlyComponent(Plotly);
import { BarChart3, Filter, Maximize2, X } from 'lucide-react';

const CHART_TYPE_LABELS = {
  all: 'All Charts',
  histogram: 'Distributions',
  heatmap: 'Heatmap',
  scatter: 'Scatter Plots',
  bar: 'Bar Charts',
  box: 'Box Plots',
  line: 'Line Charts',
};

function ChartCard({ chart, onExpand }) {
  const layout = {
    ...(chart.chart?.layout || {}),
    autosize: true,
    margin: { l: 50, r: 30, t: 40, b: 50 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8', size: 11, family: 'Inter' },
    title: {
      ...(chart.chart?.layout?.title || {}),
      font: { color: '#e2e8f0', size: 14, family: 'Inter' },
    },
  };

  return (
    <div
      className="glass-card p-5 group relative flex flex-col"
      style={{ aspectRatio: '1 / 1', animation: 'fadeIn 0.4s ease-out' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate pr-4">
          {chart.title}
        </h4>
        <button
          onClick={() => onExpand(chart)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[rgba(99,102,241,0.1)]"
          aria-label="Expand chart"
        >
          <Maximize2 className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>
      <span className="insight-badge badge-neutral text-[10px] mb-3 inline-block">
        {chart.type}
      </span>
      <div className="w-full flex-1 min-h-0">
        <Plot
          data={chart.chart?.data || []}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: false,
          }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  );
}

function ExpandedChart({ chart, onClose }) {
  const layout = {
    ...(chart.chart?.layout || {}),
    autosize: true,
    margin: { l: 60, r: 40, t: 50, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8', size: 12, family: 'Inter' },
    title: {
      ...(chart.chart?.layout?.title || {}),
      font: { color: '#e2e8f0', size: 18, family: 'Inter' },
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-5xl p-6 relative"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[rgba(99,102,241,0.1)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{chart.title}</h3>
        <div style={{ height: '65vh' }}>
          <Plot
            data={chart.chart?.data || []}
            layout={layout}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        </div>
      </div>
    </div>
  );
}

export default function ChartsPanel({ charts }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedChart, setExpandedChart] = useState(null);

  const chartTypes = useMemo(() => {
    const types = new Set(charts.map(c => c.type));
    return ['all', ...Array.from(types)];
  }, [charts]);

  const filteredCharts = useMemo(() => {
    if (activeFilter === 'all') return charts;
    return charts.filter(c => c.type === activeFilter);
  }, [charts, activeFilter]);

  if (!charts || charts.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
        <p className="text-[var(--text-secondary)]">No charts generated for this dataset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div
        className="glass-card p-1 flex items-center gap-1 overflow-x-auto"
        style={{ animation: 'fadeInUp 0.4s ease-out' }}
      >
        <Filter className="w-4 h-4 text-[var(--text-muted)] ml-3 mr-1 shrink-0" />
        {chartTypes.map(type => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`tab-button ${activeFilter === type ? 'active' : ''}`}
            style={{ borderBottom: 'none', borderRadius: 8 }}
          >
            {CHART_TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        Showing {filteredCharts.length} of {charts.length} charts
      </p>

      {/* Charts Grid — Square Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCharts.map((chart) => (
          <ChartCard key={chart.id} chart={chart} onExpand={setExpandedChart} />
        ))}
      </div>

      {/* Expanded view */}
      {expandedChart && (
        <ExpandedChart chart={expandedChart} onClose={() => setExpandedChart(null)} />
      )}
    </div>
  );
}
