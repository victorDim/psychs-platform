import React from 'react';
import { WinLossSummary } from '../../types';
import { CheckCircle2, XCircle, MinusCircle, ArrowRight, HelpCircle } from 'lucide-react';

interface Props {
  winLossData: WinLossSummary;
}

export const WinLossDiagnosisGrid: React.FC<Props> = ({ winLossData }) => {
  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Prompt-Level Win/Loss Diagnosis & Passage Attribution (FR-INT-03)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Categorization of queries into Won, Lost, and Absent states with semantic gap explanations.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded border border-emerald-800">
            Won: {winLossData.won_count} ({winLossData.win_rate_percent}%)
          </span>
          <span className="text-rose-400 bg-rose-950/60 px-3 py-1.5 rounded border border-rose-800">
            Lost: {winLossData.lost_count}
          </span>
          <span className="text-amber-400 bg-amber-950/60 px-3 py-1.5 rounded border border-amber-800">
            Absent: {winLossData.absent_count}
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {winLossData.diagnoses.map((d) => {
          const isWon = d.state === 'WON';
          const isLost = d.state === 'LOST';

          return (
            <div
              key={d.query_id}
              className={`p-4 rounded-xl border transition-all ${
                isWon
                  ? 'bg-slate-900/60 border-slate-800'
                  : isLost
                  ? 'bg-rose-950/15 border-rose-800/40'
                  : 'bg-amber-950/15 border-amber-800/40'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      isWon
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isLost
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isWon ? <CheckCircle2 className="w-3 h-3" /> : isLost ? <XCircle className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
                    {d.state}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{d.query_id}</span>
                  <span className="text-xs font-semibold text-white">{d.query_text}</span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                  <span>Engine: <strong className="text-slate-200">{d.engine_name}</strong></span>
                  <span>Winner: <strong className={isWon ? 'text-emerald-400' : 'text-amber-400'}>{d.winning_entity}</strong></span>
                </div>
              </div>

              {/* Diagnosis and Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-mono uppercase mb-1">Root Cause Diagnosis:</span>
                  <p className="text-slate-300">{d.root_cause_diagnosis}</p>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-emerald-400 block text-[10px] font-mono uppercase mb-1">Recommended GEO Action:</span>
                    <p className="text-slate-300">{d.recommended_geo_action}</p>
                  </div>
                  <div className="mt-2 text-right text-[10px] text-cyan-400 font-mono">
                    Predicted Win Probability Post-Fix: <strong>{(d.predicted_win_probability_after_fix * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
