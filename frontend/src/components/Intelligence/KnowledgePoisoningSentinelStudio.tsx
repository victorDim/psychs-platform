import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Database,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  Terminal,
  Radio,
  Layers,
  Globe,
  RefreshCw,
  Zap,
  AlertTriangle,
  Lock,
  Send
} from 'lucide-react';
import { api } from '../../services/api';
import {
  KnowledgePoisoningReport,
  PoisoningAttackVector,
  AuthoritativeSparqlAssertion,
  DefensiveCounterPatch
} from '../../types';

interface KnowledgePoisoningSentinelStudioProps {
  activeBrand: string;
}

export const KnowledgePoisoningSentinelStudio: React.FC<KnowledgePoisoningSentinelStudioProps> = ({ activeBrand }) => {
  const [report, setReport] = useState<KnowledgePoisoningReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedThreatId, setSelectedThreatId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'radar' | 'inspect' | 'assertions' | 'patches'>('radar');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'ELEVATED' | 'MODERATE'>('ALL');
  const [scanning, setScanning] = useState<boolean>(false);
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);

  useEffect(() => {
    loadReport();
  }, [activeBrand]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getPoisoningSentinelReport(activeBrand);
      setReport(data);
      if (data.threat_vectors.length > 0 && !selectedThreatId) {
        setSelectedThreatId(data.threat_vectors[0].threat_id);
      }
    } catch (err) {
      console.error('Failed to load Knowledge Poisoning Sentinel report:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedThreat = report?.threat_vectors.find(t => t.threat_id === selectedThreatId) || report?.threat_vectors[0];
  const activePatch = report?.active_patches.find(p => p.threat_id === selectedThreat?.threat_id) || report?.active_patches[0];

  const handleScan = async () => {
    setScanning(true);
    try {
      await api.scanPoisoningThreats(activeBrand);
      await loadReport();
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleSynthesizePatch = async (threatId: string) => {
    setSynthesizing(true);
    try {
      const patch = await api.synthesizePoisoningCounterPatch({
        brand_name: activeBrand,
        threat_id: threatId
      });
      if (report) {
        setReport({
          ...report,
          threat_vectors: report.threat_vectors.map(t =>
            t.threat_id === threatId ? { ...t, neutralization_status: 'COUNTER_PATCH_SYNTHESIZED' } : t
          ),
          active_patches: [patch, ...report.active_patches.filter(p => p.patch_id !== patch.patch_id)]
        });
        setActiveTab('patches');
      }
    } catch (err) {
      console.error('Patch synthesis failed:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleDispatchNeutralization = async (patchId: string) => {
    setDispatching(true);
    try {
      await api.dispatchPoisoningNeutralization({
        brand_name: activeBrand,
        patch_id: patchId
      });
      if (report && activePatch) {
        setReport({
          ...report,
          threat_vectors: report.threat_vectors.map(t =>
            t.threat_id === activePatch.threat_id ? { ...t, neutralization_status: 'NEUTRALIZED' } : t
          )
        });
      }
    } catch (err) {
      console.error('Neutralization dispatch failed:', err);
    } finally {
      setDispatching(false);
    }
  };

  const copyToClipboard = (text: string, isScript: boolean) => {
    navigator.clipboard.writeText(text);
    if (isScript) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  const filteredThreats = report?.threat_vectors.filter(t => {
    if (severityFilter === 'ALL') return true;
    return t.severity === severityFilter;
  }) || [];

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Scanning Third-Party Knowledge Graphs & Wikidata Revisions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Cockpit Top Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5" />
                Negative SEO & Knowledge Graph Defense Sentinel
              </span>
              <span className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono rounded-md">
                Brand: {activeBrand}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mt-2 tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Knowledge Graph Poisoning & Negative SEO Sentinel
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Monitors Wikidata revisions, DBpedia entries, Wikipedia edits, and Reddit Sybil campaigns for malicious entity poisoning. Automatically synthesizes authoritative QuickStatements v2 patches and Schema.org ClaimReview disclaimers.
            </p>
          </div>

          {/* Real-Time Scan Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning Knowledge Graphs...' : 'Run Real-Time Threat Scan'}
            </button>
          </div>
        </div>

        {/* Top Scorecard Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/60">
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Graph Integrity Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-300">
              {report.graph_integrity_score_pct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Authoritative Fact Health
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Critical Poisoning Vectors</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-rose-300">
              {report.active_critical_poisonings} Active
            </div>
            <div className="text-[11px] text-rose-400 mt-1 font-medium">
              Requires Defensive Reversion
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Auto-Neutralization Rate</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-cyan-300">
              {report.automated_neutralization_rate_pct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Patches Dispatched to RAG
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Authoritative Grounding Triples</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-indigo-300">
              {report.authoritative_assertions.length} Triples
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Grounded in SEC &amp; SOC2 Logs
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('radar')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'radar'
              ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Live Radar &amp; Threat Docket
        </button>
        <button
          onClick={() => setActiveTab('inspect')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'inspect'
              ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Threat Deep Inspection
        </button>
        <button
          onClick={() => setActiveTab('assertions')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'assertions'
              ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-400" />
          Authoritative SPARQL Vault
        </button>
        <button
          onClick={() => setActiveTab('patches')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'patches'
              ? 'bg-slate-800 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4 text-emerald-400" />
          Counter-Patch Generator &amp; Dispatcher
        </button>
      </div>

      {/* SUB-TAB 1: Live Radar & Threat Docket */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          {/* Severity Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter Severity:</span>
              {(['ALL', 'CRITICAL', 'ELEVATED', 'MODERATE'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">{filteredThreats.length} Threats Cataloged</span>
          </div>

          {/* Threat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThreats.map(threat => (
              <div
                key={threat.threat_id}
                onClick={() => {
                  setSelectedThreatId(threat.threat_id);
                  setActiveTab('inspect');
                }}
                className={`bg-slate-900/60 border rounded-xl p-5 backdrop-blur-md space-y-4 hover:border-slate-700 transition-all cursor-pointer relative overflow-hidden ${
                  threat.severity === 'CRITICAL'
                    ? 'border-rose-500/40 hover:border-rose-500/60'
                    : threat.severity === 'ELEVATED'
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      threat.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : threat.severity === 'ELEVATED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {threat.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{threat.threat_id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    threat.neutralization_status === 'NEUTRALIZED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : threat.neutralization_status === 'COUNTER_PATCH_SYNTHESIZED'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {threat.neutralization_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-mono">Source: {threat.target_source}</span>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    Contested: {threat.contested_property}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs text-rose-300/90 font-mono leading-relaxed line-clamp-3">
                  &ldquo;{threat.malicious_assertion}&rdquo;
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px] truncate max-w-[180px]">{threat.culprit_attribution}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSynthesizePatch(threat.threat_id);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    Counter-Patch <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Threat Deep Inspection */}
      {activeTab === 'inspect' && selectedThreat && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  selectedThreat.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {selectedThreat.severity} THREAT
                </span>
                <span className="font-mono text-slate-300 text-sm">{selectedThreat.threat_id}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-1">
                Contested Property: {selectedThreat.contested_property}
              </h3>
            </div>

            <button
              onClick={() => handleSynthesizePatch(selectedThreat.threat_id)}
              disabled={synthesizing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              {synthesizing ? 'Synthesizing Patch...' : 'Synthesize QuickStatements Counter-Patch'}
            </button>
          </div>

          {/* Side by Side Disinformation vs Authoritative Truth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contaminated Malicious Statement */}
            <div className="bg-slate-950/60 border border-rose-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20 text-xs font-semibold text-rose-400">
                <span className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  Contaminated Malicious Assertion (Detected in Wild)
                </span>
                <span className="font-mono text-[10px]">{selectedThreat.target_source}</span>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed font-mono bg-rose-950/20 p-3 rounded-lg border border-rose-900/40">
                &ldquo;{selectedThreat.malicious_assertion}&rdquo;
              </p>
              <div className="text-[11px] text-slate-400">
                <span className="font-medium text-slate-300">Culprit Attribution:</span> {selectedThreat.culprit_attribution}
              </div>
            </div>

            {/* Authoritative Verified Fact */}
            <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Authoritative Ground Truth Fact (Immutable Proof)
                </span>
                <span className="font-mono text-[10px]">VERIFIED_CORP_REGISTRY</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed font-mono bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40">
                &ldquo;{selectedThreat.authoritative_fact}&rdquo;
              </p>
              <div className="text-[11px] text-slate-400">
                <span className="font-medium text-slate-300">Grounding Source:</span> Delaware C-Corp Registry, DNSSEC Certificates &amp; KDD-2024 Whitepaper
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Authoritative SPARQL Assertion Vault */}
      {activeTab === 'assertions' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Authoritative SPARQL Entity Assertion Vault
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Verified ground-truth RDF triples used to refute disinformation across Wikidata, Google Knowledge Graph, and LLM RAG caches.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Assertion ID</th>
                  <th className="p-3">Subject QID</th>
                  <th className="p-3">Predicate URI</th>
                  <th className="p-3">Authoritative Object Value</th>
                  <th className="p-3">Proof Authority Source</th>
                  <th className="p-3">Evidence Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {report.authoritative_assertions.map(assertion => (
                  <tr key={assertion.assertion_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{assertion.assertion_id}</td>
                    <td className="p-3 font-mono text-slate-300">{assertion.subject_qid}</td>
                    <td className="p-3 font-mono text-indigo-300">{assertion.predicate_uri}</td>
                    <td className="p-3 font-medium text-slate-200">{assertion.object_value}</td>
                    <td className="p-3 text-slate-400">{assertion.proof_source}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={assertion.evidence_sha256}>
                      {assertion.evidence_sha256.slice(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Counter-Patch Generator & Dispatcher */}
      {activeTab === 'patches' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                Defensive Counter-Patch Generator &amp; RAG Neutralization Dispatcher
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Generates Wikidata QuickStatements v2 scripts, Schema.org ClaimReview JSON-LD, and broadcasts errata to frontier AI search crawlers.
              </p>
            </div>

            {activePatch && (
              <button
                onClick={() => handleDispatchNeutralization(activePatch.patch_id)}
                disabled={dispatching}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${dispatching ? 'animate-spin' : ''}`} />
                {dispatching ? 'Broadcasting to RAG Crawlers...' : 'Broadcast Neutralization to RAG Crawlers & Edge'}
              </button>
            )}
          </div>

          {activePatch ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QuickStatements v2 Script Viewer */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    quickstatements_v2_patch.txt
                  </span>
                  <button
                    onClick={() => copyToClipboard(activePatch.quickstatements_v2_code, true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedScript ? 'Copied Script!' : 'Copy QuickStatements'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 rounded-lg text-emerald-300 text-xs font-mono overflow-x-auto max-h-[320px] leading-relaxed border border-slate-900">
                  {activePatch.quickstatements_v2_code}
                </pre>
              </div>

              {/* Schema.org ClaimReview JSON-LD Viewer */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                    <FileCode className="w-4 h-4" />
                    Schema.org ClaimReview (/disclaimers.jsonld)
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(activePatch.schema_claim_review_jsonld, null, 2), false)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSchema ? 'Copied JSON-LD!' : 'Copy JSON-LD'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 rounded-lg text-cyan-300 text-xs font-mono overflow-x-auto max-h-[320px] leading-relaxed border border-slate-900">
                  {JSON.stringify(activePatch.schema_claim_review_jsonld, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-200">No Active Counter-Patches Generated</h4>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Select a threat from the Live Radar docket and click &ldquo;Synthesize QuickStatements Counter-Patch&rdquo; to generate defensive scripts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
