import React from 'react';
import { ContentDiffItem } from '../../types';
import { FileDiff, ArrowRight, Check, Send, Sparkles } from 'lucide-react';

interface Props {
  diffs: ContentDiffItem[];
  onOpenPublishModal: (diff: ContentDiffItem) => void;
}

export const KddDiffViewer: React.FC<Props> = ({ diffs, onOpenPublishModal }) => {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileDiff className="w-4 h-4 text-emerald-400" />
            Side-by-Side Princeton KDD-2024 Content Diff Viewer
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Empirical transformations ready for Level 4 cryptographic signature and direct CMS webhook deployment.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {diffs.map((diff) => (
          <div key={diff.section_id} className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
            {/* Diff Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-cyan-400">{diff.section_id}</span>
                <span className="text-xs font-semibold text-white">{diff.section_title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {diff.diff_type}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Expected Lift: +{diff.expected_citation_lift_delta}%
                </span>
                <button
                  onClick={() => onOpenPublishModal(diff)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
                >
                  <Send className="w-3 h-3" /> Approve &amp; Publish
                </button>
              </div>
            </div>

            {/* Side-by-side grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Original Content */}
              <div className="p-4 bg-slate-950/40">
                <div className="text-[10px] uppercase font-mono font-bold text-rose-400 mb-2 flex items-center justify-between">
                  <span>Original Legacy Content</span>
                  <span className="text-slate-500">Unoptimized</span>
                </div>
                <div className="text-xs text-slate-400 diff-del font-sans leading-relaxed">
                  {diff.original_text}
                </div>
              </div>

              {/* Optimized Content */}
              <div className="p-4 bg-emerald-950/10">
                <div className="text-[10px] uppercase font-mono font-bold text-emerald-400 mb-2 flex items-center justify-between">
                  <span>KDD-2024 Optimized Target Passage</span>
                  <span className="text-emerald-400 font-mono">Extractability: {diff.extractability_score}/100</span>
                </div>
                <div className="text-xs text-slate-200 diff-add font-sans leading-relaxed">
                  {diff.optimized_text}
                </div>
              </div>
            </div>

            {/* Applied Levers Footer */}
            <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Applied GEO Levers:</span>
              <div className="flex flex-wrap gap-1.5">
                {diff.applied_levers.map((lev, li) => (
                  <span key={li} className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-800 font-mono">
                    ✓ {lev}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
