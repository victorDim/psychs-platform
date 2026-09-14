import React, { useState, useEffect } from 'react';
import {
  Swords,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  FileCode,
  Flame,
  Globe,
  Sliders,
  ChevronRight,
  Send,
  Lock,
  BarChart3,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import {
  CompetitorEntity,
  ComparisonMatrixItem,
  SiphoningStrategyPayload,
  SiphoningLiftSimulationResult,
  CompetitorSiphoningReport
} from '../../types';

interface CompetitorCounterPositioningStudioProps {
  activeBrand: string;
}

export const CompetitorCounterPositioningStudio: React.FC<CompetitorCounterPositioningStudioProps> = ({
  activeBrand
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'landscape' | 'simulator' | 'campaigns'>('matrix');
  const [report, setReport] = useState<CompetitorSiphoningReport | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('Profound');
  const [selectedAngle, setSelectedAngle] = useState<'PERFORMANCE_ARCHITECTURE' | 'ENTERPRISE_SECURITY' | 'PRICING_TRANSPARENCY'>('PERFORMANCE_ARCHITECTURE');
  const [strategy, setStrategy] = useState<SiphoningStrategyPayload | null>(null);
  const [simulation, setSimulation] = useState<SiphoningLiftSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'schema'>('visual');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rep = await api.getCompetitorLandscape(activeBrand);
      setReport(rep);
      if (rep.competitors && rep.competitors.length > 0) {
        const firstComp = rep.competitors[0].name;
        setSelectedCompetitor(firstComp);
        await handleSynthesize(activeBrand, firstComp, selectedAngle);
      }
    } catch (err) {
      console.error('Failed to load competitor counter-positioning data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynthesize = async (brand: string, competitor: string, angle: string) => {
    setIsSynthesizing(true);
    try {
      const strat = await api.synthesizeCounterStrategy({
        brand_name: brand,
        competitor_name: competitor,
        comparative_angle: angle
      });
      setStrategy(strat);

      // Trigger automatic simulation
      const sim = await api.simulateSiphoningLift({
        brand_name: brand,
        competitor_name: competitor,
        strategy_id: strat.strategy_id
      });
      setSimulation(sim);
    } catch (err) {
      console.error('Failed to synthesize strategy:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBrand]);

  const copyCode = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const angles = [
    { id: 'PERFORMANCE_ARCHITECTURE', label: 'Performance & Architecture', icon: Zap, badge: '+28.2% Lift' },
    { id: 'ENTERPRISE_SECURITY', label: 'Enterprise Security & Compliance', icon: ShieldCheck, badge: '+26.4% Lift' },
    { id: 'PRICING_TRANSPARENCY', label: 'Pricing & Token Economics', icon: TrendingUp, badge: '+21.8% Lift' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Cockpit Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Swords className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Competitor Counter-Positioning &amp; Search Siphoning Matrix
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Target: {activeBrand}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  KDD-2024 Levers
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Exploit competitor citation vulnerabilities on SearchGPT, Perplexity Pro, and Google AI Overviews with programmatic <span className="text-rose-400 font-mono">/vs/</span> comparison tables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSynthesize(activeBrand, selectedCompetitor, selectedAngle)}
              disabled={isSynthesizing}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-lg transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
              {isSynthesizing ? 'Synthesizing Matrix...' : 'Re-synthesize Strategy'}
            </button>
          </div>
        </div>

        {/* 4 Scorecard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Potential SOV Siphoned</span>
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400 mt-1">
              +{report?.potential_siphoned_sov_pct || 24.8}%{' '}
              <span className="text-xs font-normal text-slate-500">GSoV gain</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across 50 competitive prompt clusters
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Tracked Competitors</span>
              <Swords className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {report?.total_competitors_tracked || 4}{' '}
              <span className="text-xs font-normal text-slate-500">direct targets</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Avg Head-to-Head Win Rate: 77.4%
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Exploitable Vulnerabilities</span>
              <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {report?.total_vulnerabilities_cataloged || 12}{' '}
              <span className="text-xs font-normal text-slate-500">vectors</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Pricing, Security &amp; pgvector Gaps
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Active Siphoning Pages</span>
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {report?.active_campaign_routes.length || 4}{' '}
              <span className="text-xs font-normal text-slate-500">URLs indexed</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              /vs/profound &bull; /vs/conductor
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 bg-[#070a11] px-4 rounded-t-xl gap-2 overflow-x-auto">
        {[
          { id: 'matrix', label: 'Programmatic Comparison Matrix', icon: Layers, badge: 'Live Synthesizer' },
          { id: 'landscape', label: 'Competitor Vulnerability Radar', icon: Swords, count: report?.competitors.length },
          { id: 'simulator', label: 'Search Siphoning Lift Simulator', icon: BarChart3, badge: '+25.7% GSoV' },
          { id: 'campaigns', label: 'Active Programmatic Campaigns', icon: Globe, count: report?.active_campaign_routes.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: PROGRAMMATIC COMPARISON MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {/* Target & Angle Selector Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Target Competitor:</span>
              <div className="flex gap-2">
                {report?.competitors.map(c => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedCompetitor(c.name);
                      handleSynthesize(activeBrand, c.name, selectedAngle);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedCompetitor === c.name
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Angle:</span>
              <div className="flex gap-1.5">
                {angles.map(a => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelectedAngle(a.id as any);
                      handleSynthesize(activeBrand, selectedCompetitor, a.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedAngle === a.id
                        ? 'bg-slate-800 border-slate-600 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {a.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Synthesis Viewport Header */}
          {strategy && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{strategy.suggested_page_title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +{strategy.predicted_gsov_siphoning_lift}% Siphoning Lift
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{strategy.meta_description}</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                      viewMode === 'visual' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Visual Matrix
                  </button>
                  <button
                    onClick={() => setViewMode('html')}
                    className={`px-3 py-1 text-xs rounded font-medium transition-all flex items-center gap-1 ${
                      viewMode === 'html' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3 h-3" /> HTML Snippet
                  </button>
                  <button
                    onClick={() => setViewMode('schema')}
                    className={`px-3 py-1 text-xs rounded font-medium transition-all flex items-center gap-1 ${
                      viewMode === 'schema' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3 h-3" /> JSON-LD Schema
                  </button>
                </div>
              </div>

              {/* View Mode 1: Visual Matrix Table */}
              {viewMode === 'visual' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                      <tr>
                        <th className="p-3 font-semibold w-1/4">Capability Dimension</th>
                        <th className="p-3 font-semibold w-1/3 text-emerald-400">
                          {activeBrand} (Verified Superiority)
                        </th>
                        <th className="p-3 font-semibold w-1/3 text-rose-400">
                          {strategy.target_competitor} (Vulnerability Vector)
                        </th>
                        <th className="p-3 font-semibold text-center w-24">Disposition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {strategy.matrix_items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-medium text-slate-200">
                            {item.dimension_name}
                          </td>
                          <td className="p-3 text-slate-300 bg-emerald-950/10 border-x border-emerald-500/10">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="font-semibold text-white">{item.brand_capability}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-400 bg-rose-950/10">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <span>{item.competitor_capability}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              + WON
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View Mode 2: HTML Comparison Table */}
              {viewMode === 'html' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono">Accessible SEO/GEO Semantic Table Snippet</span>
                    <button
                      onClick={() => copyCode(strategy.html_comparison_table, 'html')}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-all"
                    >
                      {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedType === 'html' ? 'Copied HTML!' : 'Copy HTML'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
                    {strategy.html_comparison_table}
                  </pre>
                </div>
              )}

              {/* View Mode 3: Schema.org JSON-LD */}
              {viewMode === 'schema' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono">Schema.org / ItemComparison Table Microdata</span>
                    <button
                      onClick={() => copyCode(JSON.stringify(strategy.schema_jsonld_table, null, 2), 'schema')}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-all"
                    >
                      {copiedType === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedType === 'schema' ? 'Copied Schema!' : 'Copy Schema'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400 overflow-x-auto max-h-96">
                    {JSON.stringify(strategy.schema_jsonld_table, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-slate-800 text-xs text-slate-400 gap-2">
                <span className="font-mono">Route: {strategy.recommended_route}</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Factual Evidence Validated
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: COMPETITOR LANDSCAPE & VULNERABILITY RADAR */}
      {activeSubTab === 'landscape' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Competitor Vulnerability Landscape</h2>
              <p className="text-xs text-slate-400">
                Identified factual weaknesses, missing enterprise compliance credentials, and vulnerable prompt clusters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report?.competitors.map(comp => (
              <div
                key={comp.competitor_id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{comp.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {comp.domain}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Head-to-Head Win Rate vs {activeBrand}: <strong className="text-emerald-400">{comp.head_to_head_win_rate}%</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Current GSoV</span>
                    <div className="text-lg font-bold text-rose-400">{comp.current_gsov_pct}%</div>
                  </div>
                </div>

                {/* Vulnerability Tags */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">Detected Technical Vulnerabilities:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.vulnerability_tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vulnerable Prompt Clusters */}
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Vulnerable Query Clusters:</div>
                  <div className="space-y-1 text-xs text-slate-300">
                    {comp.vulnerable_prompt_clusters.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-rose-400" />
                        <span className="italic">"{p}"</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCompetitor(comp.name);
                      setActiveSubTab('matrix');
                      handleSynthesize(activeBrand, comp.name, selectedAngle);
                    }}
                    className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Synthesize /vs/{comp.name} Matrix
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SEARCH SIPHONING LIFT SIMULATOR */}
      {activeSubTab === 'simulator' && simulation && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Search Siphoning Market Share Simulation</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  +{simulation.net_siphoned_market_share}% GSoV Transfer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Empirical simulation of market share captured from <strong className="text-white">{simulation.target_competitor}</strong> by deploying structured counter-positioning matrices across 5 frontier AI search engines.
              </p>
            </div>

            {/* Before vs After GSoV Comparison Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">{activeBrand} (Our Brand)</span>
                  <span className="text-emerald-400 font-bold">{simulation.baseline_brand_gsov}% &rarr; {simulation.projected_brand_gsov}% GSoV</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-slate-600 h-full" style={{ width: `${simulation.baseline_brand_gsov}%` }} />
                  <div className="bg-emerald-500 h-full animate-pulse" style={{ width: `${simulation.projected_brand_gsov - simulation.baseline_brand_gsov}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">{simulation.target_competitor} (Competitor Share Siphoned)</span>
                  <span className="text-rose-400 font-bold">{simulation.baseline_competitor_gsov}% &rarr; {simulation.projected_competitor_gsov}% GSoV</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-rose-500 h-full" style={{ width: `${simulation.projected_competitor_gsov}%` }} />
                  <div className="bg-rose-950 h-full" style={{ width: `${simulation.baseline_competitor_gsov - simulation.projected_competitor_gsov}%` }} />
                </div>
              </div>
            </div>

            {/* 5-Engine Breakdown Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">5-Engine Siphoning Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.entries(simulation.engine_breakdown).map(([engine, data]) => {
                  const gain = data.post_brand - data.baseline_brand;
                  return (
                    <div key={engine} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-2">
                      <div className="text-xs font-semibold text-white truncate" title={engine}>
                        {engine}
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Post GSoV:</span>
                        <span className="text-emerald-400 font-bold">{data.post_brand}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Siphoned:</span>
                        <span className="text-rose-400 font-semibold">+{gain.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${data.post_brand}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ACTIVE CAMPAIGNS & ROUTES */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Active Programmatic Counter-Positioning Routes</h2>
              <p className="text-xs text-slate-400">
                Deployed comparison URLs and alternative landing pages actively crawled by AI search grounding bots.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-medium">Route Path</th>
                  <th className="p-3.5 font-medium">Target Entity</th>
                  <th className="p-3.5 font-medium">Structured Microdata</th>
                  <th className="p-3.5 font-medium">Index Status</th>
                  <th className="p-3.5 font-medium">Search Siphoning Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {report?.active_campaign_routes.map((route, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                      {route}
                    </td>
                    <td className="p-3.5 text-white font-medium">
                      {route.replace('/vs/', '').replace('/alternatives/', '').toUpperCase()}
                    </td>
                    <td className="p-3.5 text-cyan-400 font-mono text-[11px]">
                      Schema.org/Table + FAQPage
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> Indexed by SearchGPT
                      </span>
                    </td>
                    <td className="p-3.5 text-emerald-400 font-bold font-mono">
                      +28.2% SOV
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
