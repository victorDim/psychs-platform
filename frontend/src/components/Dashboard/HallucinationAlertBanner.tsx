import React from 'react';
import { SemanticEntropyResult } from '../../types';
import { ShieldCheck, AlertOctagon, HelpCircle, Activity, Sparkles } from 'lucide-react';

interface Props {
  entropyData: SemanticEntropyResult;
}

export const HallucinationAlertBanner: React.FC<Props> = ({ entropyData }) => {
  const isRisk = entropyData.is_hallucination_risk;

  return (
    <div
      className={`p-5 rounded-xl border mb-6 transition-all ${
        isRisk
          ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-900/10'
          : 'bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-cyan-950/20 border-emerald-500/30'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Indicator & Status */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isRisk ? <AlertOctagon className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400">
                FR-PER-04 Hallucination Defense Engine
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isRisk
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isRisk ? 'HIGH UNCERTAINTY' : 'STABLE CONVERGENCE'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">{entropyData.diagnosis}</p>
          </div>
        </div>

        {/* Right: Shannon Entropy Equation & Threshold Meter */}
        <div className="flex items-center gap-6 bg-slate-950/70 p-3 rounded-lg border border-slate-800 shrink-0">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Semantic Entropy (H_sem)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-cyan-400">
                {entropyData.semantic_entropy.toFixed(3)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ {entropyData.entropy_threshold} limit</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Sampling Panel</div>
            <div className="text-xs font-semibold text-slate-200">
              M = {entropyData.total_samples} samples @ T={entropyData.temperature}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Confidence Score</div>
            <div className="text-xs font-bold text-emerald-400 font-mono">
              {(entropyData.confidence_score * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Clusters Preview */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
        <span className="text-[11px] text-slate-400 font-medium">Equivalence Clusters:</span>
        {entropyData.clusters.map((cluster) => (
          <div
            key={cluster.cluster_id}
            className="flex items-center gap-1.5 text-xs bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-300"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Cluster {cluster.cluster_id}:</span>
            <span className="font-mono text-emerald-300 font-bold">
              {(cluster.probability * 100).toFixed(0)}% (P(C_{cluster.cluster_id}))
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
