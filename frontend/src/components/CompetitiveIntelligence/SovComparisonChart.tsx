import React from 'react';
import { SovAnalysisResult } from '../../types';
import { TrendingUp, Award, Users, BarChart3 } from 'lucide-react';

interface Props {
  sovData: SovAnalysisResult;
}

export const SovComparisonChart: React.FC<Props> = ({ sovData }) => {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Cross-Competitor Generative Share of Voice (GSoV) Benchmark (FR-INT-01)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Calculated across {sovData.total_panel_queries} buyer-intent panel prompts against enterprise competitors.
          </p>
        </div>
        <div className="bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          Market Leadership Gap: +{sovData.market_share_gap}% vs #2
        </div>
      </div>

      {/* Leaderboard Stacked Progress Bars */}
      <div className="space-y-4 mb-6">
        {sovData.leaderboard.map((item, idx) => {
          const isClient = item.is_client_brand;
          return (
            <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isClient ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className={`font-bold ${isClient ? 'text-emerald-400 text-sm' : 'text-white'}`}>
                    {item.brand_name} {isClient && '(Client Brand)'}
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <span className="text-slate-400">
                    Primary Rec: <strong className="text-white">{item.primary_recommendation_rate}%</strong>
                  </span>
                  <span className="text-slate-400">
                    Citations/Q: <strong className="text-cyan-400">{item.average_citations_per_query}</strong>
                  </span>
                  <span className={`font-bold text-sm ${isClient ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {item.generative_sov_percent}% GSoV
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isClient
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${item.generative_sov_percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300">
        <span className="font-semibold text-emerald-400 font-mono">Strategic Summary: </span>
        {sovData.executive_summary}
      </div>
    </div>
  );
};
