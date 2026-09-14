import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldAlert,
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
  Layers,
  HelpCircle,
  Sparkles,
  Bot
} from 'lucide-react';
import { api } from '../../services/api';
import {
  DisputeTribunalReport,
  DisputeCase,
  TruthReconciliationManifest,
  ModelClaimVote,
  FactualEvidenceAnchor
} from '../../types';

interface MultiModelDisputeTribunalStudioProps {
  activeBrand: string;
}

export const MultiModelDisputeTribunalStudio: React.FC<MultiModelDisputeTribunalStudioProps> = ({
  activeBrand
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'debate' | 'docket' | 'manifest'>('debate');
  const [report, setReport] = useState<DisputeTribunalReport | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('DISP-PSYCHS-001');
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [manifest, setManifest] = useState<TruthReconciliationManifest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdjudicating, setIsAdjudicating] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'ELEVATED' | 'MODERATE'>('ALL');
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rep = await api.getTribunalReport(activeBrand);
      setReport(rep);
      if (rep.dispute_cases && rep.dispute_cases.length > 0) {
        const firstCase = rep.dispute_cases[0];
        setSelectedCaseId(firstCase.dispute_id);
        setSelectedCase(firstCase);
        if (firstCase.adjudicated_manifest) {
          setManifest(firstCase.adjudicated_manifest);
        } else {
          setManifest(null);
        }
      }
    } catch (err) {
      console.error('Failed to load tribunal report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBrand]);

  const handleSelectCase = (c: DisputeCase) => {
    setSelectedCaseId(c.dispute_id);
    setSelectedCase(c);
    setManifest(c.adjudicated_manifest || null);
    setDispatchSuccess(false);
  };

  const handleAdjudicateCase = async (disputeId: string) => {
    setIsAdjudicating(true);
    try {
      const newManifest = await api.reconcileDisputeCase({
        brand_name: activeBrand,
        dispute_id: disputeId
      });
      setManifest(newManifest);
      if (selectedCase) {
        setSelectedCase({
          ...selectedCase,
          status: 'ADJUDICATED',
          adjudicated_manifest: newManifest
        });
      }
    } catch (err) {
      console.error('Adjudication failed:', err);
    } finally {
      setIsAdjudicating(false);
    }
  };

  const handleDispatchErrata = async (disputeId: string) => {
    setIsDispatching(true);
    try {
      await api.dispatchTribunalErrata({
        brand_name: activeBrand,
        dispute_id: disputeId
      });
      setDispatchSuccess(true);
      setTimeout(() => setDispatchSuccess(false), 5000);
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const copyCode = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const filteredCases = report?.dispute_cases.filter(c => {
    if (severityFilter === 'ALL') return true;
    return c.severity === severityFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Cockpit Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Autonomous Multi-Model Consensus &amp; Hallucination Dispute Tribunal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Target: {activeBrand}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Fleiss&apos; &kappa; Referee
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pits 5 frontier LLMs against each other in cross-engine consensus debates to adjudicate factual brand hallucinations, reconcile ground truth, and mint Schema.org <span className="text-indigo-400 font-mono">ClaimReview</span> errata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg shadow-lg border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Docket
            </button>
          </div>
        </div>

        {/* 4 Scorecard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Resolution Rate</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {report?.overall_resolution_rate_pct || 91.7}%{' '}
              <span className="text-xs font-normal text-slate-500">adjudicated</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across {report?.total_disputes_tracked || 3} tracked contested claims
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Avg Dispute Index (S_dispute)</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {report?.average_semantic_dispute_index || 0.342}{' '}
              <span className="text-xs font-normal text-slate-500">[0=Consensus, 1=Split]</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Moderate multi-model divergence
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Critical Contradictions</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400 mt-1">
              {report?.active_critical_cases || 1}{' '}
              <span className="text-xs font-normal text-slate-500">active case</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Requires primary anchor ground truth
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Truth Seals Minted</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-indigo-400 mt-1">
              {report?.truth_seals_minted || 18}{' '}
              <span className="text-xs font-normal text-slate-500">HMAC seals</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Live route: {report?.edge_corrections_route || '/corrections.jsonld'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 bg-[#070a11] px-4 rounded-t-xl gap-2 overflow-x-auto">
        {[
          { id: 'debate', label: 'Live Tribunal Court & Consensus Debate', icon: Scale, badge: '5-Engine Matrix' },
          { id: 'docket', label: 'Hallucination Dispute Case Docket', icon: Layers, count: report?.dispute_cases.length },
          { id: 'manifest', label: 'Truth Reconciliation Manifest & Errata', icon: FileCode, badge: 'Schema ClaimReview' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
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
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: LIVE TRIBUNAL COURT & CONSENSUS DEBATE */}
      {activeSubTab === 'debate' && selectedCase && (
        <div className="space-y-6">
          {/* Active Case Selector Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Active Contested Query:</span>
              <div className="flex flex-wrap gap-2">
                {report?.dispute_cases.map(c => (
                  <button
                    key={c.dispute_id}
                    onClick={() => handleSelectCase(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                      selectedCaseId === c.dispute_id
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-mono text-[10px]">{c.dispute_id}</span>
                    <span className={`w-2 h-2 rounded-full ${c.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAdjudicateCase(selectedCase.dispute_id)}
                disabled={isAdjudicating}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAdjudicating ? 'animate-spin' : ''}`} />
                {isAdjudicating ? 'Triangulating Evidence...' : 'Convene Fact Referee & Reconcile'}
              </button>
            </div>
          </div>

          {/* Case Detail Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">{selectedCase.dispute_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedCase.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {selectedCase.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Status: {selectedCase.status}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-2">&ldquo;{selectedCase.contested_query}&rdquo;</h2>
                <p className="text-xs text-slate-400 mt-1">Dimension: <strong className="text-slate-300">{selectedCase.contested_dimension}</strong> &bull; S_dispute: <strong className="text-amber-400">{selectedCase.semantic_dispute_index}</strong> &bull; Fleiss&apos; &kappa;: <strong className="text-indigo-400">{selectedCase.fleiss_kappa_agreement}</strong></p>
              </div>

              {manifest && (
                <button
                  onClick={() => setActiveSubTab('manifest')}
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <FileCode className="w-3.5 h-3.5" /> View Truth Manifest
                </button>
              )}
            </div>

            {/* 5-Model Courtroom Stance Grid */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                Frontier LLM Stance &amp; Quote Testimony
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCase.model_votes.map((vote, vIdx) => {
                  const isAffirmative = vote.stance === 'AFFIRMATIVE';
                  const isNegative = vote.stance === 'NEGATIVE';
                  const isContradictory = vote.stance === 'CONTRADICTORY';

                  return (
                    <div
                      key={vIdx}
                      className={`border rounded-xl p-4 space-y-3 relative overflow-hidden ${
                        isAffirmative
                          ? 'bg-slate-950/80 border-emerald-500/30 shadow-sm'
                          : isNegative
                          ? 'bg-rose-950/10 border-rose-500/40 shadow-sm'
                          : 'bg-amber-950/10 border-amber-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-white">{vote.model_name}</div>
                          <div className="text-[10px] text-slate-400">{vote.engine_provider}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isAffirmative
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isNegative
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {vote.stance}
                        </span>
                      </div>

                      {/* Verbatim Quote Box */}
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 italic">
                        &ldquo;{vote.verbatim_quote}&rdquo;
                      </div>

                      {/* Reasoning Chain & Confidence */}
                      <div className="space-y-1 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-mono text-slate-200">{Math.round(vote.confidence_score * 100)}%</span>
                        </div>
                        <div className="text-slate-500 text-[10px] leading-tight">
                          <strong className="text-slate-400">Diagnosis:</strong> {vote.reasoning_chain}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Ground Truth Evidence Anchors */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Primary Evidence Anchors (Ground Truth)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCase.evidence_anchors.map(anchor => (
                  <div key={anchor.anchor_id} className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white">{anchor.source_title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {anchor.authority_tier}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium">
                      &ldquo;{anchor.verified_fact_statement}&rdquo;
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                      <a href={anchor.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {anchor.source_url}
                      </a>
                      <span>SHA: {anchor.evidence_sha256.substring(0, 10)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HALLUCINATION DISPUTE CASE DOCKET */}
      {activeSubTab === 'docket' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Hallucination Dispute Case Docket</h2>
              <p className="text-xs text-slate-400">
                Catalog of detected contradictions across frontier search engines and their adjudication status.
              </p>
            </div>

            {/* Severity Filter */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['ALL', 'CRITICAL', 'ELEVATED', 'MODERATE'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                    severityFilter === sev ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-medium">Case ID</th>
                  <th className="p-3.5 font-medium">Contested Buyer Assertion</th>
                  <th className="p-3.5 font-medium">Dimension</th>
                  <th className="p-3.5 font-medium">Severity</th>
                  <th className="p-3.5 font-medium">Dispute (S_dispute)</th>
                  <th className="p-3.5 font-medium">Status</th>
                  <th className="p-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCases.map(c => (
                  <tr key={c.dispute_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-indigo-400 font-semibold">
                      {c.dispute_id}
                    </td>
                    <td className="p-3.5 text-white font-medium max-w-md">
                      {c.contested_query}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {c.contested_dimension}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-amber-400">
                      {c.semantic_dispute_index}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          handleSelectCase(c);
                          setActiveSubTab('debate');
                        }}
                        className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded text-xs transition-all"
                      >
                        Inspect Debate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TRUTH RECONCILIATION MANIFEST & ERRATA DISPATCHER */}
      {activeSubTab === 'manifest' && selectedCase && manifest && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Truth Reconciliation Manifest</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Confidence: 98.5%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Cryptographically sealed adjudication manifest and Schema.org <span className="font-mono text-indigo-400">ClaimReview</span> microdata.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDispatchErrata(selectedCase.dispute_id)}
                  disabled={isDispatching}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg transition-all"
                >
                  <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
                  {isDispatching ? 'Dispatching Errata...' : 'Dispatch Errata to Model Providers'}
                </button>
              </div>
            </div>

            {dispatchSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>[DISPATCH SUCCESS]: Errata notification broadcast to OpenAI SearchGPT, Google AI Overviews, Anthropic, and Perplexity Pro RAG grounding endpoints.</span>
              </div>
            )}

            {/* Adjudicated Verdict Box */}
            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Official Adjudicated Verdict
              </div>
              <p className="text-sm font-semibold text-white">
                {manifest.adjudicated_verdict}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Refuted Culprits: <strong className="text-rose-400">{manifest.culprit_models.join(', ')}</strong></span>
                <span>Classification: <strong className="text-amber-400 font-mono">{manifest.hallucination_classification}</strong></span>
                <span>HMAC Seal: <strong className="text-slate-300 font-mono">{manifest.cryptographic_seal_hmac.substring(0, 16)}...</strong></span>
              </div>
            </div>

            {/* Schema.org ClaimReview Code View */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Schema.org / ClaimReview Microdata (Edge /corrections.jsonld)</span>
                <button
                  onClick={() => copyCode(JSON.stringify(manifest.schema_claim_review_jsonld, null, 2), 'schema')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-all"
                >
                  {copiedType === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'schema' ? 'Copied ClaimReview!' : 'Copy ClaimReview JSON-LD'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400 overflow-x-auto max-h-80">
                {JSON.stringify(manifest.schema_claim_review_jsonld, null, 2)}
              </pre>
            </div>

            {/* Provider Errata Feedback Payload */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Model Provider Errata Feedback Payload (RAG Ingestion Cache)</span>
                <button
                  onClick={() => copyCode(JSON.stringify(manifest.provider_errata_payload, null, 2), 'errata')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-all"
                >
                  {copiedType === 'errata' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'errata' ? 'Copied Payload!' : 'Copy Errata Payload'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-80">
                {JSON.stringify(manifest.provider_errata_payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
