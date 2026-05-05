/**
 * DataStoryPanel Component
 * ------------------------
 * Dedicated section for the full AI-generated data story narrative.
 */

import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function DataStoryPanel({ data }) {
  const { story } = data;

  return (
    <div className="space-y-8 w-full animate-fadeInUp">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-gradient-to-r from-[#222431] to-[#2A2B3A] p-10 rounded-[28px] shadow-xl border border-white/5">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">Full Data Story</h2>
            <p className="text-base text-gray-400 font-medium">
              A comprehensive narrative of your dataset's journey.
            </p>
          </div>
        </div>
      </div>

      {/* Main Story Content */}
      <div className="bg-[#232533] rounded-[20px] p-6 md:p-10 border border-white/5 shadow-lg relative overflow-hidden w-full">
         <div className="prose prose-invert max-w-none story-content relative z-10">
            {story.story_narrative ? (
               <ReactMarkdown>{story.story_narrative}</ReactMarkdown>
            ) : (
               <p className="text-gray-400 italic">No story narrative available for this dataset.</p>
            )}
         </div>
      </div>
    </div>
  );
}
