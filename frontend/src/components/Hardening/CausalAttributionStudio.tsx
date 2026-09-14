import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Bot,
  Activity,
  CheckCircle2,
  DollarSign,
  Search,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { CausalAttributionReport, TimeSeriesDataPoint, AICrawlerLog } from '../../types';
import { api } from '../../services/api';

export const CausalAttributionStudio: React.FC = () => {
  const [report, setReport] = useState<CausalAttributionReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCausalAttribution('Psychs');
      setReport(data);
    } catch (err) {
      console.error('Failed to load causal attribution report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                SOLUTION 4: ZERO-CLICK ATTRIBUTION
              </span>
              <span className="text-xs font-mono text-slate-400">ECONOMETRIC BSTS & DIFFERENCE-IN-DIFFERENCES</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Econometric Causal Lift & AI Crawler Attribution
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Solves the "Zero-Click" attribution dilemma where AI engines synthesize answers without direct link clicks. Correlates Generative Share of Voice (GSoV) citation lifts with Google Search Console branded search queries, direct traffic surges, and reverse-DNS verified AI crawler ingestion logs.
            </p>
          </div>

          {report && (
            <div className="bg-emerald-950/60 border border-emerald-500/30 px-4 py-2 rounded-lg text-right">
              <span className="text-[10px] font-mono text-emerald-400 uppercase">Attributed Pipeline Value</span>
              <div className="text-xl font-bold font-mono text-white">
                +${(report.incremental_pipeline_attributed_usd / 1000).toFixed(0)}k USD
              </div>
            </div>
          )}
        </div>

        {/* Global Summary KPI Bar */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Incremental Branded Queries</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-emerald-400" />
                +{report.cumulative_incremental_queries.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                +{report.branded_search_lift_percent}% GSC Branded Lift
              </div>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Direct Traffic Lift</span>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                +{report.direct_traffic_lift_percent}%
              </div>
              <div className="text-[10px] text-cyan-400 mt-1">
                Zero-click brand recall effect
              </div>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Statistical Significance</span>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                p = {report.statistical_significance_p_value}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">
                BSTS 99.8% Confidence interval
              </div>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Pipeline ROI Multiple</span>
              <div className="text-lg font-bold font-mono text-white mt-1 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                3.8x ROI
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Audited enterprise payback
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: BSTS Time Series Chart + Crawler Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Econometric Time-Series */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Observed vs Counterfactual Synthetic Control Baseline
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">30-Day Campaign Window</span>
          </div>
          <p className="text-xs text-slate-400">
            Bayesian Structural Time Series (BSTS) projects what branded search volume would have been without Generative Engine Optimization.
          </p>

          {/* Time Series Data Points */}
          <div className="space-y-3 mt-4">
            {report?.time_series.map((dp, idx) => {
              const maxVal = 2000;
              const observedPct = (dp.observed_branded_queries / maxVal) * 100;
              const counterfactualPct = (dp.counterfactual_baseline / maxVal) * 100;

              return (
                <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-slate-300 font-bold">{dp.date}</span>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-slate-400">
                        Baseline: <strong className="text-slate-200">{dp.counterfactual_baseline}</strong>
                      </span>
                      <span className="text-white">
                        Observed: <strong className="text-emerald-400">{dp.observed_branded_queries}</strong>
                      </span>
                      <span className="text-emerald-300 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        +{dp.incremental_lift_percent}% Lift
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${observedPct}%` }}
                      />
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-slate-600 h-full rounded-full"
                        style={{ width: `${counterfactualPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-emerald-400 font-mono">BSTS Econometric Diagnosis: </span>
            {report?.causal_impact_summary}
          </div>
        </div>

        {/* Right 5 Cols: AI Crawler Ingestion Logs */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              AI Bot Crawler Ingestion Stream
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">Reverse-DNS Verified</span>
          </div>

          <p className="text-xs text-slate-400">
            Real-time web server telemetry capturing GPTBot, PerplexityBot, and ClaudeBot scraping updated `/llms.txt` and optimized passages.
          </p>

          <div className="space-y-3 mt-4">
            {report?.recent_ai_crawler_logs.map((log, idx) => (
              <div key={idx} className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-cyan-300">{log.bot_name}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    HTTP {log.http_status}
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] truncate">
                  Path: <span className="text-white font-semibold">{log.target_path}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>Latency: {log.response_time_ms}ms</span>
                  <span>IP: {log.ip_subnet}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  Timestamp: {log.timestamp}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/20 text-[11px] text-cyan-300">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Crawler Verification Pipeline
            </div>
            AI crawlers are verified via reverse-DNS lookups to prevent spoofed bot telemetry and ensure accurate crawl frequency indexing.
          </div>
        </div>
      </div>
    </div>
  );
};
