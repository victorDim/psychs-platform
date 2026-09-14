import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Bot,
  Zap,
  Activity,
  Server,
  RefreshCw,
  Copy,
  Check,
  Download,
  Flame,
  Globe,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Sliders,
  Terminal,
  Cpu,
  Radio
} from 'lucide-react';
import {
  BotArmorTelemetryReport,
  AiBotCrawlerMetric,
  CrawlTrafficEvent,
  EdgeWafRuleSet,
  PolicySwitchResult
} from '../../types';
import { api } from '../../services/api';

interface BotTrafficArmorStudioProps {
  activeBrand: string;
}

export const BotTrafficArmorStudio: React.FC<BotTrafficArmorStudioProps> = ({ activeBrand }) => {
  const [report, setReport] = useState<BotArmorTelemetryReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [horizonHours, setHorizonHours] = useState<number>(24);
  const [selectedProvider, setSelectedProvider] = useState<'CLOUDFLARE_WAF' | 'FASTLY_VCL' | 'AWS_WAF_ACL' | 'NGINX_INGRESS'>('CLOUDFLARE_WAF');
  const [activeRuleSet, setActiveRuleSet] = useState<EdgeWafRuleSet | null>(null);
  const [switchingPolicy, setSwitchingPolicy] = useState<boolean>(false);
  const [policySwitchResult, setPolicySwitchResult] = useState<PolicySwitchResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'crawlers' | 'stream' | 'waf'>('crawlers');
  const [selectedBotFilter, setSelectedBotFilter] = useState<string>('ALL');

  useEffect(() => {
    loadTelemetryReport();
  }, [activeBrand, horizonHours]);

  useEffect(() => {
    if (report) {
      loadWafRules(selectedProvider, report.active_policy_mode);
    }
  }, [selectedProvider, report?.active_policy_mode]);

  const loadTelemetryReport = async () => {
    setLoading(true);
    try {
      const data = await api.getBotArmorTelemetry(activeBrand, horizonHours);
      setReport(data);
      if (data.active_rulesets && data.active_rulesets.length > 0) {
        setActiveRuleSet(data.active_rulesets[0]);
      }
    } catch (err) {
      console.error('Failed to load bot armor telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWafRules = async (provider: string, policyMode: string) => {
    try {
      const rules = await api.generateEdgeWafRules({
        provider,
        policy_mode: policyMode,
        brand_name: activeBrand
      });
      setActiveRuleSet(rules);
    } catch (err) {
      console.error('Failed to generate WAF rules:', err);
    }
  };

  const handleSwitchPolicy = async (newPolicy: 'GEO_OPTIMIZED_OPEN' | 'SELECTIVE_ARMOR' | 'AGGRESSIVE_RATE_LIMIT') => {
    setSwitchingPolicy(true);
    try {
      const result = await api.setBotArmorPolicy({ policy_mode: newPolicy });
      setPolicySwitchResult(result);
      await loadTelemetryReport();
    } catch (err) {
      console.error('Failed to switch policy mode:', err);
    } finally {
      setSwitchingPolicy(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadRule = (rule: EdgeWafRuleSet) => {
    const ext = rule.provider === 'AWS_WAF_ACL' ? 'json' : rule.provider === 'FASTLY_VCL' ? 'vcl' : rule.provider === 'NGINX_INGRESS' ? 'conf' : 'txt';
    const blob = new Blob([rule.rule_content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `psychs-edge-armor-${rule.provider.toLowerCase()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusLevelBadge = (level: string) => {
    switch (level) {
      case 'HEALTHY_INGESTION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'THROTTLED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'BLOCKED':
      case 'AGGRESSIVE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getActionTakenBadge = (action: string) => {
    switch (action) {
      case 'SERVED_FROM_CACHE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'ALLOWED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'RATE_LIMITED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'BLOCKED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-medium">Analyzing AI crawler telemetry &amp; edge WAF ingress...</p>
      </div>
    );
  }

  const currentReport = report!;
  const filteredCrawlers = selectedBotFilter === 'ALL'
    ? currentReport.crawlers
    : currentReport.crawlers.filter(c => c.bot_id === selectedBotFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Self-Healing GEO Bot Traffic Analyzer &amp; Edge WAF Armor</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Edge Armor v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Frontier AI crawler telemetry, crawl efficiency ratio (E_crawl), and automated edge WAF firewall generation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Horizon Filter */}
          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
            {[6, 12, 24].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setHorizonHours(hrs)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  horizonHours === hrs
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {hrs}H
              </button>
            ))}
          </div>

          <button
            onClick={loadTelemetryReport}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Policy Switch Result Banner */}
      {policySwitchResult && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-1 shadow-lg backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Edge Policy Updated: <strong>{policySwitchResult.new_policy}</strong> deployed across CDN nodes ({policySwitchResult.active_crawlers_affected} crawlers affected).</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
            {policySwitchResult.switch_id}
          </span>
        </div>
      )}

      {/* Top 4 Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Crawl Efficiency Ratio */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Crawl Efficiency (E_crawl)</span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              OPTIMIZED
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{currentReport.crawl_efficiency_score}%</span>
            <span className="text-xs text-emerald-400 font-semibold">+14.2% vs baseline</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Machine-Readable Hits:</span>
            <span className="font-semibold text-cyan-300">/llms.txt &amp; JSON-LD</span>
          </div>
        </div>

        {/* Card 2: 24h AI Bot Requests */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">24h AI Bot Ingress</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">
              {currentReport.total_bot_requests_24h.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">reqs</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Verified ASN Ratio:</span>
            <span className="font-semibold text-emerald-400">95.0% Verified</span>
          </div>
        </div>

        {/* Card 3: Bandwidth Saved */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Edge Bandwidth Saved</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-300 tracking-tight">
              {currentReport.edge_bandwidth_saved_gb} GB
            </span>
            <span className="text-xs text-slate-400 font-medium">cached</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Edge 304 Cache Hit:</span>
            <span className="font-semibold text-slate-200">78.4% of Ingress</span>
          </div>
        </div>

        {/* Card 4: Active Policy Mode */}
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Policy Mode</span>
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-white tracking-tight truncate max-w-[180px]">
              {currentReport.active_policy_mode}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Active WAF Providers:</span>
            <span className="font-semibold text-purple-300">Cloudflare &amp; Fastly</span>
          </div>
        </div>
      </div>

      {/* Policy Mode Control Bar */}
      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md shadow-md">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Self-Healing Policy Mode:</span>
          <span className="text-xs text-slate-400">Select active edge rule posture:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['GEO_OPTIMIZED_OPEN', 'SELECTIVE_ARMOR', 'AGGRESSIVE_RATE_LIMIT'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSwitchPolicy(mode)}
              disabled={switchingPolicy || currentReport.active_policy_mode === mode}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                currentReport.active_policy_mode === mode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('crawlers')}
          className={`pb-3 transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'crawlers'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Tracked AI Crawlers ({currentReport.crawlers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stream')}
          className={`pb-3 transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'stream'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Ingestion Stream ({currentReport.recent_events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('waf')}
          className={`pb-3 transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'waf'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Edge WAF &amp; CDN Rule Synthesizer</span>
        </button>
      </div>

      {/* TAB 1: Tracked AI Crawlers Grid */}
      {activeTab === 'crawlers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCrawlers.map((crawler) => (
              <div
                key={crawler.bot_id}
                className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between space-y-3 backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white truncate">{crawler.bot_name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${getStatusLevelBadge(crawler.status_level)}`}>
                      {crawler.status_level}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <div>Operator: <strong className="text-slate-200">{crawler.operator}</strong></div>
                    <div>Purpose: <span className="text-cyan-300 font-mono text-[11px]">{crawler.purpose}</span></div>
                    <div className="flex items-center space-x-1 pt-0.5">
                      <span className="text-slate-400">ASN Verification:</span>
                      {crawler.is_verified_asn ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified ASN</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Unverified IP</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Requests:</span>
                    <span className="font-bold text-white">{crawler.requests_24h.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bandwidth:</span>
                    <span>{crawler.bandwidth_mb_24h} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Latency:</span>
                    <span className="text-emerald-300">{crawler.avg_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crawl Depth:</span>
                    <span>{crawler.crawl_depth_avg} pgs/visit</span>
                  </div>
                </div>

                {/* Primary Targets */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Endpoints:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {crawler.primary_targets.map((tgt, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-950 text-slate-300 rounded border border-slate-800"
                      >
                        {tgt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Live Ingestion Stream */}
      {activeTab === 'stream' && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-sm font-bold text-white">Live AI Crawler Ingress Log</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">12 Recent Ingestion Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4">Event ID / Time</th>
                  <th className="py-3 px-4">Bot Name</th>
                  <th className="py-3 px-4">Client IP &amp; ASN</th>
                  <th className="py-3 px-4">Requested Path</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {currentReport.recent_events.map((evt) => (
                  <tr key={evt.event_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="text-cyan-400">{evt.event_id}</div>
                      <div className="text-[10px] text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{evt.bot_name}</td>
                    <td className="py-3 px-4">
                      <div>{evt.client_ip}</div>
                      <div className="text-[10px] text-slate-400">{evt.client_asn}</div>
                    </td>
                    <td className="py-3 px-4 text-amber-300 font-semibold">{evt.requested_path}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        evt.http_status === 200
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : evt.http_status === 304
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {evt.http_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{evt.response_time_ms} ms</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionTakenBadge(evt.action_taken)}`}>
                        {evt.action_taken}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Edge WAF & CDN Rule Synthesizer */}
      {activeTab === 'waf' && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <span>Synthesized Edge WAF &amp; CDN Firewall Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                One-click configuration rules allowing verified AI search bots while protecting origins from aggressive scrapers.
              </p>
            </div>

            {/* Provider Tabs */}
            <div className="flex flex-wrap bg-slate-950/80 rounded-lg p-1 border border-slate-800">
              {(['CLOUDFLARE_WAF', 'FASTLY_VCL', 'AWS_WAF_ACL', 'NGINX_INGRESS'] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => setSelectedProvider(prov)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    selectedProvider === prov
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prov.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {activeRuleSet && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{activeRuleSet.rule_name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyCode(activeRuleSet.rule_content)}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-all border border-slate-700 text-xs font-medium"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Ruleset'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadRule(activeRuleSet)}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-md transition-all border border-purple-500/30 text-xs font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Config</span>
                  </button>
                </div>
              </div>

              <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
                <pre className="whitespace-pre">{activeRuleSet.rule_content}</pre>
              </div>

              <p className="text-xs text-slate-400 italic">
                {activeRuleSet.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cryptographic SHA-256 Audit Seal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-500">
        <div className="flex items-center space-x-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>WORM Telemetry Audit Hash:</span>
          <span className="text-slate-400 truncate max-w-xs">{currentReport.audit_hash}</span>
        </div>
        <div className="text-slate-500">
          Generated: {new Date(currentReport.generated_at).toUTCString()}
        </div>
      </div>
    </div>
  );
};
