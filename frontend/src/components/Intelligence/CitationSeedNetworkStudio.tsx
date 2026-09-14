import React, { useState, useEffect } from 'react';
import {
  Share2,
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
  Layers,
  Sparkles,
  Bot,
  MessageSquare,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api';
import {
  CitationSeedNetworkReport,
  AuthoritySeedDomain,
  GroundingThreadOpportunity,
  SeedingPlaybook
} from '../../types';

interface CitationSeedNetworkStudioProps {
  activeBrand: string;
}

export const CitationSeedNetworkStudio: React.FC<CitationSeedNetworkStudioProps> = ({
  activeBrand
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'radar' | 'docket' | 'playbook' | 'graph'>('radar');
  const [report, setReport] = useState<CitationSeedNetworkReport | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('OPP-PSYCHS-001');
  const [selectedPlaybook, setSelectedPlaybook] = useState<SeedingPlaybook | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPlaybook, setIsGeneratingPlaybook] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'REDDIT' | 'GITHUB' | 'ARXIV' | 'G2_REVIEW' | 'TECH_MEDIA'>('ALL');
  const [campaignSuccess, setCampaignSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rep = await api.getCitationSeedReport(activeBrand);
      setReport(rep);
      if (rep.opportunities && rep.opportunities.length > 0) {
        const firstOpp = rep.opportunities[0];
        setSelectedOpportunityId(firstOpp.opportunity_id);
        const existingPlaybook = rep.active_playbooks.find(p => p.opportunity_id === firstOpp.opportunity_id);
        if (existingPlaybook) {
          setSelectedPlaybook(existingPlaybook);
        } else {
          await handleGeneratePlaybook(firstOpp.opportunity_id);
        }
      }
    } catch (err) {
      console.error('Failed to load citation seed network data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBrand]);

  const handleGeneratePlaybook = async (oppId: string) => {
    setIsGeneratingPlaybook(true);
    try {
      const playbook = await api.generateSeedingPlaybook({
        brand_name: activeBrand,
        opportunity_id: oppId
      });
      setSelectedPlaybook(playbook);
      setSelectedOpportunityId(oppId);
    } catch (err) {
      console.error('Failed to generate playbook:', err);
    } finally {
      setIsGeneratingPlaybook(false);
    }
  };

  const handleUpdateStatus = async (oppId: string, status: string) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateSeedingCampaign({
        brand_name: activeBrand,
        opportunity_id: oppId,
        campaign_status: status
      });
      if (report) {
        const updatedOpps = report.opportunities.map(o => o.opportunity_id === oppId ? updated : o);
        setReport({
          ...report,
          opportunities: updatedOpps,
          verified_ai_citations_won: status === 'VERIFIED_CITED_BY_AI' ? report.verified_ai_citations_won + 1 : report.verified_ai_citations_won
        });
      }
      setCampaignSuccess(`Updated status to ${status}`);
      setTimeout(() => setCampaignSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyCode = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const filteredOpps = report?.opportunities.filter(o => {
    if (platformFilter === 'ALL') return true;
    return o.platform === platformFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Cockpit Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Share2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Programmatic Citation Grounding &amp; Authority Seed Network
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Target: {activeBrand}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  RAG Grounding Graph
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Reverse-engineer the top third-party citation source domains crawled by Perplexity, SearchGPT, and Claude, and deploy Princeton KDD-2024 citation seeding playbooks to capture first-page AI recommendations.
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
              Refresh Graph
            </button>
          </div>
        </div>

        {/* 4 Scorecard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Seed Domains Tracked</span>
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {report?.total_seed_domains_tracked || 5}{' '}
              <span className="text-xs font-normal text-slate-500">primary sources</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Avg Citation Authority: <strong className="text-emerald-400">{report?.average_domain_authority || 94.0}</strong>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Unclaimed Citation Gaps</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {report?.active_unclaimed_gaps || 3}{' '}
              <span className="text-xs font-normal text-slate-500">active threads</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Competitors currently cited without {activeBrand}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Potential Citation Lift</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              +{report?.potential_citation_lift_pct || 31.4}%{' '}
              <span className="text-xs font-normal text-slate-500">GSoV gain</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Via high-weight RAG anchor seeding
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Verified AI Citations Won</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {report?.verified_ai_citations_won || 14}{' '}
              <span className="text-xs font-normal text-slate-500">live mentions</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              SearchGPT &bull; Perplexity &bull; Claude
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 bg-[#070a11] px-4 rounded-t-xl gap-2 overflow-x-auto">
        {[
          { id: 'radar', label: 'High-Weight Authority Domains Radar', icon: Globe, count: report?.seed_domains.length },
          { id: 'docket', label: 'Grounding Opportunities Docket', icon: MessageSquare, count: report?.opportunities.length },
          { id: 'playbook', label: 'Seeding Campaign Studio & Playbook', icon: BookOpen, badge: 'Princeton KDD' },
          { id: 'graph', label: 'AI Grounding Ingestion Network Graph', icon: Layers, badge: 'Crawler Affinities' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
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
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: HIGH-WEIGHT AUTHORITY DOMAINS RADAR */}
      {activeSubTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">High-Weight Authority Seed Domains</h2>
              <p className="text-xs text-slate-400">
                Primary third-party sources heavily indexed by AI search RAG grounding crawlers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report?.seed_domains.map(domain => (
              <div
                key={domain.domain}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{domain.display_name}</h3>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">{domain.domain}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Authority Score (A_cite)</span>
                    <div className="text-lg font-bold text-emerald-400">{domain.citation_authority_score}</div>
                  </div>
                </div>

                {/* RAG Crawl Volume Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>RAG Indexing Frequency</span>
                    <span className="text-slate-200 font-mono">{domain.rag_indexing_frequency}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${domain.rag_indexing_frequency}%` }} />
                  </div>
                </div>

                {/* Primary Crawler Affinities */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary RAG Crawlers:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {domain.primary_crawler_affinities.map((bot, bIdx) => (
                      <span
                        key={bIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-cyan-300 flex items-center gap-1"
                      >
                        <Bot className="w-3 h-3 text-cyan-400" /> {bot}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Top Ingested Query Clusters */}
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1 text-xs">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Top Ingested Clusters:</div>
                  <div className="text-slate-300 font-medium truncate">
                    {domain.top_ingested_query_clusters.join(' \u2022 ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GROUNDING OPPORTUNITIES DOCKET */}
      {activeSubTab === 'docket' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Unclaimed Grounding Thread Opportunities</h2>
              <p className="text-xs text-slate-400">
                High-authority discussion threads and preprints where competitors are cited and {activeBrand} has an unclaimed gap.
              </p>
            </div>

            {/* Platform Filter */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto">
              {(['ALL', 'REDDIT', 'GITHUB', 'ARXIV', 'G2_REVIEW'] as const).map(plat => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat as any)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-all whitespace-nowrap ${
                    platformFilter === plat ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-medium">Platform</th>
                  <th className="p-3.5 font-medium">Discussion Title &amp; Target URL</th>
                  <th className="p-3.5 font-medium">Competitors Cited</th>
                  <th className="p-3.5 font-medium">Citation Status</th>
                  <th className="p-3.5 font-medium">GSoV Lift</th>
                  <th className="p-3.5 font-medium">Campaign Status</th>
                  <th className="p-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOpps.map(opp => (
                  <tr key={opp.opportunity_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-cyan-400 font-semibold">
                      {opp.platform}
                    </td>
                    <td className="p-3.5 max-w-md space-y-1">
                      <div className="text-white font-medium">{opp.discussion_title}</div>
                      <a href={opp.target_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 font-mono text-[10px] flex items-center gap-1 truncate">
                        <ExternalLink className="w-3 h-3 shrink-0" /> {opp.target_url}
                      </a>
                    </td>
                    <td className="p-3.5">
                      {opp.competitors_cited.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {opp.competitors_cited.map((comp, cIdx) => (
                            <span key={cIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-300">
                              {comp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        opp.brand_citation_status === 'CITED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {opp.brand_citation_status}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400 font-mono">
                      +{opp.estimated_gsov_impact_pct}%
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {opp.campaign_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          handleGeneratePlaybook(opp.opportunity_id);
                          setActiveSubTab('playbook');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded text-xs transition-all flex items-center gap-1 ml-auto"
                      >
                        <Sparkles className="w-3 h-3" /> Playbook
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SEEDING CAMPAIGN STUDIO & PLAYBOOK */}
      {activeSubTab === 'playbook' && selectedPlaybook && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Technical Seeding Playbook</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedPlaybook.playbook_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    Persona: {selectedPlaybook.recommended_contributor_persona}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesized technical contribution with Princeton KDD-2024 statistical quotation hooks.
                </p>
              </div>

              {/* Campaign State Stepper */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedPlaybook.opportunity_id, 'SEEDED_SUBMITTED')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                >
                  Mark as Seeded
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedPlaybook.opportunity_id, 'VERIFIED_CITED_BY_AI')}
                  disabled={isUpdatingStatus}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Verified in AI
                </button>
              </div>
            </div>

            {campaignSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>[CAMPAIGN UPDATE SUCCESS]: {campaignSuccess}</span>
              </div>
            )}

            {/* Target URL Reference Box */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 font-semibold">Target Thread:</span>
                <span className="font-mono text-emerald-400 truncate">{selectedPlaybook.target_url}</span>
              </div>
              <a href={selectedPlaybook.target_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 shrink-0 font-medium">
                <ExternalLink className="w-3.5 h-3.5" /> Open Thread
              </a>
            </div>

            {/* Draft Technical Response Snippet */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Draft Technical Community Contribution
                </span>
                <button
                  onClick={() => copyCode(selectedPlaybook.draft_technical_response, 'draft')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-all"
                >
                  {copiedType === 'draft' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'draft' ? 'Copied Response!' : 'Copy Draft Response'}
                </button>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 leading-relaxed font-sans">
                {selectedPlaybook.draft_technical_response}
              </div>
            </div>

            {/* Statistical Quotation Hook & KDD Anchor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Statistical Quotation Hook
                </div>
                <p className="text-xs text-slate-300 italic">
                  &ldquo;{selectedPlaybook.statistical_quotation_hook}&rdquo;
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-4 h-4" /> KDD-2024 Grounding Anchor
                </div>
                <p className="text-xs text-slate-300">
                  {selectedPlaybook.kdd_factual_anchor}
                </p>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contributor Compliance &amp; Neutrality Checklist:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-400">
                {selectedPlaybook.compliance_checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AI GROUNDING INGESTION NETWORK GRAPH */}
      {activeSubTab === 'graph' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">AI Grounding Ingestion Network Graph</h2>
              <p className="text-xs text-slate-400">
                Cross-reference of which frontier search crawlers ingest specific third-party seed domains.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { crawler: 'PerplexityBot (Sonar-Pro)', targets: ['reddit.com', 'github.com', 'arxiv.org', 'g2.com'], status: 'ACTIVE INGESTION', color: 'text-cyan-400' },
                { crawler: 'GPTBot (SearchGPT / O3)', targets: ['reddit.com', 'techcrunch.com', 'github.com', 'arxiv.org'], status: 'ACTIVE INGESTION', color: 'text-emerald-400' },
                { crawler: 'ClaudeBot (Claude Web)', targets: ['github.com', 'arxiv.org', 'stackoverflow.com'], status: 'ACTIVE INGESTION', color: 'text-indigo-400' }
              ].map(c => (
                <div key={c.crawler} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${c.color}`}>{c.crawler}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                      {c.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-[10px] text-slate-500 uppercase">Primary Ingestion Domains:</div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.targets.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
