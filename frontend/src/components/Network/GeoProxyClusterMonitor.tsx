import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  Shield,
  Zap,
  RefreshCw,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  Terminal,
  Cpu,
  Layers,
  Fingerprint,
  RotateCw,
  Copy,
  Check,
  ChevronRight,
  TrendingDown,
  Clock,
  Wifi,
  ExternalLink,
  Sliders,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import {
  ProxyClusterStatus,
  EngineLatencyMetric,
  SyntheticProbeResult,
  RegionalNodeCluster,
  TlsFingerprintProfile
} from '../../types';

export const GeoProxyClusterMonitor: React.FC = () => {
  const [clusterStatus, setClusterStatus] = useState<ProxyClusterStatus | null>(null);
  const [latencyMatrix, setLatencyMatrix] = useState<EngineLatencyMetric[]>([]);
  const [probeHistory, setProbeHistory] = useState<SyntheticProbeResult[]>([]);
  const [resilienceStatus, setResilienceStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isRotatingTls, setIsRotatingTls] = useState<boolean>(false);
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [isFailingOver, setIsFailingOver] = useState<boolean>(false);
  
  // Probe config state
  const [selectedRegion, setSelectedRegion] = useState<string>('US_EAST_IAD');
  const [selectedEngine, setSelectedEngine] = useState<string>('perplexity_sonar');
  const [activeProbeResult, setActiveProbeResult] = useState<SyntheticProbeResult | null>(null);
  
  // Notification / copied state
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    setIsLoading(true);
    try {
      const [cluster, matrix, probes, resilience] = await Promise.all([
        api.getProxyClusterStatus(),
        api.getLatencyMatrix(),
        api.getProbeHistory(),
        api.getResilienceStatus()
      ]);
      setClusterStatus(cluster);
      setLatencyMatrix(matrix);
      setResilienceStatus(resilience);
      if (probes && probes.length > 0) {
        setProbeHistory(probes);
        setActiveProbeResult(probes[0]);
      }
    } catch (err) {
      console.error('Failed to load proxy cluster data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [cluster, matrix, resilience] = await Promise.all([
        api.getProxyClusterStatus(),
        api.getLatencyMatrix(),
        api.getResilienceStatus()
      ]);
      setClusterStatus(cluster);
      setLatencyMatrix(matrix);
      setResilienceStatus(resilience);
      showNotification('success', 'Global network telemetry & circuit breakers refreshed.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFailoverProxy = async () => {
    setIsFailingOver(true);
    try {
      const res = await api.failoverProxy();
      const updatedResilience = await api.getResilienceStatus();
      setResilienceStatus(updatedResilience);
      showNotification('success', `Egress proxy failover triggered. Active route: ${res.active_egress_region || updatedResilience.active_egress_region}`);
    } catch (err) {
      console.error('Failover error', err);
    } finally {
      setIsFailingOver(false);
    }
  };

  const handleRotateTls = async () => {
    setIsRotatingTls(true);
    try {
      const res = await api.rotateTlsFingerprints();
      const updatedCluster = await api.getProxyClusterStatus();
      setClusterStatus(updatedCluster);
      showNotification('success', `JA3/JA4 fingerprint rotated to: ${updatedCluster.active_tls_profile.emulation_target}`);
    } catch (err) {
      console.error('TLS rotation failed', err);
    } finally {
      setIsRotatingTls(false);
    }
  };

  const handleRunProbe = async (regionId?: string, engineId?: string) => {
    const reg = regionId || selectedRegion;
    const eng = engineId || selectedEngine;
    setIsProbing(true);
    try {
      const result = await api.dispatchNetworkProbe({
        region_id: reg,
        target_engine: eng
      });
      if (result) {
        setActiveProbeResult(result);
        setProbeHistory(prev => [result, ...prev.filter(p => p.probe_id !== result.probe_id)].slice(0, 10));
        showNotification('success', `Synthetic probe completed: ${result.round_trip_ms}ms round-trip via ${result.region_name}`);
      }
    } catch (err) {
      console.error('Synthetic probe failed', err);
    } finally {
      setIsProbing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
    showNotification('info', 'Fingerprint hash copied to clipboard');
  };

  const showNotification = (type: 'success' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  if (isLoading && !clusterStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-gray-400 font-mono text-sm">Querying multi-region egress mesh telemetry...</p>
      </div>
    );
  }

  const activeTls = clusterStatus?.active_tls_profile;

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-900/95 border border-cyan-500/40 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-cyan-950/30 border border-cyan-500/20 p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                Active-Active Multi-Region Mesh • {clusterStatus?.cluster_version || 'v2.0.0-PROD-GEO'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
              <Globe className="w-9 h-9 text-cyan-400" />
              Multi-Region Proxy & Egress Gateway
            </h1>
            <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
              Global residential egress network across 4 tier-1 regional clusters. Real-time latency tracking across 5 frontier AI search engines with automated JA3/JA4 TLS anti-detection circuit breakers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRotateTls}
              disabled={isRotatingTls}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-cyan-300 font-medium text-xs transition-all shadow-lg hover:border-cyan-500/50 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isRotatingTls ? 'animate-spin' : ''}`} />
              Rotate JA3 Profiles
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 font-medium text-xs transition-all shadow-lg hover:border-gray-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Matrix
            </button>
            <button
              onClick={() => handleRunProbe()}
              disabled={isProbing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isProbing ? 'animate-bounce' : ''}`} />
              {isProbing ? 'Probing Gateway...' : 'Launch Synthetic Probe'}
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Nodes</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {clusterStatus?.total_active_nodes.toLocaleString() || '4,250'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Pool: {clusterStatus?.total_residential_pool.toLocaleString() || '7,600'} IPs
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Global p95 RTT</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {clusterStatus?.global_p95_latency_ms || 34.8} <span className="text-sm text-gray-400">ms</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Avg: {clusterStatus?.global_avg_latency_ms || 24.1} ms
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Sessions</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {clusterStatus?.active_sessions.toLocaleString() || '895'}
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 100% Routed
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Egress Data</span>
            <Wifi className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {clusterStatus?.total_bandwidth_served_tb || 4.15} <span className="text-sm text-gray-400">TB</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Across 4 Regions
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Anti-Bot Evasion</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {clusterStatus?.anti_detection_evasion_rate || 99.92}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            JA3 / JA4 Spoofed
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Circuit Breakers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {resilienceStatus?.healthy_closed_count || 8} <span className="text-xs text-gray-500 font-normal">/ {resilienceStatus?.total_circuit_breakers || 8} Healthy</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            State: {resilienceStatus?.status || 'HEALTHY'}
          </div>
        </div>
      </div>

      {/* Upstream AI Engine Resilience & Circuit Breaker Mesh (Phase 3) */}
      <div className="glass-panel p-6 border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Upstream AI Engine Resilience &amp; Circuit Breakers
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Active fault-tolerance mesh with 3-state circuit breakers (CLOSED / OPEN / HALF_OPEN), exponential retry backoff, and multi-region proxy failover.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block font-mono text-xs">
              <span className="text-gray-400">Active Egress Route: </span>
              <span className="text-emerald-400 font-bold">{resilienceStatus?.active_egress_region || 'US-East (IAD - Residential)'}</span>
            </div>
            <button
              onClick={handleFailoverProxy}
              disabled={isFailingOver}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isFailingOver ? 'animate-spin' : ''}`} />
              {isFailingOver ? 'Shifting Egress...' : 'Failover Proxy Route'}
            </button>
          </div>
        </div>

        {resilienceStatus?.circuit_breakers && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(resilienceStatus.circuit_breakers).map(([key, cb]: [string, any]) => (
              <div key={key} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white truncate max-w-[150px]">{cb.provider_name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    cb.state === 'CLOSED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : cb.state === 'HALF_OPEN'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {cb.state}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Requests / Fails:</span>
                    <span className="text-slate-200">{cb.total_requests} / {cb.total_failures}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Route Region:</span>
                    <span className="text-cyan-400 truncate max-w-[120px]">{cb.active_proxy_region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Short-Circuits:</span>
                    <span className="text-purple-400 font-bold">{cb.total_short_circuits || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 Regional Egress Gateway Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Active-Active Regional Egress Clusters
          </h2>
          <span className="text-xs font-mono text-gray-500">4 Tier-1 Regions Operational</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clusterStatus?.regions.map((reg) => (
            <div
              key={reg.region_id}
              className={`rounded-xl border p-5 transition-all bg-gray-900/50 backdrop-blur-md ${
                selectedRegion === reg.region_id
                  ? 'border-cyan-500/60 ring-1 ring-cyan-500/40 bg-gray-900/80'
                  : 'border-gray-800/80 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                      {reg.region_id}
                    </span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1.5">{reg.region_name}</h3>
                  <p className="text-[11px] text-gray-400">{reg.location}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {reg.health_score}%
                  </span>
                  <div className="text-[10px] text-gray-500">Health</div>
                </div>
              </div>

              <div className="space-y-2.5 py-3 border-y border-gray-800/60 my-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Active Residential IPs:</span>
                  <span className="font-mono text-white font-medium">{reg.active_residential_ips.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Avg Round-Trip RTT:</span>
                  <span className="font-mono text-cyan-300 font-medium">{reg.avg_latency_ms} ms</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">p95 Latency:</span>
                  <span className="font-mono text-emerald-400 font-medium">{reg.p95_latency_ms} ms</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Egress Bandwidth:</span>
                  <span className="font-mono text-purple-300 font-medium">{reg.egress_bandwidth_gb} GB</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Primary ASNs</span>
                <div className="space-y-1">
                  {reg.primary_asns.map((asn, i) => (
                    <div key={i} className="text-[11px] text-gray-400 font-mono bg-gray-800/40 px-2 py-0.5 rounded truncate">
                      {asn}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedRegion(reg.region_id);
                  handleRunProbe(reg.region_id, selectedEngine);
                }}
                className="mt-4 w-full py-1.5 text-xs font-medium rounded-lg bg-gray-800/60 hover:bg-cyan-950/60 border border-gray-700/60 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Select & Probe Region
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Frontier AI Search Latency Heatmap Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Frontier AI Search Engine Latency Heatmap Matrix
          </h2>
          <span className="text-xs font-mono text-gray-500">Real-Time HTTP/2 Round-Trip Probes</span>
        </div>

        <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-800/40 text-gray-400 font-mono uppercase tracking-wider text-[11px] border-b border-gray-800">
                <tr>
                  <th className="py-3.5 px-4">AI Search Engine</th>
                  <th className="py-3.5 px-4">Endpoint</th>
                  <th className="py-3.5 px-4 text-center">US-East (IAD)</th>
                  <th className="py-3.5 px-4 text-center">US-West (PDX)</th>
                  <th className="py-3.5 px-4 text-center">EU-Central (FRA)</th>
                  <th className="py-3.5 px-4 text-center">AP-Southeast (SIN)</th>
                  <th className="py-3.5 px-4 text-center">TLS Handshake</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300 font-mono">
                {latencyMatrix.map((m) => (
                  <tr key={m.engine_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        {m.engine_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-[11px] truncate max-w-[180px]">
                      {m.target_endpoint}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold">
                        {m.latencies_by_region['US_EAST_IAD']} ms
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold">
                        {m.latencies_by_region['US_WEST_PDX']} ms
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-1 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300 font-semibold">
                        {m.latencies_by_region['EU_CENTRAL_FRA']} ms
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-1 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-semibold">
                        {m.latencies_by_region['AP_SOUTHEAST_SIN']} ms
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-400">
                      {m.tls_handshake_ms} ms
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedEngine(m.engine_id);
                          handleRunProbe(selectedRegion, m.engine_id);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded bg-gray-800 hover:bg-cyan-950 border border-gray-700 hover:border-cyan-500/50 text-cyan-300 transition-all font-sans font-medium"
                      >
                        Ping Probe
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: TLS Fingerprint Spoofing & Synthetic Probe Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TLS Fingerprint & Anti-Detection Vault */}
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-6 backdrop-blur-md shadow-xl space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">TLS Fingerprint Spoofing (JA3 / JA4)</h3>
              </div>
              <p className="text-xs text-gray-400">
                Randomizes TLS cipher suites, extension sequences, and HTTP/2 pseudo-headers to bypass Cloudflare and Akamai anti-bot defenses.
              </p>
            </div>
            <button
              onClick={handleRotateTls}
              disabled={isRotatingTls}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 text-xs font-medium transition-all"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotatingTls ? 'animate-spin' : ''}`} />
              Rotate Profile
            </button>
          </div>

          {activeTls && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-950/70 border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Emulation Profile:</span>
                  <span className="text-xs font-semibold text-cyan-300 font-mono">{activeTls.emulation_target}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Evasion Success Rate:</span>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">{activeTls.evasion_success_rate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Cipher Suites Count:</span>
                  <span className="text-xs font-semibold text-purple-300 font-mono">{activeTls.cipher_suites_count} Active Suites</span>
                </div>
              </div>

              {/* JA3 Hash Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-mono">JA3 Hash (MD5 Signature)</span>
                  <button
                    onClick={() => copyToClipboard(activeTls.ja3_hash, 'ja3')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedHash === 'ja3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedHash === 'ja3' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-950/90 border border-gray-800 text-xs font-mono text-cyan-300 break-all select-all">
                  {activeTls.ja3_hash}
                </div>
              </div>

              {/* JA4 Hash Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-mono">JA4 Hash (Next-Gen TLS 1.3 Signature)</span>
                  <button
                    onClick={() => copyToClipboard(activeTls.ja4_hash, 'ja4')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedHash === 'ja4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedHash === 'ja4' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-950/90 border border-gray-800 text-xs font-mono text-purple-300 break-all select-all">
                  {activeTls.ja4_hash}
                </div>
              </div>

              {/* HTTP/2 Frame Settings */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-mono">HTTP/2 SETTINGS Frame Parameters</span>
                <div className="p-3 rounded-lg bg-gray-950/90 border border-gray-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {Object.entries(activeTls.h2_settings).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-gray-400 border-b border-gray-800/40 pb-1">
                      <span className="text-gray-500">{k}:</span>
                      <span className="text-gray-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Synthetic Traceroute Probe Runner & Hop Visualizer */}
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-6 backdrop-blur-md shadow-xl space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Live Synthetic Traceroute Probe</h3>
              </div>
              <p className="text-xs text-gray-400">
                Execute a live multi-hop latency ping from any regional egress cluster to an AI engine endpoint.
              </p>
            </div>
            <button
              onClick={() => handleRunProbe()}
              disabled={isProbing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
              {isProbing ? 'Running...' : 'Dispatch Probe'}
            </button>
          </div>

          {/* Region & Engine Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-gray-400 block mb-1">Origin Gateway Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full text-xs font-mono bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="US_EAST_IAD">US-East (IAD)</option>
                <option value="US_WEST_PDX">US-West (PDX)</option>
                <option value="EU_CENTRAL_FRA">EU-Central (FRA)</option>
                <option value="AP_SOUTHEAST_SIN">AP-Southeast (SIN)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-gray-400 block mb-1">Target AI Engine</label>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="w-full text-xs font-mono bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="chatgpt_search">ChatGPT Search (GPT-6)</option>
                <option value="perplexity_sonar">Perplexity Sonar-Pro</option>
                <option value="claude_3_7">Claude 3.7 Sonnet</option>
                <option value="gemini_flash">Gemini 2.5 Pro</option>
                <option value="google_ai_overviews">Google AI Overviews</option>
              </select>
            </div>
          </div>

          {/* Active Probe Telemetry Card */}
          {activeProbeResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-950/80 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{activeProbeResult.probe_id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                      {activeProbeResult.anti_bot_evasion}
                    </span>
                  </div>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {activeProbeResult.round_trip_ms} ms RTT
                  </span>
                </div>

                {/* Timing Bar Breakdown */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-800/60 text-center font-mono text-[11px]">
                  <div className="bg-gray-900/80 p-1.5 rounded">
                    <div className="text-gray-500 text-[10px]">DNS</div>
                    <div className="text-cyan-300 font-semibold">{activeProbeResult.dns_lookup_ms} ms</div>
                  </div>
                  <div className="bg-gray-900/80 p-1.5 rounded">
                    <div className="text-gray-500 text-[10px]">TCP Connect</div>
                    <div className="text-blue-300 font-semibold">{activeProbeResult.tcp_connect_ms} ms</div>
                  </div>
                  <div className="bg-gray-900/80 p-1.5 rounded">
                    <div className="text-gray-500 text-[10px]">TLS Handshake</div>
                    <div className="text-purple-300 font-semibold">{activeProbeResult.tls_handshake_ms} ms</div>
                  </div>
                  <div className="bg-gray-900/80 p-1.5 rounded">
                    <div className="text-gray-500 text-[10px]">TTFB Origin</div>
                    <div className="text-emerald-300 font-semibold">{activeProbeResult.ttfb_ms} ms</div>
                  </div>
                </div>

                {/* Multi-Hop Visualizer */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Multi-Hop Path</span>
                  <div className="space-y-1.5">
                    {activeProbeResult.hops.map((hop) => (
                      <div key={hop.hop} className="flex items-center justify-between text-xs font-mono bg-gray-900/60 px-3 py-1.5 rounded border border-gray-800/40">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                            {hop.hop}
                          </span>
                          <span className="text-gray-300">{hop.asn}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-[11px]">{hop.location}</span>
                          <span className="text-cyan-400 font-semibold">{hop.rtt_ms} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs font-mono border border-dashed border-gray-800 rounded-xl">
              Click &quot;Dispatch Probe&quot; to execute real-time multi-hop traceroute telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
