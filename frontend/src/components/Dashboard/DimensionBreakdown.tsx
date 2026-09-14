import React from 'react';
import { DimensionScore } from '../../types';
import { Sliders, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface Props {
  dimensions: DimensionScore[];
  onScoreChange?: (key: string, newRaw: number, newUncertainty: number) => void;
}

export const DimensionBreakdown: React.FC<Props> = ({ dimensions, onScoreChange }) => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            7-Dimensional Perception Scoring Breakdown & Uncertainty Calibration
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Empirical scores $s_i \in [0, 100]$ weighted by dimension $w_i$ and penalized by statistical uncertainty $U_i \in [0, 1]$.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
          Total Weight Σ w_i = 1.00
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dimensions.map((dim) => {
          const isOptimal = dim.status === 'OPTIMAL';
          const isModerate = dim.status === 'MODERATE';

          return (
            <div
              key={dim.key}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isOptimal
                  ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                  : isModerate
                  ? 'bg-amber-950/10 border-amber-800/40 hover:border-amber-500/50'
                  : 'bg-rose-950/10 border-rose-800/40 hover:border-rose-500/50'
              }`}
            >
              <div>
                {/* Header with weight and status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    w = {dim.weight.toFixed(2)}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isOptimal
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isModerate
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {dim.status}
                  </span>
                </div>

                {/* Dimension Name */}
                <h4 className="text-xs font-semibold text-white mb-2 leading-snug">
                  {dim.name}
                </h4>

                {/* Evidence snippet */}
                <p className="text-[11px] text-slate-400 mb-4 line-clamp-2">
                  {dim.evidence_summary}
                </p>
              </div>

              {/* Metrics Box */}
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Raw Empirical Score (s_i):</span>
                  <span className="font-mono font-bold text-white">{dim.raw_score.toFixed(1)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Uncertainty (U_i):</span>
                  <span className="font-mono text-amber-400">{(dim.uncertainty * 100).toFixed(1)}%</span>
                </div>

                <div className="flex justify-between text-xs pt-1 border-t border-slate-800/50">
                  <span className="text-emerald-400 font-semibold">Penalized Sub-Score:</span>
                  <span className="font-mono font-black text-emerald-300 text-sm">
                    {dim.penalized_score.toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Weighted Contribution:</span>
                  <span>+{dim.weighted_score.toFixed(2)} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
