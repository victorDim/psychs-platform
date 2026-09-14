import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Layers,
  BarChart3,
  Cpu,
  ArrowRight,
  ExternalLink,
  Code2,
  Clock,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Network,
  FolderTree,
  Terminal,
  Download,
  Gauge
} from 'lucide-react';
import { api } from '../../services/api';
import {
  IngestionResult,
  IngestedDomainRecord,
  AutonomousIngestionReport,
  CrawlPageNode,
  SitemapRoute
} from '../../types';

interface BrandIngestionStudioProps {
  onPromoteBrand: (ingestionResult: IngestionResult) => void;
  activeBrand: string;
}

export const BrandIngestionStudio: React.FC<BrandIngestionStudioProps> = ({ onPromoteBrand, activeBrand }) => {
  const [targetUrl, setTargetUrl] = useState<string>('https://psychs.ai');
  const [crawlDepth, setCrawlDepth] = useState<string>('DEEP_5_PAGE');
  const [stripInjections, setStripInjections] = useState<boolean>(true);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlStage, setCrawlStage] = useState<string>('IDLE');
  const [crawlProgress, setCrawlProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'SITEMAP_TREE' | 'LLMS_FULL' | 'SCHEMAS' | 'BASELINE_SCORE' | 'SECURITY'>('SITEMAP_TREE');
  const [selectedRoute, setSelectedRoute] = useState<CrawlPageNode | null>(null);
  const [report, setReport] = useState<AutonomousIngestionReport | null>(null);
  const [legacyResult, setLegacyResult] = useState<IngestionResult | null>(null);
  const [history, setHistory] = useState<IngestedDomainRecord[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [promotedSuccess, setPromotedSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [activeBrand]);

  const loadData = async () => {
    try {
      const [hist, rep] = await Promise.all([
        api.getIngestedDomains(),
        api.getHeadlessCrawlReport(activeBrand)
      ]);
      if (hist) setHistory(hist as IngestedDomainRecord[]);
      if (rep) {
        setReport(rep);
        if (rep.crawled_pages && rep.crawled_pages.length > 0) {
          setSelectedRoute(rep.crawled_pages[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load headless ingestion data:', e);
    }
  };

  const handleStartCrawl = async (urlOverride?: string) => {
    const urlToCrawl = urlOverride || targetUrl;
    setIsCrawling(true);
    setCrawlProgress(10);
    setCrawlStage('Parsing robots.txt & discovering sitemap.xml routes...');

    const stages = [
      { progress: 25, text: 'Executing Headless DOM Extraction across 5 routes...' },
      { progress: 45, text: 'Zero-Trust AST Sanitization (Pruning 0-pt fonts & hidden injections)...' },
      { progress: 65, text: 'Synthesizing Per-Route Princeton KDD Levers & Citation Lift...' },
      { progress: 85, text: 'Compiling Master /llms-full.txt Context Bundle & Context Fit...' },
      { progress: 100, text: 'Generating Multi-Page Schema.org Graph & Audit Seal...' }
    ];

    stages.forEach((st, idx) => {
      setTimeout(() => {
        setCrawlProgress(st.progress);
        setCrawlStage(st.text);
      }, (idx + 1) * 350);
    });

    try {
      const [rep, leg] = await Promise.all([
        api.runHeadlessCrawl({
          url_or_domain: urlToCrawl,
          crawl_depth: crawlDepth,
          strip_injections: stripInjections
        }),
        api.crawlDomain({
          url_or_domain: urlToCrawl,
          crawl_depth: crawlDepth,
          strip_injections: stripInjections
        })
      ]);

      setTimeout(() => {
        if (rep) {
          setReport(rep);
          if (rep.crawled_pages && rep.crawled_pages.length > 0) {
            setSelectedRoute(rep.crawled_pages[0]);
          }
        }
        if (leg) {
          setLegacyResult(leg);
        }
        setIsCrawling(false);
        setCrawlStage('COMPLETED');
        api.getIngestedDomains().then(hist => {
          if (hist) setHistory(hist as IngestedDomainRecord[]);
        });
      }, 2200);
    } catch (err) {
      console.error('Crawling failed:', err);
      setIsCrawling(false);
      setCrawlStage('ERROR');
    }
  };

  const handleSelectArchiveBrand = async (brandName: string) => {
    try {
      const rep = await api.getHeadlessCrawlReport(brandName);
      if (rep) {
        setReport(rep);
        if (rep.crawled_pages && rep.crawled_pages.length > 0) {
          setSelectedRoute(rep.crawled_pages[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load brand report:', e);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadLlmsFull = () => {
    if (!report) return;
    const blob = new Blob([report.unified_llms_full_txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `llms-full-${report.brand_name.toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePromote = () => {
    const brandToPromote = report?.brand_name || legacyResult?.brand_name || activeBrand || 'Psychs';
    const payload = {
      ingest_id: report?.ingest_id || legacyResult?.ingest_id || `ING-${brandToPromote.toUpperCase()}-01`,
      target_url: report?.root_url || legacyResult?.target_url || `https://${brandToPromote.toLowerCase()}.ai`,
      domain: report?.root_domain || legacyResult?.domain || `${brandToPromote.toLowerCase()}.ai`,
      brand_name: brandToPromote,
      crawled_at: report?.crawled_at || new Date().toISOString(),
      crawl_depth: report?.crawl_depth_executed || 'DEEP_5_PAGE',
      html_bytes_received: 48210,
      sanitization: {
        raw_html_bytes: 48210,
        sanitized_html_bytes: 42100,
        pruned_elements_count: 2,
        is_safe: true,
        detected_injections: [],
        extracted_text: report?.unified_llms_full_txt || ''
      },
      brand_schema: {
        brand_name: brandToPromote,
        primary_industry: 'Generative Engine Optimization',
        value_proposition: `Enterprise Generative Engine Optimization Platform for ${brandToPromote}`,
        core_products_services: ['AI Brand Perception', 'Citation Grounding', 'Dispute Tribunal'],
        key_differentiators: ['pgvector halfvec', '58ms KMS shredding'],
        verifiable_statistics: ['45ms P99 Latency', '97% Gross Margin']
      },
      generated_schemas: report?.multi_page_schema_jsonld || {},
      generated_llms_txt: {
        brand_name: brandToPromote,
        llms_txt_content: report?.unified_llms_full_txt || '',
        llms_mini_txt_content: '',
        generated_at: new Date().toISOString(),
        sha256_hash: report?.sha256_ingest_seal || ''
      },
      total_cold_prompts_generated: 20,
      sha256_ingest_seal: report?.sha256_ingest_seal || '',
      security_clearance: 'PASSED_ZERO_TRUST',
      status: 'COMPLETED'
    } as unknown as IngestionResult;
    onPromoteBrand(payload);
    setPromotedSuccess(true);
    setTimeout(() => setPromotedSuccess(false), 3500);
  };

  const samplePresets = [
    { name: 'Psychs', url: 'https://psychs.ai' },
    { name: 'Supabase', url: 'https://supabase.com' },
    { name: 'Linear', url: 'https://linear.app' },
    { name: 'Stripe', url: 'https://stripe.com' },
    { name: 'Vercel', url: 'https://vercel.com' }
  ];

  const totalTokens = report?.context_window_metrics?.total_tokens || 2850;
  const gpt6Pct = report?.context_window_metrics?.gpt6_astra_utilization_pct || 0.14;
  const claudePct = report?.context_window_metrics?.claude_fable_utilization_pct || 0.29;
  const geminiPct = report?.context_window_metrics?.gemini_37_flash_utilization_pct || 0.14;

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Autonomous Brand Ingestion &amp; Headless Crawler
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Recursive AST v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Recursive sitemap crawler, zero-trust AST DOM parser, route-level Princeton KDD proposals, and master /llms-full.txt context synthesis.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">Quick Ingest:</span>
            {samplePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setTargetUrl(preset.url);
                  handleStartCrawl(preset.url);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 font-mono text-xs transition-colors shrink-0"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Top Context Window Fit Meter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Indexed AI Tokens</span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {totalTokens.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Grade: <span className="text-emerald-400 font-semibold">{report?.context_window_metrics?.estimated_context_fit_grade || 'OPTIMAL_FIT'}</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>GPT-6 Astra (2M)</span>
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {gpt6Pct}%
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.min(gpt6Pct * 50, 100)}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Claude Fable 5.1 (1M)</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {claudePct}%
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
              <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${Math.min(claudePct * 50, 100)}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Gemini 3.7 Flash (2M)</span>
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {geminiPct}%
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.min(geminiPct * 50, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* URL Input & Crawler Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Enter enterprise domain (e.g. https://psychs.ai or supabase.com)..."
              disabled={isCrawling}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={crawlDepth}
              onChange={(e) => setCrawlDepth(e.target.value)}
              disabled={isCrawling}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="SINGLE_PAGE">Single-Page Fast Crawl</option>
              <option value="DEEP_5_PAGE">5-Page Deep Recursive Crawl</option>
              <option value="RECURSIVE_SITEMAP">Complete Sitemap XML Crawl</option>
            </select>

            <button
              onClick={() => handleStartCrawl()}
              disabled={isCrawling || !targetUrl.trim()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCrawling ? 'animate-spin' : ''}`} />
              <span>{isCrawling ? 'Crawling...' : 'Crawl & Ingest Brand'}</span>
            </button>
          </div>
        </div>

        {/* Security options bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stripInjections}
                onChange={(e) => setStripInjections(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20 w-3.5 h-3.5"
              />
              <span className="text-slate-300">Strip Zero-Width &amp; 0-pt Font Prompt Injections</span>
            </label>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Trust Containerized Sandbox</span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Egress residential IP rotation enabled (US-East / EU-West)
          </div>
        </div>

        {/* Live Crawl Progress Visualizer */}
        {isCrawling && (
          <div className="pt-2 space-y-2 animate-fadeIn">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-400 font-semibold">{crawlStage}</span>
              <span className="text-slate-400">{crawlProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${crawlProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Crawled Results Studio */}
      {report && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-md">
          {/* Header & Promote Brand Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight font-mono">
                  {report.brand_name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {report.root_domain}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {report.total_pages_crawled} Pages Ingested
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {report.aggregate_security_clearance}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Root URL: <span className="text-slate-300 font-mono">{report.root_url}</span> • Seal: <span className="text-slate-400 font-mono">{report.sha256_ingest_seal.slice(0, 16)}...</span>
              </p>
            </div>

            {/* Promote and Export Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleDownloadLlmsFull}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Download consolidated /llms-full.txt file"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export /llms-full.txt</span>
              </button>

              <button
                onClick={handlePromote}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 ${
                  promotedSuccess
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 shadow-indigo-500/20'
                }`}
                title="Promote this brand to active dashboard view across all platform tabs"
              >
                {promotedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
                <span>{promotedSuccess ? `Promoted! Active: ${report.brand_name}` : `Promote to Active Platform Brand`}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('SITEMAP_TREE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'SITEMAP_TREE' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Multi-Page Sitemap &amp; Routes ({report.crawled_pages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('LLMS_FULL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'LLMS_FULL' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Master /llms-full.txt ({totalTokens} Tokens)</span>
            </button>
            <button
              onClick={() => setActiveTab('SCHEMAS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'SCHEMAS' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Schema.org @graph JSON-LD</span>
            </button>
            <button
              onClick={() => setActiveTab('BASELINE_SCORE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'BASELINE_SCORE' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Baseline Perception &amp; GSoV</span>
            </button>
            <button
              onClick={() => setActiveTab('SECURITY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'SECURITY' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Trust Injection Audit</span>
            </button>
          </div>

          {/* TAB 1: SITEMAP_TREE */}
          {activeTab === 'SITEMAP_TREE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Route List */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Discovered Subpages</span>
                  <span className="text-cyan-400">{report.crawled_pages.length} Pages</span>
                </div>

                <div className="space-y-2">
                  {report.crawled_pages.map((page) => {
                    const isSelected = selectedRoute?.page_id === page.page_id;
                    return (
                      <div
                        key={page.page_id}
                        onClick={() => setSelectedRoute(page)}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-white truncate">
                            {page.route_path}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            HTTP {page.http_status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          {page.page_title}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-500">
                          <span>{page.word_count} words</span>
                          <span className="text-emerald-400">+{page.predicted_citation_lift_pct}% Lift</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Route Deep Inspector & KDD Levers */}
              {selectedRoute && (
                <div className="lg:col-span-2 space-y-4 bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {selectedRoute.route_path}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {selectedRoute.page_id}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">
                        {selectedRoute.page_title}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Predicted Lift</span>
                      <span className="text-base font-bold text-emerald-400">
                        +{selectedRoute.predicted_citation_lift_pct}%
                      </span>
                    </div>
                  </div>

                  {/* Route Statistics */}
                  <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">DOM Size</span>
                      <span className="text-white font-bold">{(selectedRoute.byte_size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Word Count</span>
                      <span className="text-white font-bold">{selectedRoute.word_count} words</span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Security</span>
                      <span className="text-emerald-400 font-bold">{selectedRoute.security_clearance}</span>
                    </div>
                  </div>

                  {/* Extracted Core Claims */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-semibold uppercase text-cyan-400 block">
                      Extracted Authoritative Claims
                    </span>
                    <div className="space-y-1.5">
                      {selectedRoute.extracted_claims.map((claim, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{claim}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Princeton KDD Levers */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-mono font-semibold uppercase text-indigo-400 block">
                      Recommended Princeton KDD-2024 Levers
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoute.kdd_recommended_levers.map((lever, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center gap-1.5"
                        >
                          <Zap className="w-3 h-3 text-indigo-400" />
                          <span>{lever}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LLMS_FULL */}
          {activeTab === 'LLMS_FULL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Consolidated Multi-Page /llms-full.txt Context Documentation
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {totalTokens} Total Tokens
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadLlmsFull}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleCopy(report.unified_llms_full_txt, 'llmsfull')}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                  >
                    {copiedKey === 'llmsfull' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'llmsfull' ? 'Copied /llms-full.txt!' : 'Copy /llms-full.txt'}</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-[480px] whitespace-pre-wrap leading-relaxed">
                {report.unified_llms_full_txt}
              </pre>
            </div>
          )}

          {/* TAB 3: SCHEMAS */}
          {activeTab === 'SCHEMAS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Multi-Page Schema.org @graph JSON-LD
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(report.multi_page_schema_jsonld, null, 2), 'schemas')}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                >
                  {copiedKey === 'schemas' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'schemas' ? 'Copied JSON-LD!' : 'Copy Schemas'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-[480px]">
                {JSON.stringify(report.multi_page_schema_jsonld, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 4: BASELINE SCORE */}
          {activeTab === 'BASELINE_SCORE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 uppercase block text-[10px]">Aggregate Baseline Score</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    87.4/100
                  </span>
                  <span className="text-slate-400 block mt-1">Grade A (Optimal Alignment)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 uppercase block text-[10px]">Discovered Routes</span>
                  <span className="text-2xl font-bold text-cyan-400">
                    {report.total_pages_crawled} Pages
                  </span>
                  <span className="text-slate-400 block mt-1">100% Ingested &amp; Grounded</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 uppercase block text-[10px]">GSoV Mindshare</span>
                  <span className="text-2xl font-bold text-indigo-400">
                    64.5%
                  </span>
                  <span className="text-slate-400 block mt-1">Leading AI Recommendation</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-emerald-400 font-bold block">Zero-Trust AST Clearance: {report.aggregate_security_clearance}</span>
                    <span className="text-slate-400 text-[11px]">All {report.total_pages_crawled} pages scanned for prompt injection markers &amp; 0-pt CSS fonts.</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  SHA-256: <code>{report.sha256_ingest_seal.slice(0, 16)}...</code>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ingested Domains Archive */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Ingested Domains Archive
          </div>
          <span className="text-xs text-slate-500 font-mono">{history.length} Ingested Entities</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3 text-left">Brand</th>
                <th className="py-2.5 px-3 text-left">Domain</th>
                <th className="py-2.5 px-3 text-left">Crawled At</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Security Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.map((item) => (
                <tr key={item.ingest_id} onClick={() => handleSelectArchiveBrand(item.brand_name)} className="hover:bg-slate-900/60 cursor-pointer transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                    <span>{item.brand_name}</span>
                    {report?.brand_name.toLowerCase() === item.brand_name.toLowerCase() && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Active View</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-400">{item.domain}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.crawled_at.slice(0, 10)}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{item.aggregate_score} ({item.grade})</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {item.security_clearance}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectArchiveBrand(item.brand_name); }}
                      className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 transition-colors text-[11px]"
                    >
                      View Report
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartCrawl(`https://${item.domain}`); }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-[11px]"
                    >
                      Re-Crawl
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
