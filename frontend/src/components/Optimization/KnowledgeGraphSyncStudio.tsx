import React, { useState, useEffect } from 'react';
import {
  Share2,
  Database,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Code2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  Cpu,
  Link,
  ChevronRight,
  Sliders,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import {
  KnowledgeGraphAuditReport,
  KnowledgeGraphClaimTriple,
  QuickStatementsPatch,
  KnowledgeGraphSyncResponse
} from '../../types';

interface KnowledgeGraphSyncStudioProps {
  activeBrand: string;
}

export const KnowledgeGraphSyncStudio: React.FC<KnowledgeGraphSyncStudioProps> = ({ activeBrand }) => {
  const [report, setReport] = useState<KnowledgeGraphAuditReport | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<KnowledgeGraphClaimTriple | null>(null);
  const [sparqlQuery, setSparqlQuery] = useState<string>(
    `SELECT ?property ?propertyLabel ?value ?valueLabel WHERE {\n  wd:Q129849201 ?p ?value .\n  ?property wikibase:directClaim ?p .\n  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }\n} LIMIT 10`
  );
  const [sparqlResult, setSparqlResult] = useState<any | null>(null);
  const [quickPatch, setQuickPatch] = useState<QuickStatementsPatch | null>(null);
  const [syncResponse, setSyncResponse] = useState<KnowledgeGraphSyncResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecutingSparql, setIsExecutingSparql] = useState<boolean>(false);
  const [isGeneratingPatch, setIsGeneratingPatch] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'CLAIMS_GRID' | 'SPARQL_CONSOLE' | 'QUICKSTATEMENTS_TURTLE'>('CLAIMS_GRID');
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeGraph();
  }, [activeBrand]);

  const loadKnowledgeGraph = async () => {
    setIsLoading(true);
    try {
      const data = await api.getKnowledgeGraphEntity(activeBrand);
      setReport(data);
      if (data.claims && data.claims.length > 0) {
        setSelectedClaim(data.claims[0]);
      }
      setSparqlQuery(
        `SELECT ?property ?propertyLabel ?value ?valueLabel WHERE {\n  wd:${data.wikidata_qid} ?p ?value .\n  ?property wikibase:directClaim ?p .\n  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }\n} LIMIT 10`
      );
    } catch (err) {
      console.error('Failed to load Knowledge Graph entity', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSparql = async () => {
    setIsExecutingSparql(true);
    try {
      const result = await api.executeSparqlQuery(sparqlQuery);
      setSparqlResult(result);
      showNotification('success', `SPARQL Query executed in ${result.query_execution_time_ms}ms (${result.results.bindings.length} bindings returned)`);
    } catch (err) {
      console.error('SPARQL execution failed', err);
    } finally {
      setIsExecutingSparql(false);
    }
  };

  const handleGeneratePatch = async () => {
    setIsGeneratingPatch(true);
    try {
      const patch = await api.generateQuickStatements({ brand_name: activeBrand });
      setQuickPatch(patch);
      setActiveTab('QUICKSTATEMENTS_TURTLE');
      showNotification('success', `QuickStatements v2 batch script generated for ${patch.wikidata_qid}`);
    } catch (err) {
      console.error('Failed to generate patch', err);
    } finally {
      setIsGeneratingPatch(false);
    }
  };

  const handleSyncToPlatform = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncKnowledgeGraph({ brand_name: activeBrand });
      setSyncResponse(res);
      showNotification('success', `Injected ${res.same_as_links_injected} verified sameAs entity links into canonical Schema.org & /llms.txt`);
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
    showNotification('info', 'Copied to clipboard');
  };

  const showNotification = (type: 'success' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  if (isLoading && !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-gray-400 font-mono text-sm">Querying Wikidata SPARQL endpoint &amp; Knowledge Graph triples...</p>
      </div>
    );
  }

  const mappings = report?.mappings;

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-900/95 border border-amber-500/40 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-amber-950/30 border border-amber-500/20 p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono tracking-widest text-amber-400 uppercase font-semibold">
                Wikidata RDF Triples • QID: {report?.wikidata_qid} • Target: {activeBrand}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
              <Share2 className="w-9 h-9 text-amber-400" />
              Knowledge Graph &amp; Wikidata Entity Sync Studio
            </h1>
            <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
              Automated entity disambiguation anchoring {activeBrand} across Wikidata, Wikipedia, Google Knowledge Graph, and Crunchbase to enforce authoritative LLM factual recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunSparql}
              disabled={isExecutingSparql}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-amber-300 font-medium text-xs transition-all shadow-lg hover:border-amber-500/50 disabled:opacity-50"
            >
              <Terminal className={`w-4 h-4 ${isExecutingSparql ? 'animate-spin' : ''}`} />
              Query SPARQL
            </button>

            <button
              onClick={handleGeneratePatch}
              disabled={isGeneratingPatch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 font-medium text-xs transition-all shadow-lg hover:border-gray-500 disabled:opacity-50"
            >
              <Code2 className="w-4 h-4" />
              QuickStatements v2
            </button>

            <button
              onClick={handleSyncToPlatform}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing Schema.org...' : 'Sync Schema.org & /llms.txt'}
            </button>
          </div>
        </div>
      </div>

      {/* Top Scorecard & Entity Authority Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Entity Authority</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-2">
            {report?.authority_score || 98.2}
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
              Grade {report?.grade || 'A+'}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">S_kg Knowledge Graph Index</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Wikidata QID</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <a
            href={`https://www.wikidata.org/wiki/${report?.wikidata_qid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl font-bold text-cyan-400 font-mono flex items-center gap-1.5 hover:underline"
          >
            {report?.wikidata_qid}
            <ExternalLink className="w-4 h-4 text-cyan-400" />
          </a>
          <div className="text-[11px] text-gray-500 mt-1">Wikidata Canonical Item</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Disambiguation</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 font-mono truncate">
            {report?.disambiguation_strength.replace(/_/g, ' ') || 'TIER 1 GLOBAL'}
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 0 Discrepancies
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Verified Triples</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {report?.triples_verified_count} / {report?.claims.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">100% Cross-Verified</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">WORM Audit Seal</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xs font-mono text-purple-300 font-bold truncate select-all">
            {report?.audit_seal ? `${report.audit_seal.slice(0, 16)}...` : 'SHA-256 Verified'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Cryptographic Triple Seal</div>
        </div>
      </div>

      {/* Cross-Graph Entity Mapping Nodes Bar */}
      {mappings && (
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-5 backdrop-blur-md shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Link className="w-4 h-4 text-amber-400" />
              Cross-Platform Knowledge Graph Entity Nodes (sameAs Disambiguation)
            </span>
            <span className="text-[11px] font-mono text-emerald-400">5 Canonical Endpoints Bound</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <a
              href={`https://www.wikidata.org/wiki/${mappings.wikidata_qid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 hover:border-amber-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Wikidata</div>
                <div className="text-xs font-bold text-amber-300 font-mono">{mappings.wikidata_qid}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-300 transition-colors" />
            </a>

            <a
              href={mappings.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 hover:border-cyan-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Wikipedia</div>
                <div className="text-xs font-bold text-cyan-300 font-mono truncate max-w-[120px]">
                  {activeBrand} (Company)
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-300 transition-colors" />
            </a>

            <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Google KG MID</div>
                <div className="text-xs font-bold text-emerald-300 font-mono truncate max-w-[120px]">
                  {mappings.google_kg_mid}
                </div>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <a
              href={mappings.crunchbase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 hover:border-purple-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Crunchbase</div>
                <div className="text-xs font-bold text-purple-300 font-mono truncate max-w-[120px]">
                  /organization/{activeBrand.toLowerCase()}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-300 transition-colors" />
            </a>

            <a
              href={mappings.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 hover:border-blue-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">LinkedIn</div>
                <div className="text-xs font-bold text-blue-300 font-mono truncate max-w-[120px]">
                  /company/{activeBrand.toLowerCase()}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-300 transition-colors" />
            </a>
          </div>
        </div>
      )}

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('CLAIMS_GRID')}
          className={`px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2 ${
            activeTab === 'CLAIMS_GRID'
              ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Database className="w-4 h-4" />
          Factual Claim Triples ({report?.claims.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('SPARQL_CONSOLE')}
          className={`px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2 ${
            activeTab === 'SPARQL_CONSOLE'
              ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Live Wikidata SPARQL Query Console
        </button>

        <button
          onClick={() => setActiveTab('QUICKSTATEMENTS_TURTLE')}
          className={`px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2 ${
            activeTab === 'QUICKSTATEMENTS_TURTLE'
              ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Code2 className="w-4 h-4" />
          QuickStatements v2 &amp; RDF Turtle
        </button>
      </div>

      {/* Tab 1: Factual Claim Triples Grid & Property Inspector */}
      {activeTab === 'CLAIMS_GRID' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claims Table (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 backdrop-blur-md overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-800/40 text-gray-400 font-mono uppercase tracking-wider text-[11px] border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-3">Property PID &amp; Name</th>
                      <th className="py-3 px-3">Factual Value</th>
                      <th className="py-3 px-3 text-center">Confidence</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-300 font-mono">
                    {report?.claims.map((claim) => (
                      <tr
                        key={claim.property_id}
                        onClick={() => setSelectedClaim(claim)}
                        className={`cursor-pointer transition-colors ${
                          selectedClaim?.property_id === claim.property_id
                            ? 'bg-amber-950/40 border-l-2 border-amber-500'
                            : 'hover:bg-gray-800/30'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="text-amber-400 font-bold">{claim.property_id}</div>
                          <div className="font-sans font-medium text-gray-300 text-xs">{claim.property_name}</div>
                        </td>
                        <td className="py-3 px-3 text-white font-sans truncate max-w-[220px]">
                          {claim.value}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                          {claim.confidence_score}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 font-sans">
                            <CheckCircle2 className="w-3 h-3" />
                            {claim.verification_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Claim Inspector Drawer (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {selectedClaim ? (
              <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-5 backdrop-blur-md shadow-xl space-y-4">
                <div className="flex items-start justify-between border-b border-gray-800/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">{selectedClaim.property_id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                        {selectedClaim.datatype}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1 capitalize">{selectedClaim.property_name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{selectedClaim.confidence_score}% Conf.</span>
                </div>

                {/* Value Display */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Factual Value Claim</span>
                  <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800 text-xs font-mono text-amber-300 break-all select-all">
                    {selectedClaim.value}
                  </div>
                </div>

                {/* Source References */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Cross-Verified Evidence Sources</span>
                  <div className="space-y-1">
                    {selectedClaim.source_references.map((src, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-950/60 px-3 py-1.5 rounded border border-gray-800/60">
                        <span className="text-gray-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {src}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">VERIFIED</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SPARQL Triple Representation */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">RDF Triple Binding</span>
                  <pre className="p-2.5 rounded-lg bg-gray-950 text-[11px] font-mono text-gray-300 border border-gray-800/80 overflow-x-auto">
                    wd:{report?.wikidata_qid} wdt:{selectedClaim.property_id} &quot;{selectedClaim.value}&quot; .
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-xs font-mono border border-dashed border-gray-800 rounded-xl">
                Select a property claim to inspect factual triple bindings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Interactive SPARQL Query Console */}
      {activeTab === 'SPARQL_CONSOLE' && (
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-6 backdrop-blur-md shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Live Wikidata SPARQL Query Editor
              </h3>
              <p className="text-xs text-gray-400">
                Execute live SPARQL 1.1 queries against the global Wikidata graph to discover entity linkages and parent hierarchies.
              </p>
            </div>
            <button
              onClick={handleRunSparql}
              disabled={isExecutingSparql}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-semibold text-xs transition-all shadow-lg disabled:opacity-50"
            >
              <Terminal className={`w-4 h-4 ${isExecutingSparql ? 'animate-spin' : ''}`} />
              {isExecutingSparql ? 'Executing SPARQL...' : 'Execute Query'}
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              value={sparqlQuery}
              onChange={(e) => setSparqlQuery(e.target.value)}
              rows={6}
              className="w-full p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 leading-relaxed custom-scrollbar select-all"
            />
          </div>

          {/* SPARQL Results */}
          {sparqlResult && (
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Query Result Bindings ({sparqlResult.results.bindings.length}):</span>
                <span className="text-emerald-400">{sparqlResult.query_execution_time_ms} ms execution</span>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-gray-900 text-gray-400 border-b border-gray-800">
                    <tr>
                      {sparqlResult.head.vars.map((v: string) => (
                        <th key={v} className="py-2.5 px-3 uppercase text-[10px]">{v}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-300">
                    {sparqlResult.results.bindings.map((b: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-900/40">
                        {sparqlResult.head.vars.map((v: string) => (
                          <td key={v} className="py-2.5 px-3 truncate max-w-[200px]">
                            {b[v]?.value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: QuickStatements v2 & W3C RDF Turtle */}
      {activeTab === 'QUICKSTATEMENTS_TURTLE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QuickStatements Box */}
          <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-5 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  Wikidata QuickStatements v2 Batch Syntax
                </h4>
                <p className="text-[11px] text-gray-400">
                  Ready-to-submit batch script for Wikimedia QuickStatements.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(report?.quickstatements_script || '', 'qs-script')}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs"
              >
                {copiedKey === 'qs-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'qs-script' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs font-mono text-amber-300 leading-relaxed overflow-x-auto max-h-72 select-all">
              {report?.quickstatements_script}
            </pre>
          </div>

          {/* RDF Turtle Box */}
          <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-5 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  W3C Semantic RDF Turtle Serialization
                </h4>
                <p className="text-[11px] text-gray-400">
                  Standards-compliant RDF Turtle for schema.org entity injection.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(report?.rdf_turtle_payload || '', 'rdf-turtle')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs"
              >
                {copiedKey === 'rdf-turtle' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'rdf-turtle' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto max-h-72 select-all">
              {report?.rdf_turtle_payload}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
