import React, { useState, useEffect } from 'react';
import { UnitEconomicsResult } from '../../types';
import { Zap, DollarSign, Cpu, ArrowDownRight, CheckCircle2, Play, Database, HardDrive, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  economics: UnitEconomicsResult;
}

export const UnitEconomicsHub: React.FC<Props> = ({ economics }) => {
  const [taskInput, setTaskInput] = useState<string>('G-Eval Qualitative Rubric Evaluation on Perplexity Synthesis');
  const [classifiedResult, setClassifiedResult] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isRefreshingCache, setIsRefreshingCache] = useState<boolean>(false);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    setIsRefreshingCache(true);
    try {
      const stats = await api.getCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.error('Failed to load cache stats', e);
    } finally {
      setIsRefreshingCache(false);
    }
  };

  const handleClassify = async () => {
    setIsClassifying(true);
    try {
      const res = await api.classifyTask(taskInput);
      setClassifiedResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Baseline Cost / Audit</div>
          <div className="text-2xl font-black font-mono text-slate-300">
            ${economics.total_cost_per_audit_prototype.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Direct Frontier LLM API</div>
        </div>

        <div className="glass-panel-glow p-5">
          <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">Enterprise Architecture Cost</div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            ${economics.total_cost_per_audit_enterprise.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">vLLM SLM + Redis Cache</div>
        </div>

        <div className="glass-panel p-5">
          <div className="text-[10px] font-mono uppercase text-cyan-400 mb-1">Total Cost Reduction</div>
          <div className="text-3xl font-black font-mono text-cyan-400">
            {economics.cost_reduction_percent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">Exceeds 80% PRD goal</div>
        </div>

        <div className="glass-panel p-5">
          <div className="text-[10px] font-mono uppercase text-indigo-400 mb-1">Gross Margin on $500 Tier</div>
          <div className="text-3xl font-black font-mono text-indigo-400">
            {economics.software_gross_margin_percent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">$13.32 COGS / 4 cycles</div>
        </div>
      </div>

      {/* Two-Tier Cache Acceleration Engine (Phase 2 & 3 Telemetry) */}
      <div className="glass-panel p-6 border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              High-Efficiency Two-Tier Caching &amp; Inverted Index Acceleration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tier 1 O(1) SHA-256 Exact Matches + Tier 2 Inverted Keyword Semantic Vector Deduplication.
            </p>
          </div>
          <button
            onClick={loadCacheStats}
            disabled={isRefreshingCache}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCache ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Telemetry
          </button>
        </div>

        {cacheStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">Cache Hit Ratio</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                {cacheStats.hit_ratio_pct}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{cacheStats.exact_hits + cacheStats.semantic_hits} hits / {cacheStats.total_lookups} queries</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">Cumulative Savings</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                ${cacheStats.total_cost_saved_usd.toFixed(3)}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">$0.024 exact / $0.018 semantic</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">LRU Memory Capacity</div>
              <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                {cacheStats.exact_entries_count} / {cacheStats.max_exact_capacity}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">24h TTL bounded eviction</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">Inverted Index Terms</div>
              <div className="text-2xl font-black font-mono text-purple-400 mt-1">
                {cacheStats.inverted_index_terms_count}
              </div>
              <div className="text-[11px] text-purple-400/80 mt-0.5">O(1) candidate pruning</div>
            </div>
          </div>
        )}
      </div>

      {/* Unit Economics Breakdown Table */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Dynamic 3-Tier Model Routing &amp; Unit Economics Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tier 1 (Frontier LLM), Tier 2 (Specialized Open SLM / vLLM), Tier 3 (FP16 Embeddings).
            </p>
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Operational Step</th>
                <th className="py-3 px-4">Prototype Baseline</th>
                <th className="py-3 px-4">Enterprise Production</th>
                <th className="py-3 px-4">Cost Reduction</th>
                <th className="py-3 px-4">Applied Architectural Optimization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {economics.breakdown.map((item, i) => (
                <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-white">{item.operational_step}</td>
                  <td className="py-3 px-4 text-rose-400">${item.unoptimized_prototype_cost.toFixed(3)}</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">${item.enterprise_architecture_cost.toFixed(3)}</td>
                  <td className="py-3 px-4 text-cyan-400">{item.cost_reduction_percent.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-slate-300 font-sans text-[11px]">{item.optimization_applied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Task Classifier Interactive Tester */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Interactive Dynamic Task Classifier Simulator
          </h4>

          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleClassify}
              disabled={isClassifying}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg active:scale-95 transition-all"
            >
              <Play className="w-3 h-3" /> Classify Task
            </button>
          </div>

          {classifiedResult && (
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Tier:</span>
                <span className="text-cyan-400 font-bold">{classifiedResult.assigned_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Model:</span>
                <span className="text-emerald-400 font-bold">{classifiedResult.model_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Cost:</span>
                <span className="text-white">${classifiedResult.estimated_cost_per_call.toFixed(4)} / call</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rationale:</span>
                <span className="text-slate-300 font-sans text-[11px]">{classifiedResult.rationale}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
