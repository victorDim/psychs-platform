import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Zap,
  TrendingUp,
  RefreshCw,
  Clock,
  Radio,
  ExternalLink,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sliders,
  Layers,
  Sparkles,
  Search,
  Eye,
  Crosshair,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  IndexWatchRadarReport,
  EngineVolatilityMetric,
  DetectedAlgorithmUpdate,
  EmergencyHedgePlaybook,
  SeismographDataPoint,
  HedgeExecutionResult
} from '../../types';
import { api } from '../../services/api';

interface AlgorithmIndexWatchStudioProps {
  activeBrand: string;
}

export const AlgorithmIndexWatchStudio: React.FC<AlgorithmIndexWatchStudioProps> = ({ activeBrand }) => {
  const [report, setReport] = useState<IndexWatchRadarReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeWindowDays, setTimeWindowDays] = useState<number>(30);
  const [selectedEngineFilter, setSelectedEngineFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'seismograph' | 'updates' | 'playbooks'>('seismograph');
  const [executingPlaybookId, setExecutingPlaybookId] = useState<string | null>(null);
  const [latestHedgeResult, setLatestHedgeResult] = useState<HedgeExecutionResult | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<DetectedAlgorithmUpdate | null>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<SeismographDataPoint | null>(null);

  useEffect(() => {
    loadRadarReport();
  }, [activeBrand, timeWindowDays]);

  const loadRadarReport = async () => {
    setLoading(true);
    try {
      const data = await api.getIndexWatchRadar(activeBrand, timeWindowDays);
      setReport(data);
    } catch (err) {
      console.error('Failed to load IndexWatch radar report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployPlaybook = async (playbookId: string) => {
    setExecutingPlaybookId(playbookId);
    try {
      const result = await api.triggerEmergencyPlaybook({
        playbook_id: playbookId,
        brand_name: activeBrand
      });
      setLatestHedgeResult(result);
      // Reload radar report to update active hedges
      await loadRadarReport();
    } catch (err) {
      console.error('Failed to deploy emergency hedge playbook:', err);
    } finally {
      setExecutingPlaybookId(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'STORM':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MODERATE':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'CALM':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'ELEVATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'ROUTINE':
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-medium">Scanning frontier search engine telemetry &amp; indexing volatility...</p>
      </div>
    );
  }

  const currentReport = report!;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-xl border border-amber-500/30 text-amber-400 shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Frontier AI Algorithm Volatility &amp; IndexWatch Radar</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  GEO IndexWatch v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time search turbulence telemetry, core algorithm update detection, and automated emergency hedge playbooks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Days Filter */}
          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setTimeWindowDays(days)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeWindowDays === days
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          <button
            onClick={loadRadarReport}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Scan Radar</span>
          </button>
        </div>
      </div>

      {/* Volatility Alert Banner (if STORM or HIGH) */}
      {currentReport.system_status === 'STORM' || currentReport.system_status === 'HIGH' ? (
        <div className="p-4 bg-gradient-to-r from-red-950/40 via-amber-950/30 to-slate-900/40 rounded-xl border border-amber-500/40 flex items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-amber-300">Frontier Search Turbulence Alert:</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/30 text-red-300 border border-red-500/40 rounded-full">
                  {currentReport.active_turbulent_engines} Engine{currentReport.active_turbulent_engines > 1 ? 's' : ''} in High Turbulence
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Google AI Overviews &amp; OpenAI SearchGPT have deployed core indexing adjustments. High citation turnover detected.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('playbooks')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md flex items-center space-x-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Deploy Emergency Hedge</span>
          </button>
        </div>
      ) : null}

      {/* Top 4 Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Composite Volatility */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Composite V_algo Index</span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusBadgeColor(currentReport.system_status)}`}>
              {currentReport.system_status}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{currentReport.composite_volatility_score}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100.0</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Turbulent Engines:</span>
            <span className="font-semibold text-amber-400">{currentReport.active_turbulent_engines} / 5</span>
          </div>
        </div>

        {/* Card 2: 24h Citation Turnover */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Peak Citation Turnover</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">42.8%</span>
            <span className="text-xs text-red-400 font-semibold">+18.2% vs 7d avg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Highest Turbulence:</span>
            <span className="font-semibold text-slate-200">Google AI Overviews</span>
          </div>
        </div>

        {/* Card 3: Detected Algorithm Updates */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detected Core Updates</span>
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-purple-300 tracking-tight">{currentReport.detected_updates.length}</span>
            <span className="text-xs text-amber-400 font-semibold">1 Critical Event</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Latest:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[150px]">
              {currentReport.detected_updates[0]?.title || 'SGE Triangulation'}
            </span>
          </div>
        </div>

        {/* Card 4: Active Defense Hedges */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Defense Hedges</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
              {currentReport.active_defense_hedges > 0 ? `${currentReport.active_defense_hedges} Active` : 'Ready'}
            </span>
            <span className="text-xs text-slate-400 font-medium">3 Playbooks</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Target Recovery Lift:</span>
            <span className="font-semibold text-emerald-400">+18.5% to +26.4%</span>
          </div>
        </div>
      </div>

      {/* 5-Engine Volatility Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Search Engine Volatility Matrix</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Updated {new Date(currentReport.generated_at).toLocaleTimeString()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {currentReport.engine_metrics.map((engine) => (
            <div
              key={engine.engine_id}
              className={`p-4 rounded-xl border transition-all ${
                selectedEngineFilter === engine.engine_id
                  ? 'bg-slate-800/90 border-cyan-500/50 shadow-cyan-500/10 shadow-lg ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white truncate">{engine.engine_name}</span>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${getStatusBadgeColor(engine.status_level)}`}>
                  {engine.status_level}
                </span>
              </div>

              <div className="flex items-baseline space-x-1.5 my-2">
                <span className="text-2xl font-black text-white">{engine.volatility_score}</span>
                <span className="text-[10px] text-slate-400 font-mono">V_algo</span>
              </div>

              {/* Mini 7-day sparkline */}
              <div className="my-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>7D Volatility</span>
                  <span className="font-mono text-slate-300">{engine.historical_7d[engine.historical_7d.length - 1]}</span>
                </div>
                <div className="flex items-end space-x-1 h-6 bg-slate-950/60 p-1 rounded-md border border-slate-800">
                  {engine.historical_7d.map((val, idx) => {
                    const heightPct = Math.max(15, Math.min(100, (val / 100) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-xs transition-all"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: engine.status_color
                        }}
                        title={`Day ${idx + 1}: ${val}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                <div className="flex justify-between">
                  <span>Citation Turnover:</span>
                  <span className="text-slate-200 font-semibold">{engine.citation_turnover_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rank Variance:</span>
                  <span className="text-slate-200 font-semibold">{engine.rank_variance} σ²</span>
                </div>
                <div className="flex justify-between">
                  <span>Entropy H:</span>
                  <span className="text-slate-200 font-semibold">{engine.diversity_entropy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('seismograph')}
          className={`pb-3 transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'seismograph'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>30-Day Volatility Seismograph</span>
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`pb-3 transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'updates'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Detected Algorithm Updates ({currentReport.detected_updates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('playbooks')}
          className={`pb-3 transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'playbooks'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Automated Emergency Playbooks ({currentReport.available_playbooks.length})</span>
        </button>
      </div>

      {/* TAB 1: 30-Day Volatility Seismograph */}
      {activeTab === 'seismograph' && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Frontier Search Indexing Seismograph (30-Day Time Horizon)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Composite platform volatility curve tracked against major AI search algorithm update events.
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300 font-medium">Composite V_algo</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-300 font-medium">Google AIO</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-300 font-medium">SearchGPT</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300 font-semibold">Core Update Event</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Seismograph Visualizer */}
          <div className="relative w-full h-64 bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
            {/* Grid Lines */}
            <div className="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
            </div>

            {/* SVG Wave */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="volatilityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Google AIO Line */}
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="4 4"
                points={currentReport.seismograph_30d
                  .map((pt, idx) => {
                    const x = (idx / (currentReport.seismograph_30d.length - 1)) * 1000;
                    const y = 200 - (pt.google_aio / 100) * 180;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* OpenAI SearchGPT Line */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="3 3"
                points={currentReport.seismograph_30d
                  .map((pt, idx) => {
                    const x = (idx / (currentReport.seismograph_30d.length - 1)) * 1000;
                    const y = 200 - (pt.openai_searchgpt / 100) * 180;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Composite Volatility Area & Line */}
              <polygon
                fill="url(#volatilityGradient)"
                points={`0,200 ${currentReport.seismograph_30d
                  .map((pt, idx) => {
                    const x = (idx / (currentReport.seismograph_30d.length - 1)) * 1000;
                    const y = 200 - (pt.composite_volatility / 100) * 180;
                    return `${x},${y}`;
                  })
                  .join(' ')} 1000,200`}
              />

              <polyline
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3"
                points={currentReport.seismograph_30d
                  .map((pt, idx) => {
                    const x = (idx / (currentReport.seismograph_30d.length - 1)) * 1000;
                    const y = 200 - (pt.composite_volatility / 100) * 180;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Event Markers on Points */}
              {currentReport.seismograph_30d.map((pt, idx) => {
                const x = (idx / (currentReport.seismograph_30d.length - 1)) * 1000;
                const y = 200 - (pt.composite_volatility / 100) * 180;

                if (pt.active_update_event) {
                  return (
                    <g key={idx} className="cursor-pointer" onClick={() => setActiveTab('updates')}>
                      <circle cx={x} cy={y} r="7" fill="#F59E0B" className="animate-pulse" />
                      <circle cx={x} cy={y} r="3" fill="#FFFFFF" />
                      <line x1={x} y1={y} x2={x} y2={y - 25} stroke="#F59E0B" strokeWidth="1.5" />
                      <rect x={x - 40} y={y - 45} width="80" height="18" rx="4" fill="#1E293B" stroke="#F59E0B" strokeWidth="1" />
                      <text x={x} y={y - 33} fill="#FDE68A" fontSize="9" fontWeight="bold" textAnchor="middle">
                        UPDATE
                      </text>
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {/* Hover Tooltip / Seismograph Inspector */}
            {hoveredDataPoint && (
              <div className="absolute top-3 left-4 p-2 bg-slate-900/95 border border-cyan-500/40 rounded-lg shadow-xl text-xs font-mono text-slate-200">
                <div className="font-bold text-cyan-300">{hoveredDataPoint.date}</div>
                <div>Composite V_algo: {hoveredDataPoint.composite_volatility}</div>
                <div>Google AIO: {hoveredDataPoint.google_aio} | SearchGPT: {hoveredDataPoint.openai_searchgpt}</div>
                {hoveredDataPoint.active_update_event && (
                  <div className="text-amber-400 font-semibold mt-1">Event: {hoveredDataPoint.active_update_event}</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-mono">
            <span>{currentReport.seismograph_30d[0]?.date}</span>
            <span>Middle Period ({currentReport.seismograph_30d[15]?.date})</span>
            <span className="text-cyan-400 font-bold">Today ({currentReport.seismograph_30d[currentReport.seismograph_30d.length - 1]?.date})</span>
          </div>
        </div>
      )}

      {/* TAB 2: Detected Algorithm Updates */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5">
            {currentReport.detected_updates.map((update) => (
              <div
                key={update.update_id}
                className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3 backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${getSeverityBadgeColor(update.severity)}`}>
                      {update.severity}
                    </span>
                    <h4 className="text-base font-bold text-white">{update.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                    <span>{update.affected_engine}</span>
                    <span>•</span>
                    <span>{new Date(update.detected_at).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{update.description}</p>

                {/* Confirmed Signals */}
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirmed Telemetry Signals:</span>
                  <div className="flex flex-wrap gap-2">
                    {update.confirmed_markers.map((marker, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-[11px] font-mono bg-slate-800/90 text-slate-300 rounded border border-slate-700/80 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        <span>{marker}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Recommendation */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center space-x-2 text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong className="text-amber-200">Prescribed Tactic:</strong> {update.recommended_action}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('playbooks')}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md font-semibold transition-all shrink-0 flex items-center space-x-1"
                  >
                    <span>View Playbook</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Automated Emergency Hedge Playbooks */}
      {activeTab === 'playbooks' && (
        <div className="space-y-4">
          {/* Latest Execution Banner */}
          {latestHedgeResult && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold">Hedge Deployed Successfully: {latestHedgeResult.title}</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  {latestHedgeResult.execution_id}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300 pt-1">
                <div>Projected GSoV Lift: <strong className="text-emerald-300">{latestHedgeResult.simulated_gsov_recovery_lift}</strong></div>
                <div>Volatility Relief: <strong className="text-cyan-300">{latestHedgeResult.volatility_relief_delta}</strong></div>
                <div>Execution Duration: <strong className="text-slate-200">{latestHedgeResult.execution_duration_sec}s</strong></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {currentReport.available_playbooks.map((playbook) => (
              <div
                key={playbook.playbook_id}
                className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between space-y-4 backdrop-blur-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                      {playbook.playbook_id}
                    </span>
                    <span className="text-xs font-semibold text-amber-400">Trigger: V_algo &gt; {playbook.trigger_threshold}</span>
                  </div>

                  <h4 className="text-base font-bold text-white">{playbook.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{playbook.description}</p>

                  {/* Actions Checklist */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Automated Actions:</span>
                    <div className="space-y-1">
                      {playbook.action_steps.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estimated Lift:</span>
                    <span className="font-bold text-emerald-400">{playbook.estimated_lift_recovery}</span>
                  </div>

                  <button
                    onClick={() => handleDeployPlaybook(playbook.playbook_id)}
                    disabled={executingPlaybookId === playbook.playbook_id}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {executingPlaybookId === playbook.playbook_id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Deploying Defense Hedge...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Deploy Emergency Playbook</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cryptographic SHA-256 Audit Seal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-500">
        <div className="flex items-center space-x-2">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>WORM Audit Hash:</span>
          <span className="text-slate-400 truncate max-w-xs">{currentReport.audit_hash}</span>
        </div>
        <div className="text-slate-500">
          Generated: {new Date(currentReport.generated_at).toUTCString()}
        </div>
      </div>
    </div>
  );
};
