import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Zap,
  Layers,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { CanarySystemReport, EngineCanaryStatus } from '../../types';
import { api } from '../../services/api';

interface Props {
  initialData?: CanarySystemReport;
}

export const CanaryDriftMonitor: React.FC<Props> = ({ initialData }) => {
  const [report, setReport] = useState<CanarySystemReport | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEngine, setSelectedEngine] = useState<EngineCanaryStatus | null>(null);
  const [autoCalibrating, setAutoCalibrating] = useState<boolean>(false);

  useEffect(() => {
    if (!report) {
      loadReport();
    }
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCanaryReport();
      setReport(data);
      if (data.engines.length > 0 && !selectedEngine) {
        setSelectedEngine(data.engines[0]);
      }
    } catch (err) {
      console.error('Failed to load canary report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCalibration = async () => {
    setAutoCalibrating(true);
    await new Promise((r) => setTimeout(r, 1200));
    await loadReport();
    setAutoCalibrating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                SOLUTION 1: DETERMINISM ENGINE
              </span>
              <span className="text-xs font-mono text-slate-400">JENSEN-SHANNON DIVERGENCE (D_JS)</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Continuous Calibration Canaries (C3) & Drift Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Proactively mitigates LLM non-determinism, model checkpoints, and black-box prompt updates. Hourly canary synthetic probes measure Jensen-Shannon Divergence (D_JS) against baseline probability distributions to automatically retune optimal passage word count and lever weights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCalibration}
              disabled={autoCalibrating || isLoading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoCalibrating ? 'animate-spin' : ''}`} />
              {autoCalibrating ? 'Probing 500 Canaries...' : 'Trigger Calibration Sweep'}
            </button>
          </div>
        </div>

        {/* Global Summary Metrics */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Hourly Canary Probes</span>
              <div className="text-xl font-bold font-mono text-white mt-1 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                {report.total_canary_probes} queries/hr
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 100% synthetic probe coverage
              </div>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Global Drift Index (D_JS)</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                {report.global_drift_index.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Threshold: &lt; 0.150 (Nominal tolerance)
              </div>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">System Health Status</span>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                {report.system_health_status}
              </div>
              <div className="text-[10px] text-cyan-400/80 mt-1">
                Auto-reweighting active
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Engine Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Engine Table */}
        <div className="lg:col-span-2 glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Generative Engine Canary Calibration Matrix
            </span>
            <span className="text-[11px] text-slate-400 font-mono">5 Calibrated Engines</span>
          </h3>

          <div className="space-y-3">
            {report?.engines.map((engine, idx) => {
              const isSelected = selectedEngine?.engine_name === engine.engine_name;
              const isDrifting = engine.drift_status === 'DRIFT_DETECTED';
              const isElevated = engine.drift_status === 'ELEVATED';

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedEngine(engine)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/80 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{engine.engine_name}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isDrifting
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isElevated
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {engine.drift_status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                        <span>Canaries: {engine.sample_queries_evaluated}</span>
                        <span>•</span>
                        <span>Calibrated: {engine.last_calibration_timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">D_JS Divergence</div>
                        <div
                          className={`text-sm font-bold font-mono ${
                            isDrifting ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {engine.jensen_shannon_divergence.toFixed(3)}
                        </div>
                      </div>

                      <div className="hidden sm:block">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Optimal Passage</div>
                        <div className="text-sm font-bold font-mono text-cyan-400">
                          {engine.optimal_passage_word_count} words
                        </div>
                      </div>

                      <ArrowRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90 sm:rotate-0 text-emerald-400' : ''}`} />
                    </div>
                  </div>

                  {/* Progress bar visual for D_JS */}
                  <div className="mt-3 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDrifting
                          ? 'bg-amber-400'
                          : isElevated
                          ? 'bg-cyan-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(engine.jensen_shannon_divergence * 500, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Parameter Retuning Inspector */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Dynamic Parameter Retuning
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Live weights automatically updated when D_JS crosses threshold to prevent ranking drops.
          </p>

          {selectedEngine ? (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Selected Engine</span>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{selectedEngine.engine_name}</div>
                <div className="text-xs text-slate-300 mt-2 flex justify-between">
                  <span>Optimal Extract Length:</span>
                  <span className="font-mono font-bold text-white">{selectedEngine.optimal_passage_word_count} words</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-white mb-2 block">
                  Auto-Calibrated Lever Weights:
                </span>
                <div className="space-y-2">
                  {Object.entries(selectedEngine.recommended_lever_reweight).map(([lever, weight]) => (
                    <div key={lever} className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize text-slate-300 font-medium">
                          {lever.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {(weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${weight * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/20 text-[11px] text-emerald-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Auto-Optimization Loop
                </div>
                If Google AI Overviews or ChatGPT shifts its citation heuristic, Psychs automatically adjusts word density targets in real time.
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-12">
              Select an engine to view dynamic reweighting parameters.
            </div>
          )}
        </div>
      </div>

      {/* Automated Log Actions */}
      <div className="glass-panel p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Real-Time Calibration Adjustments Log
        </h3>
        <div className="space-y-2">
          {report?.automated_adjustments_applied.map((adj, i) => (
            <div key={i} className="flex items-start gap-2 text-xs font-mono bg-slate-950/80 p-2.5 rounded border border-slate-800 text-slate-300">
              <span className="text-emerald-400 font-bold">[AUTO-CALIBRATION #{i + 1}]</span>
              <span>{adj}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
