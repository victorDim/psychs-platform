import React from 'react';
import { OptimizationLever } from '../../types';
import { ToggleLeft, ToggleRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  levers: OptimizationLever[];
  onToggleLever: (leverName: string) => void;
  predictedLift: number;
}

export const LeverControlPanel: React.FC<Props> = ({ levers, onToggleLever, predictedLift }) => {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Princeton KDD-2024 Peer-Reviewed Optimization Levers (FR-OPT-01)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Toggle algorithmic levers to recalculate predicted citation lift and passage extractability.
          </p>
        </div>

        <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-500/40 text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400">Predicted Citation Frequency Lift</div>
          <div className="text-2xl font-black font-mono text-emerald-400">+{predictedLift.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {levers.map((lever) => {
          const isActive = lever.is_active;

          return (
            <div
              key={lever.lever_name}
              onClick={() => onToggleLever(lever.lever_name)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-emerald-950/30 to-slate-900/80 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Weight: {lever.empirical_lift_weight}%
                  </span>
                  {isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                <h4 className="text-xs font-bold text-white mb-2">{lever.lever_name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{lever.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex justify-between font-mono">
                <span>Applied Changes:</span>
                <span className="text-white font-bold">{lever.applied_changes_count} sections</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
