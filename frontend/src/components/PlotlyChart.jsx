import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PlotlyChart({ data, layout }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && data) {
      // Deep copy layout and modify to fit our dashboard style
      const modifiedLayout = {
        ...layout,
        autosize: true,
        width: undefined, // Let container dictate width
        height: undefined, // Let container dictate height
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
          family: 'Inter, sans-serif',
          color: '#e3e2e2',
        },
      };

      // Set grid / axes gridlines color to dark grey if present
      if (modifiedLayout.xaxis) {
        modifiedLayout.xaxis.gridcolor = 'rgba(255, 255, 255, 0.08)';
        modifiedLayout.xaxis.linecolor = 'rgba(255, 255, 255, 0.15)';
        modifiedLayout.xaxis.zerolinecolor = 'rgba(255, 255, 255, 0.15)';
      }
      if (modifiedLayout.yaxis) {
        modifiedLayout.yaxis.gridcolor = 'rgba(255, 255, 255, 0.08)';
        modifiedLayout.yaxis.linecolor = 'rgba(255, 255, 255, 0.15)';
        modifiedLayout.yaxis.zerolinecolor = 'rgba(255, 255, 255, 0.15)';
      }

      Plotly.newPlot(containerRef.current, data, modifiedLayout, {
        responsive: true,
        displayModeBar: false,
      });
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout]);

  return (
    <div className="w-full h-full min-h-[350px]" ref={containerRef} />
  );
}
