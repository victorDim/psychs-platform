import React, { useState, useEffect } from 'react';
import {
  MessageSquareCode,
  Users,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  FileText,
  HelpCircle,
  ChevronRight,
  Target,
  BarChart3,
  Layers,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import {
  BuyerJourneyReport,
  BuyerPersona,
  JourneySimulation,
  JourneyTurn,
  ObjectionPreemptionPatch
} from '../../types';

interface BuyerJourneySimulatorStudioProps {
  activeBrand: string;
}

export const BuyerJourneySimulatorStudio: React.FC<BuyerJourneySimulatorStudioProps> = ({ activeBrand }) => {
  const [report, setReport] = useState<BuyerJourneyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'radar' | 'dialogue' | 'preemption'>('radar');
  const [selectedPersona, setSelectedPersona] = useState<BuyerPersona | null>(null);
  const [selectedSimulation, setSelectedSimulation] = useState<JourneySimulation | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<string>('OpenAI SearchGPT');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [copiedPatchId, setCopiedPatchId] = useState<string | null>(null);
  const [copiedBlockType, setCopiedBlockType] = useState<string | null>(null);
  const [activePreemptionTag, setActivePreemptionTag] = useState<string>('ON_PREM_AIR_GAP_UNCERTAINTY');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  useEffect(() => {
    loadReport();
  }, [activeBrand]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getBuyerJourneyReport(activeBrand);
      setReport(data);
      if (data.personas && data.personas.length > 0) {
        setSelectedPersona(data.personas[0]);
      }
      if (data.recent_simulations && data.recent_simulations.length > 0) {
        setSelectedSimulation(data.recent_simulations[0]);
      }
    } catch (err) {
      console.error('Failed to load buyer journey report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async (personaId: string) => {
    try {
      setIsSimulating(true);
      setSimulationProgress(15);
      
      const interval = setInterval(() => {
        setSimulationProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 25;
        });
      }, 300);

      const sim = await api.runPersonaSimulation({
        brand_name: activeBrand,
        persona_id: personaId,
        target_engine: selectedEngine
      });

      clearInterval(interval);
      setSimulationProgress(100);

      setTimeout(() => {
        setIsSimulating(false);
        setSimulationProgress(0);
        setSelectedSimulation(sim);
        setActiveTab('dialogue');
        loadReport();
      }, 500);
    } catch (err) {
      console.error('Simulation execution failed:', err);
      setIsSimulating(false);
      setSimulationProgress(0);
    }
  };

  const handleSynthesizePreemption = async (tag: string, destination: string = 'SCHEMA_FAQ_PAGE') => {
    try {
      setIsSynthesizing(true);
      const patch = await api.synthesizeObjectionPreemption({
        brand_name: activeBrand,
        objection_tag: tag,
        target_destination: destination
      });
      setIsSynthesizing(false);
      loadReport();
    } catch (err) {
      console.error('Failed to synthesize preemption:', err);
      setIsSynthesizing(false);
    }
  };

  const copyToClipboard = (text: string, patchId: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPatchId(patchId);
    setCopiedBlockType(type);
    setTimeout(() => {
      setCopiedPatchId(null);
      setCopiedBlockType(null);
    }, 2500);
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-4" />
        <p className="text-sm font-medium">Loading Multi-Turn Buyer Journey Simulator...</p>
      </div>
    );
  }

  const csorPct = report?.overall_csor_pct || 84.0;
  const personasCount = report?.personas?.length || 5;
  const simsCount = report?.recent_simulations?.length || 3;
  const patchesCount = report?.objection_patches?.length || 3;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Cockpit Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <MessageSquareCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Conversational AI Purchase Intent Simulator
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CSoR v2.4
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-turn B2B consultative buyer journey emulation, Conversion Share of Recommendation (CSoR), and objection-preemption synthesis.
                </p>
              </div>
            </div>
          </div>

          {/* Engine Selector & Quick Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Engine:</span>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="OpenAI SearchGPT" className="bg-slate-900 text-white">OpenAI SearchGPT</option>
                <option value="Perplexity Pro" className="bg-slate-900 text-white">Perplexity Pro</option>
                <option value="Google AI Overviews" className="bg-slate-900 text-white">Google AI Overviews</option>
                <option value="Claude Search 3.5 Sonnet" className="bg-slate-900 text-white">Claude Search 3.5</option>
              </select>
            </div>

            <button
              onClick={() => selectedPersona && handleRunSimulation(selectedPersona.persona_id)}
              disabled={isSimulating || !selectedPersona}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating ({simulationProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run 4-Turn Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Overall CSoR Metric</span>
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {csorPct}%
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Conversion Share of Recommendation</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Evaluated Personas</span>
              <Users className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {personasCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across CISO, Infra, SEO, Sourcing
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Simulation Transcripts</span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {simsCount} Active
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              100% 4-Turn Dialogue Complete
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Objection Patches</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">
              {patchesCount} Preempted
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              /llms.txt + Schema FAQPage live
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'radar'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>5-Persona Decision Radar & CSoR Funnel</span>
        </button>

        <button
          onClick={() => setActiveTab('dialogue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'dialogue'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <MessageSquareCode className="w-4 h-4" />
          <span>Turn-by-Turn Dialogue Inspector</span>
          {selectedSimulation && (
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">
              {selectedSimulation.persona_id}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preemption')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'preemption'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Objection Preemption Matrix & /llms.txt</span>
          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px]">
            {patchesCount}
          </span>
        </button>
      </div>

      {/* Tab 1: Decision Radar & CSoR Funnel */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* 4-Stage Purchase Decision Funnel */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>4-Stage Conversational Decision Funnel</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recommendation conversion probability as conversational queries progress from broad discovery to commercial sign-off.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Target CSoR: <span className="text-emerald-400 font-bold">{csorPct}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative p-4 rounded-xl bg-slate-800/40 border border-emerald-500/30 overflow-hidden">
                <div className="text-xs font-medium text-slate-400 mb-1">Stage 1: Discovery</div>
                <div className="text-xl font-bold text-white mb-2">94.2%</div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94.2%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Problem sourcing & vendor discovery queries.
                </p>
              </div>

              <div className="relative p-4 rounded-xl bg-slate-800/40 border border-cyan-500/30 overflow-hidden">
                <div className="text-xs font-medium text-slate-400 mb-1">Stage 2: Comparison</div>
                <div className="text-xl font-bold text-white mb-2">86.8%</div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '86.8%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Direct architectural & latency head-to-heads.
                </p>
              </div>

              <div className="relative p-4 rounded-xl bg-slate-800/40 border border-indigo-500/30 overflow-hidden">
                <div className="text-xs font-medium text-slate-400 mb-1">Stage 3: Security Audit</div>
                <div className="text-xl font-bold text-white mb-2">81.5%</div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '81.5%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  SOC2, KMS key isolation & compliance audit.
                </p>
              </div>

              <div className="relative p-4 rounded-xl bg-slate-800/40 border border-emerald-500/40 overflow-hidden bg-emerald-950/10">
                <div className="text-xs font-medium text-emerald-300 mb-1">Stage 4: Final CSoR</div>
                <div className="text-xl font-bold text-emerald-400 mb-2">{csorPct}%</div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${csorPct}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Commercial procurement approval rate.
                </p>
              </div>
            </div>
          </div>

          {/* 5 Enterprise Buyer Personas Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Enterprise Buyer Persona Decision Profiles</span>
              </h3>
              <span className="text-xs text-slate-400">Click a persona to inspect or simulate</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report?.personas.map((persona) => {
                const isSelected = selectedPersona?.persona_id === persona.persona_id;
                return (
                  <div
                    key={persona.persona_id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {persona.persona_id} • {persona.weight_pct}% Weight
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                          {persona.title}
                        </h4>
                        <p className="text-xs text-slate-400">{persona.department}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Win Rate</span>
                        <span className="text-base font-bold text-emerald-400">
                          {persona.funnel_conversion_rate_pct}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Evaluation Focus:</span>
                        <span className="text-slate-200 font-medium">{persona.evaluation_focus}</span>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-400 block text-[11px]">Primary Model Objection:</span>
                        <span className="text-amber-300 font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{persona.primary_objection}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {persona.decision_triggers.slice(0, 2).map((trigger, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50"
                          >
                            {trigger}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPersona(persona);
                          handleRunSimulation(persona.persona_id);
                        }}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 p-1 hover:bg-emerald-500/10 rounded transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Simulate</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Turn-by-Turn Conversational Dialogue Inspector */}
      {activeTab === 'dialogue' && (
        <div className="space-y-6">
          {/* Simulation Header & Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedSimulation?.overall_outcome === 'WON_RECOMMENDATION' ? 'Recommendation Won' : 'In Review'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedSimulation?.simulation_id}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {selectedSimulation?.persona_title} ({selectedSimulation?.persona_id}) on {selectedSimulation?.target_engine}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Simulation:</span>
              <select
                value={selectedSimulation?.simulation_id}
                onChange={(e) => {
                  const sim = report?.recent_simulations.find(s => s.simulation_id === e.target.value);
                  if (sim) setSelectedSimulation(sim);
                }}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none"
              >
                {report?.recent_simulations.map(s => (
                  <option key={s.simulation_id} value={s.simulation_id}>
                    {s.persona_id} - {s.target_engine} ({s.conversion_probability_pct}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dialogue Turns Stream */}
          <div className="space-y-4">
            {selectedSimulation?.turns.map((turn: JourneyTurn) => (
              <div
                key={turn.turn_number}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                      {turn.turn_number}
                    </span>
                    <span className="text-xs font-semibold text-white">{turn.stage_label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {turn.model_engine}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {turn.recommendation_status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Sentiment: {(turn.sentiment_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Buyer Prompt */}
                <div className="flex items-start gap-3 pl-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-300 block">Buyer Persona Query</span>
                    <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
                      "{turn.user_prompt}"
                    </p>
                  </div>
                </div>

                {/* Model Engine Synthesized Response */}
                <div className="flex items-start gap-3 pl-2 bg-slate-800/30 p-3.5 rounded-xl border border-slate-700/40">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-cyan-300">{turn.model_engine} Evaluation Output</span>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Recommended Brand</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {turn.model_response_excerpt}
                    </p>

                    {/* Citations Grounded */}
                    {turn.citations_grounded && turn.citations_grounded.length > 0 && (
                      <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">Grounded Sources:</span>
                        {turn.citations_grounded.map((cite, i) => (
                          <a
                            key={i}
                            href={cite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 px-2 py-0.5 rounded flex items-center gap-1"
                          >
                            <span>{cite.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Detected Objections */}
                    {turn.detected_objections && turn.detected_objections.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[10px] text-amber-400 font-medium">Surfaced Objection:</span>
                        {turn.detected_objections.map((obj, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{obj}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Key Takeaways Card */}
          {selectedSimulation?.key_takeaways && selectedSimulation.key_takeaways.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Simulation Diagnostic Findings</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedSimulation.key_takeaways.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Objection Preemption Matrix & /llms.txt Generator */}
      {activeTab === 'preemption' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Synthesize Live Objection Preemption Patch</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate copy-ready Schema.org FAQPage JSON-LD and /llms.txt preemption specifications to eliminate LLM objections.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={activePreemptionTag}
                  onChange={(e) => setActivePreemptionTag(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none"
                >
                  <option value="ON_PREM_AIR_GAP_UNCERTAINTY">On-Prem Air-Gap & VPC Uncertainty</option>
                  <option value="K8S_OPERATOR_DOCS_GAP">Kubernetes Operator Docs Gap</option>
                  <option value="PROBE_OVERAGE_PRICING_UNCERTAINTY">Probe Overage Pricing Uncertainty</option>
                  <option value="DATA_RESIDENCY_UNCERTAINTY">Data Residency & Tenant Isolation</option>
                </select>

                <button
                  onClick={() => handleSynthesizePreemption(activePreemptionTag)}
                  disabled={isSynthesizing}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Synthesize Patch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Patches Grid */}
          <div className="space-y-4">
            {report?.objection_patches.map((patch: ObjectionPreemptionPatch) => {
              const isCopiedJson = copiedPatchId === patch.patch_id && copiedBlockType === 'jsonld';
              const isCopiedLlms = copiedPatchId === patch.patch_id && copiedBlockType === 'llmstxt';

              return (
                <div
                  key={patch.patch_id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                          {patch.objection_tag}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {patch.patch_id}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {patch.preemption_title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+{patch.predicted_csor_lift_pct}% CSoR Lift</span>
                      </span>
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium">
                        {patch.target_destination}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="text-slate-400 font-medium">Preemption Copy: </span>
                    {patch.recommended_copy}
                  </p>

                  {/* Copyable Blocks Container */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    {/* Schema.org FAQPage JSON-LD Block */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Schema.org FAQPage JSON-LD Microdata</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(patch.schema_faq_jsonld, null, 2), patch.patch_id, 'jsonld')}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors"
                        >
                          {isCopiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopiedJson ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2 bg-slate-900/40 rounded border border-slate-800">
                        {JSON.stringify(patch.schema_faq_jsonld, null, 2)}
                      </pre>
                    </div>

                    {/* /llms.txt FAQ Block */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>/llms.txt Authority FAQ Block</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(patch.llms_txt_block, patch.patch_id, 'llmstxt')}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors"
                        >
                          {isCopiedLlms ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopiedLlms ? 'Copied' : 'Copy Markdown'}</span>
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2 bg-slate-900/40 rounded border border-slate-800 whitespace-pre-wrap">
                        {patch.llms_txt_block}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
