import React from 'react';
import { RemeasurementCampaign } from '../../types';
import { Calendar, TrendingUp } from 'lucide-react';

interface Props {
  campaign: RemeasurementCampaign;
}

export const RemeasurementTimeline: React.FC<Props> = ({ campaign }) => {
  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Automated Re-Measurement Verification Loop (FR-OPT-04)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tracking perception score delta (ΔS_perception) and citation frequency lift at 7, 14, and 30 days post-deployment.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded">
            Citation Lift: +{campaign.cumulative_citation_lift}%
          </div>
          <div className="bg-cyan-950/60 text-cyan-400 border border-cyan-800 px-3 py-1.5 rounded">
            Perception Lift: +{campaign.cumulative_perception_lift} pts
          </div>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {campaign.checkpoints.map((cp) => {
          const isBaseline = cp.checkpoint_day === 0;

          return (
            <div
              key={cp.checkpoint_day}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isBaseline
                  ? 'bg-slate-900/40 border-slate-800'
                  : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {isBaseline ? 'Baseline' : `Day +${cp.checkpoint_day}`}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    {cp.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 font-mono mb-4">{cp.execution_date}</div>

                <div className="text-2xl font-black font-mono text-white mb-1">
                  {cp.perception_score.toFixed(1)}
                  <span className="text-xs text-slate-500 font-normal"> / 100</span>
                </div>

                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-3">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {isBaseline ? '0.0 pts' : `+${cp.delta_perception_score.toFixed(1)} pts`}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Citation Rate:</span>
                  <span className="text-white font-bold">{cp.citation_frequency_rate}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hallucination Rate:</span>
                  <span className="text-cyan-400">{cp.hallucination_rate_percent}%</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Verified ROI:</span>
                  <span className="text-emerald-400 font-bold">{cp.verified_roi_multiplier}x</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300">
        <span className="font-semibold text-emerald-400 font-mono">Empirical Verification Report: </span>
        {campaign.summary_report}
      </div>
    </div>
  );
};
