/**
 * AnimatedBackground Component
 * ----------------------------
 * Renders a subtle, data-themed animated background with
 * floating chart bars, grid dots, and connection lines.
 * Pure CSS animations — no JS runtime cost.
 */

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="animated-bg" aria-hidden="true">
      {/* Floating data bars */}
      <div className="ab-bar ab-bar-1" />
      <div className="ab-bar ab-bar-2" />
      <div className="ab-bar ab-bar-3" />
      <div className="ab-bar ab-bar-4" />
      <div className="ab-bar ab-bar-5" />
      <div className="ab-bar ab-bar-6" />

      {/* Floating circles (data points) */}
      <div className="ab-dot ab-dot-1" />
      <div className="ab-dot ab-dot-2" />
      <div className="ab-dot ab-dot-3" />
      <div className="ab-dot ab-dot-4" />
      <div className="ab-dot ab-dot-5" />
      <div className="ab-dot ab-dot-6" />
      <div className="ab-dot ab-dot-7" />
      <div className="ab-dot ab-dot-8" />

      {/* Connection lines */}
      <div className="ab-line ab-line-1" />
      <div className="ab-line ab-line-2" />
      <div className="ab-line ab-line-3" />
      <div className="ab-line ab-line-4" />

      {/* Glowing orbs */}
      <div className="ab-orb ab-orb-1" />
      <div className="ab-orb ab-orb-2" />
      <div className="ab-orb ab-orb-3" />

      {/* Grid pattern overlay */}
      <div className="ab-grid" />
    </div>
  );
}
