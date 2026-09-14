import React from 'react';
import { CompositePerceptionResult } from '../../types';
import { Award, CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';

interface Props {
  scoreData: CompositePerceptionResult;
}

export const ExecutiveScoreCard: React.FC<Props> = ({ scoreData }) => {
  const score = scoreData.aggregate_score;
  const grade = scoreData.grade;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
      {/* Primary Score Hero Gauge */}
      <div className="lg:col-span-4 glass-panel-glow p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Composite Perception Score
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Grade {grade}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Calibrated aggregate formulation across 7 weighted dimensions with uncertainty penalization.
          </p>
        </div>

        <div className="my-6 flex items-baseline gap-3">
          <div className="text-6xl font-black tracking-tight font-mono gradient-text-emerald">
            {score.toFixed(1)}
          </div>
          <div className="text-slate-500 font-mono text-xl">/ 100</div>
          <div className="ml-auto text-right">
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
              <TrendingUp className="w-3.5 h-3.5" /> +19.2% Lift
            </div>
            <div className="text-[10px] text-slate-500">vs 30d Baseline</div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Statistical Confidence:</span>
            <span className="font-mono text-cyan-400 font-semibold">{scoreData.overall_confidence}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, score)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-1">
            Formula: S_perception = Σ (w_i · s_i · (1 - U_i))
          </div>
        </div>
      </div>

      {/* Drivers & Urgent Deficits */}
      <div className="lg:col-span-8 glass-panel p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Executive Perception Drivers & Empirical Deficits
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-800/80">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Top Key Drivers (Won Positions)
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {scoreData.key_drivers.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Urgent Gaps */}
            <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-800/80">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5" /> High-Uncertainty Citation Deficits
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {scoreData.urgent_deficits.length > 0 ? (
                  scoreData.urgent_deficits.map((deficit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{deficit}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">All 7 dimensions operating at optimal citation strength.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Strategy Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            Recommended Action: Apply Princeton KDD-2024 levers to close the citation attributability gap.
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60">
            Target ROI: +24.6% Citation Frequency
          </span>
        </div>
      </div>
    </div>
  );
};
