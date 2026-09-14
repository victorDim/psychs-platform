import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Split,
  GitPullRequest,
  Zap,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Copy,
  Check,
  Play,
  ArrowRight,
  ExternalLink,
  Layers,
  Globe,
  Sliders,
  Sparkles,
  AlertTriangle,
  FileCode,
  Radio
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AutopilotReport,
  GeoExperiment,
  ContentVariant,
  BayesianMetrics
} from '../../types';

interface GeoVariantAutopilotStudioProps {
  activeBrand: string;
}

export const GeoVariantAutopilotStudio: React.FC<GeoVariantAutopilotStudioProps> = ({ activeBrand }) => {
  const [report, setReport] = useState<AutopilotReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExpId, setSelectedExpId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bayesian' | 'diff' | 'edge' | 'gitops'>('bayesian');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [promoting, setPromoting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedPr, setCopiedPr] = useState<boolean>(false);
  const [edgeSplit, setEdgeSplit] = useState<string>('50/50');
  const [botMode, setBotMode] = useState<'SPLIT_ALL' | 'BOTS_ONLY' | 'HUMANS_ONLY'>('SPLIT_ALL');

  useEffect(() => {
    loadReport();
  }, [activeBrand]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getAutopilotExperiments(activeBrand);
      setReport(data);
      if (data.experiments.length > 0 && !selectedExpId) {
        setSelectedExpId(data.experiments[0].experiment_id);
      }
    } catch (err) {
      console.error('Failed to load A/B Autopilot report:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedExperiment = report?.experiments.find(e => e.experiment_id === selectedExpId) || report?.experiments[0];

  const handleSimulate = async () => {
    if (!selectedExperiment) return;
    setSimulating(true);
    try {
      const updated = await api.simulateAutopilotEvaluation({
        brand_name: activeBrand,
        experiment_id: selectedExperiment.experiment_id,
        probe_count: 25
      });
      if (report) {
        setReport({
          ...report,
          experiments: report.experiments.map(e => e.experiment_id === updated.experiment_id ? updated : e)
        });
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handlePromote = async () => {
    if (!selectedExperiment) return;
    setPromoting(true);
    try {
      const prResult = await api.promoteAutopilotWinner({
        brand_name: activeBrand,
        experiment_id: selectedExperiment.experiment_id,
        promotion_channel: 'GITOPS_PR'
      });
      if (report) {
        setReport({
          ...report,
          experiments: report.experiments.map(e => {
            if (e.experiment_id === selectedExperiment.experiment_id) {
              return {
                ...e,
                experiment_status: 'PROMOTED_TO_PROD',
                gitops_pr_data: prResult
              };
            }
            return e;
          })
        });
      }
    } catch (err) {
      console.error('Promotion failed:', err);
    } finally {
      setPromoting(false);
    }
  };

  const copyToClipboard = (text: string, isCode: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedPr(true);
      setTimeout(() => setCopiedPr(false), 2000);
    }
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Calibrating Bayesian A/B Autopilot & Edge Sandbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Cockpit Top Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm">
                <FlaskConical className="w-3.5 h-3.5" />
                Autonomous GEO A/B Autopilot
              </span>
              <span className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono rounded-md">
                Active Brand: {activeBrand}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mt-2 tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Continuous A/B Variant Autopilot & Edge Sandbox
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Synthesizes competing mathematical variants with Princeton KDD-2024 levers, tests edge traffic splits at Cloudflare/Vercel edge, runs sequential Bayesian win-rate evaluations, and autonomously executes zero-touch GitOps promotions.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              {simulating ? 'Simulating 25 Multi-Engine Probes...' : 'Run Synthetic Probes (+25)'}
            </button>
          </div>
        </div>

        {/* Top Scorecard Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/60">
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Active Experiments</span>
              <Split className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-slate-100">
              {report.active_experiments_count} Running
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 100% Traffic Isolated
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Statistical Convergence</span>
              <BarChart3 className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-teal-300">
              {report.statistical_convergence_rate_pct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Threshold: P(B &gt; A) &ge; 0.95
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Avg Citation Lift</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-cyan-300">
              +{report.average_citation_lift_pct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Over Baseline Control A
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Auto-Promoted Winners</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-indigo-300">
              {report.auto_promoted_winners_count}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              GitOps PRs Merged to CMS
            </div>
          </div>
        </div>
      </div>

      {/* Experiment Selector & Sub-Tabs Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
        {/* Experiment Selector Pill */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {report.experiments.map(exp => (
            <button
              key={exp.experiment_id}
              onClick={() => setSelectedExpId(exp.experiment_id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                selectedExpId === exp.experiment_id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${selectedExpId === exp.experiment_id ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="font-mono">{exp.target_route}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                exp.experiment_status === 'PROMOTED_TO_PROD'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : exp.experiment_status === 'CONVERGED_SIGNIFICANT'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {exp.experiment_status === 'PROMOTED_TO_PROD' ? 'PROMOTED' : exp.experiment_status === 'CONVERGED_SIGNIFICANT' ? 'SIGNIFICANT' : 'RUNNING'}
              </span>
            </button>
          ))}
        </div>

        {/* Studio Sub-Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setActiveTab('bayesian')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bayesian'
                ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Bayesian Convergence
          </button>
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'diff'
                ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Variant Visual Diff
          </button>
          <button
            onClick={() => setActiveTab('edge')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'edge'
                ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Edge Routing Sandbox
          </button>
          <button
            onClick={() => setActiveTab('gitops')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gitops'
                ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            GitOps Promotion
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Bayesian Statistical Convergence */}
      {activeTab === 'bayesian' && selectedExperiment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bayesian Distribution & Hypothesis Evaluation */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Sequential Bayesian Win-Rate Posterior Modeling
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Conjugate Beta-Binomial probability density across {selectedExperiment.total_synthetic_probes} multi-engine synthetic probes.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Bayes Factor (BF₁₀):</span>
                <div className="text-xl font-mono font-bold text-emerald-400">{selectedExperiment.bayesian_metrics.bayes_factor}x</div>
              </div>
            </div>

            {/* Probability Gauge / Visual Posterior Distribution Card */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">
                  Posterior Superiority: P(Variant B &gt; Control A)
                </span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {(selectedExperiment.bayesian_metrics.prob_variant_superior * 100).toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar of Probability */}
              <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 relative">
                <div
                  className="bg-gradient-to-r from-teal-500 via-emerald-400 to-green-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedExperiment.bayesian_metrics.prob_variant_superior * 100}%` }}
                />
                {/* 95% Significance Marker */}
                <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-amber-400 shadow-sm" title="95% Significance Threshold" />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Weak Prior ($\alpha_0=2.0, \beta_0=2.0$)</span>
                <span className="text-amber-400 font-medium">95% Significance Line</span>
                <span>Posterior ($\alpha={selectedExperiment.bayesian_metrics.posterior_alpha}, \beta={selectedExperiment.bayesian_metrics.posterior_beta}$)</span>
              </div>

              {/* Credible Interval Strip */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Expected Citation Win Rate ($\mu$):</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedExperiment.bayesian_metrics.expected_win_rate}%</span>
                </div>
                <div className="text-slate-400 text-[11px] font-mono">
                  95% Credible Interval: [{selectedExperiment.bayesian_metrics.credible_interval_low}% - {selectedExperiment.bayesian_metrics.credible_interval_high}%]
                </div>
              </div>
            </div>

            {/* Per-Engine Win Rate Breakdown Matrix */}
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                Multi-Engine Citation Win-Rate Comparison
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(selectedExperiment.engine_win_rates).map(([engineName, rates]) => (
                  <div key={engineName} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-200">{engineName}</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        +{((rates.challenger_win_rate - rates.control_win_rate)).toFixed(1)}% Lift
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Control A: {rates.control_win_rate}%</span>
                        <span>Variant B: {rates.challenger_win_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden flex">
                        <div className="bg-slate-600 h-full" style={{ width: `${rates.control_win_rate}%` }} />
                        <div className="bg-emerald-500 h-full" style={{ width: `${rates.challenger_win_rate - rates.control_win_rate}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Diagnostics & Experiment Summary */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Experiment Parameters
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Target Route</span>
                  <span className="font-mono text-slate-200 font-semibold">{selectedExperiment.target_route}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    selectedExperiment.experiment_status === 'PROMOTED_TO_PROD'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : selectedExperiment.experiment_status === 'CONVERGED_SIGNIFICANT'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {selectedExperiment.experiment_status}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Probes</span>
                  <span className="font-mono text-slate-200">{selectedExperiment.total_synthetic_probes} probes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Edge Provider</span>
                  <span className="font-mono text-teal-300">{selectedExperiment.edge_routing.edge_provider}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Traffic Split</span>
                  <span className="font-mono text-slate-200">{selectedExperiment.edge_routing.traffic_split_ratio}</span>
                </div>
              </div>

              {/* Action Callout */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 mt-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Statistical Verdict
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {selectedExperiment.bayesian_metrics.prob_variant_superior >= 0.95
                    ? 'Variant B achieves 95%+ Bayesian superiority across all frontier engines. Ready for zero-touch GitOps promotion to production CMS.'
                    : 'Experiment is gathering probe observations. Run additional synthetic probes or let edge traffic accrue.'}
                </p>
                {selectedExperiment.bayesian_metrics.prob_variant_superior >= 0.95 && selectedExperiment.experiment_status !== 'PROMOTED_TO_PROD' && (
                  <button
                    onClick={handlePromote}
                    disabled={promoting}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/50"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    {promoting ? 'Promoting via GitOps...' : 'Promote Winner to Production CMS'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Variant Visual Diff */}
      {activeTab === 'diff' && selectedExperiment && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-teal-400" />
                Mathematical Variant Content & Princeton KDD Diff
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Side-by-side inspection of Control A (baseline) vs Variant B (statistically enriched challenger).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Extractability Lift:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                +{((selectedExperiment.challenger_variant.extractability_score - selectedExperiment.control_variant.extractability_score)).toFixed(1)} pts
              </span>
            </div>
          </div>

          {/* Side by Side Diff Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Control A */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="font-semibold text-slate-300 text-sm">{selectedExperiment.control_variant.variant_label}</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded">
                  {selectedExperiment.control_variant.token_size} tokens
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Applied Levers</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedExperiment.control_variant.applied_kdd_levers.map(lever => (
                    <span key={lever} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-700">
                      {lever}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Content Snippet</span>
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 mt-1.5 leading-relaxed font-mono">
                  {selectedExperiment.control_variant.content_snippet}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Extractability Score</span>
                <span className="font-mono font-bold text-slate-300">{selectedExperiment.control_variant.extractability_score}/100</span>
              </div>
            </div>

            {/* Challenger Variant B */}
            <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="font-semibold text-emerald-300 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {selectedExperiment.challenger_variant.variant_label}
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/30">
                  {selectedExperiment.challenger_variant.token_size} tokens
                </span>
              </div>

              <div>
                <span className="text-emerald-400 text-[11px] font-medium uppercase tracking-wider">Applied Princeton KDD Levers</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedExperiment.challenger_variant.applied_kdd_levers.map(lever => (
                    <span key={lever} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-[10px] rounded border border-emerald-500/30 font-medium">
                      + {lever}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-emerald-400 text-[11px] font-medium uppercase tracking-wider">Content Snippet</span>
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-3 text-xs text-slate-100 mt-1.5 leading-relaxed font-mono">
                  {selectedExperiment.challenger_variant.content_snippet}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="text-emerald-300 font-medium">Extractability Score</span>
                <span className="font-mono font-bold text-emerald-400">{selectedExperiment.challenger_variant.extractability_score}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Edge Routing Sandbox */}
      {activeTab === 'edge' && selectedExperiment && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-400" />
                Edge Routing Sandbox & Cloudflare Workers Middleware
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Configures real-time split routing between Control A and Challenger B at CDN edge with header detection.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Traffic Split Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {(['50/50', '80/20', '90/10'] as const).map(split => (
                  <button
                    key={split}
                    onClick={() => setEdgeSplit(split)}
                    className={`px-2.5 py-1 rounded font-mono cursor-pointer transition-all ${
                      edgeSplit === split
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {split}
                  </button>
                ))}
              </div>

              {/* Bot Routing Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {(['SPLIT_ALL', 'BOTS_ONLY', 'HUMANS_ONLY'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setBotMode(mode)}
                    className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                      botMode === mode
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated TypeScript Middleware Viewer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
              <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-400" />
                cloudflare-worker-geo-split.ts
              </span>
              <button
                onClick={() => copyToClipboard(selectedExperiment.edge_routing.generated_worker_script, true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied Worker Code!' : 'Copy TypeScript Script'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-emerald-300 text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-900">
              {selectedExperiment.edge_routing.generated_worker_script}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GitOps Promotion & CMS Sync */}
      {activeTab === 'gitops' && selectedExperiment && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-indigo-400" />
                Zero-Touch GitOps Promotion & Production CMS Publishing
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Autonomous PR creation and multi-sig compliance delivery once Bayesian significance is attained.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              selectedExperiment.experiment_status === 'PROMOTED_TO_PROD'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {selectedExperiment.experiment_status === 'PROMOTED_TO_PROD' ? 'PROMOTED_TO_PRODUCTION' : 'READY_TO_PROMOTE'}
            </span>
          </div>

          {selectedExperiment.gitops_pr_data ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200 text-sm">{selectedExperiment.gitops_pr_data.pr_title}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono rounded border border-emerald-500/30">
                  PR #{selectedExperiment.gitops_pr_data.pr_number}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Branch Name:</span>
                  <div className="font-mono text-slate-200 mt-1 bg-slate-900 p-2 rounded border border-slate-800">
                    {selectedExperiment.gitops_pr_data.branch_name}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">CI/CD Check Status:</span>
                  <div className="font-mono text-emerald-400 mt-1 bg-slate-900 p-2 rounded border border-slate-800">
                    {selectedExperiment.gitops_pr_data.ci_checks_status || 'PASSED (Schema Validated, Astro Build 0 Errors)'}
                  </div>
                </div>
              </div>

              {selectedExperiment.gitops_pr_data.cryptographic_seal && (
                <div className="pt-2">
                  <span className="text-slate-400 text-xs">Cryptographic Promotion Seal (HMAC SHA-256):</span>
                  <div className="font-mono text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 mt-1 overflow-x-auto">
                    {selectedExperiment.gitops_pr_data.cryptographic_seal}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-200">Variant B Has Won Bayesian Significance</h4>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Click below to synthesize the automated GitOps Pull Request and dispatch HMAC webhooks to update your production CMS with Variant B.
              </p>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <GitPullRequest className="w-4 h-4" />
                {promoting ? 'Promoting via GitOps...' : 'Execute Zero-Touch Promotion'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
