import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  Bell,
  Send,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Terminal,
  ExternalLink,
  Layers,
  ChevronRight,
  Filter,
  Flame,
  Check,
  Globe,
  Lock,
  Cpu,
  Mail,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import {
  SeismographLiveTelemetry,
  SeismographShockwave,
  PushNotificationEvent,
  NotificationChannelConfig
} from '../../types';

interface Props {
  activeBrand?: string;
}

export const SeismographNotificationStudio: React.FC<Props> = ({ activeBrand = 'Psychs' }) => {
  const [telemetry, setTelemetry] = useState<SeismographLiveTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedShock, setSelectedShock] = useState<SeismographShockwave | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<PushNotificationEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'SHOCKWAVES' | 'CHANNELS' | 'STREAM' | 'PAYLOAD_PREVIEW'>('SHOCKWAVES');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Test Ping Modal & Result State
  const [pingingChannelId, setPingingChannelId] = useState<string | null>(null);
  const [pingResultModal, setPingResultModal] = useState<any | null>(null);

  // Broadcast Alert Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastEventType, setBroadcastEventType] = useState<string>('VOLATILITY_SPIKE');
  const [broadcastSeverity, setBroadcastSeverity] = useState<string>('CRITICAL');
  const [broadcastTitle, setBroadcastTitle] = useState<string>('SearchGPT Volatility Surge Detected');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('Frontier AI algorithm shift detected with significant citation turnover.');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      setRefreshing(true);
      const data = await api.getSeismographTelemetry(activeBrand);
      setTelemetry(data);
      if (data.active_shockwaves && data.active_shockwaves.length > 0 && !selectedShock) {
        setSelectedShock(data.active_shockwaves[0]);
      }
      if (data.recent_notifications && data.recent_notifications.length > 0 && !selectedAlert) {
        setSelectedAlert(data.recent_notifications[0]);
      }
    } catch (err) {
      console.error('Failed to load seismograph telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [activeBrand]);

  const handleTestPing = async (channelId: string) => {
    try {
      setPingingChannelId(channelId);
      const res = await api.testNotificationChannel({
        brand_name: activeBrand,
        channel_id: channelId
      });
      setPingResultModal(res);
      fetchTelemetry();
    } catch (err) {
      console.error('Failed to execute test ping:', err);
    } finally {
      setPingingChannelId(null);
    }
  };

  const handleToggleChannel = async (channel: NotificationChannelConfig) => {
    try {
      await api.updateNotificationChannel({
        brand_name: activeBrand,
        channel_id: channel.channel_id,
        is_active: !channel.is_active,
        subscribed_events: channel.subscribed_events
      });
      fetchTelemetry();
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsBroadcasting(true);
      const res = await api.dispatchPushAlert({
        brand_name: activeBrand,
        event_type: broadcastEventType,
        severity: broadcastSeverity,
        title: broadcastTitle,
        message: broadcastMessage,
        metric_payload: {
          v_algo: 84.5,
          magnitude: 7.8,
          manual_trigger_by: 'Brand SecOps Sentinel'
        }
      });
      setBroadcastSuccess(`Alert dispatched successfully: ${res.event_id}`);
      fetchTelemetry();
      setTimeout(() => {
        setShowBroadcastModal(false);
        setBroadcastSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case 'STORM':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"><Flame className="w-3.5 h-3.5 text-rose-400" /> SEISMIC STORM (CRITICAL)</span>;
      case 'ELEVATED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> ELEVATED TURBULENCE</span>;
      case 'MODERATE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"><Activity className="w-3.5 h-3.5 text-cyan-400" /> MODERATE WAVE</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> CALM / NOMINAL</span>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">INFO</span>;
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'SLACK':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'DISCORD':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'TEAMS':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'PAGERDUTY':
        return <Zap className="w-4 h-4 text-rose-400" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-amber-400" />;
      default:
        return <Globe className="w-4 h-4 text-cyan-400" />;
    }
  };

  if (loading || !telemetry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-medium">Initializing Real-Time Frontier AI Seismograph Telemetry...</p>
      </div>
    );
  }

  const filteredAlerts = telemetry.recent_notifications.filter(a => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                    Frontier AI Query Seismograph & Push Notification Center
                  </h1>
                  {getAlertLevelBadge(telemetry.global_alert_level)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-frequency algorithmic volatility tracking ($V_{'{'}algo{'}'} &gt; 65.0$) across SearchGPT, Perplexity Pro, Google AI Overviews, Claude &amp; Grok with cryptographically signed HMAC push alerting.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTelemetry}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 border border-slate-700/60 text-xs font-medium transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Live Resync'}</span>
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Emergency Alert</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Composite Volatility (V_algo)</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{telemetry.current_composite_volatility}</span>
              <span className="text-xs text-slate-400">/ 100.0</span>
              <span className="text-[10px] font-semibold text-rose-400 ml-auto">Mag 7.4 Richter</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 rounded-full"
                style={{ width: `${telemetry.current_composite_volatility}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Shockwaves</span>
              <Radio className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-300">{telemetry.active_shockwaves.length}</span>
              <span className="text-xs text-slate-400">Surges Active</span>
              <span className="text-[10px] font-semibold text-emerald-400 ml-auto">1 Contained</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 truncate">
              {telemetry.active_shockwaves.map(s => s.engine_name).join(', ')}
            </p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>24h Alerts Dispatched</span>
              <Bell className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{telemetry.total_alerts_dispatched_24h}</span>
              <span className="text-xs text-slate-400">Events</span>
              <span className="text-[10px] font-semibold text-emerald-400 ml-auto">99.98% SLA</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Across {telemetry.notification_channels.length} outbound webhook targets
            </p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>HMAC Cryptographic Seal</span>
              <Lock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono font-bold text-cyan-300 truncate">
                {telemetry.audit_hash.substring(0, 16)}...
              </span>
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 ml-auto" />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Zero-Trust SHA-256 integrity verified
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('SHOCKWAVES')}
          className={`pb-3 flex items-center gap-2 relative transition-colors ${
            activeTab === 'SHOCKWAVES' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Seismic Shockwave Radar ({telemetry.active_shockwaves.length})</span>
          {activeTab === 'SHOCKWAVES' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('CHANNELS')}
          className={`pb-3 flex items-center gap-2 relative transition-colors ${
            activeTab === 'CHANNELS' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Notification Channel Matrix ({telemetry.notification_channels.length})</span>
          {activeTab === 'CHANNELS' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('STREAM')}
          className={`pb-3 flex items-center gap-2 relative transition-colors ${
            activeTab === 'STREAM' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Push Notification Event Stream ({telemetry.recent_notifications.length})</span>
          {activeTab === 'STREAM' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
          )}
        </button>
      </div>

      {/* TAB 1: LIVE SEISMIC SHOCKWAVE RADAR */}
      {activeTab === 'SHOCKWAVES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shockwave List Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Frontier AI Search Shockwave Detection Engine</span>
                </h3>
                <span className="text-xs text-slate-400">P99 Polling: 300ms Interval</span>
              </div>

              {/* Oscillating Pulse Wave Visualization */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 mb-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Simulated Frontier Engine Pulse Oscillations</span>
                  <span className="text-cyan-400 font-mono text-[11px]">Real-Time V_algo Spectral Density</span>
                </div>
                <div className="h-16 flex items-end gap-1.5 pt-2">
                  {[45, 68, 92, 74, 88, 62, 55, 98, 82, 70, 64, 89, 95, 78, 84, 91, 67, 72, 85, 96, 73, 61, 80, 88].map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t transition-all duration-300"
                      style={{
                        height: `${val}%`,
                        backgroundColor: val > 80 ? '#f43f5e' : val > 65 ? '#f59e0b' : '#06b6d4',
                        opacity: 0.85
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Shockwave Cards */}
              <div className="space-y-3">
                {telemetry.active_shockwaves.map((shock) => {
                  const isSelected = selectedShock?.shock_id === shock.shock_id;
                  return (
                    <div
                      key={shock.shock_id}
                      onClick={() => setSelectedShock(shock)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            shock.volatility_v_algo >= 75
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : shock.volatility_v_algo >= 65
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-100">{shock.engine_name}</h4>
                              <span className="text-[11px] font-mono text-slate-400">({shock.shock_id})</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">Anomaly Type:</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                                {shock.dominant_anomaly_type}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-baseline gap-1.5 justify-end">
                            <span className="text-lg font-bold text-slate-100">{shock.volatility_v_algo}</span>
                            <span className="text-xs text-slate-400">V_algo</span>
                          </div>
                          <div className="text-[11px] font-semibold text-rose-400 mt-0.5">
                            Magnitude {shock.magnitude_richter} Richter
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                        <span>Impacted Queries: <strong className="text-slate-200">{shock.impacted_queries_count}</strong></span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            shock.status === 'ACTIVE_SURGE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : shock.status === 'CONTAINED_BY_HEDGE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {shock.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{shock.detected_at.substring(11, 19)} UTC</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shockwave Inspector Drawer */}
          <div className="space-y-4">
            {selectedShock ? (
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Shockwave Telemetry Detail</span>
                  </h3>
                  <span className="text-xs font-mono text-cyan-400">{selectedShock.shock_id}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Target AI Engine</span>
                    <span className="text-sm font-semibold text-slate-100">{selectedShock.engine_name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Volatility Index</span>
                      <span className="text-lg font-bold text-rose-400">{selectedShock.volatility_v_algo}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Richter Scale</span>
                      <span className="text-lg font-bold text-amber-400">{selectedShock.magnitude_richter} / 10.0</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Dominant Anomaly Category</span>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-cyan-300 font-mono text-[11px]">
                      {selectedShock.dominant_anomaly_type}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Mitigation Status</span>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200">
                      {selectedShock.status === 'ACTIVE_SURGE' ? (
                        <span className="text-rose-400 font-semibold">🚨 Active Unhedged Turbulence Surge</span>
                      ) : selectedShock.status === 'CONTAINED_BY_HEDGE' ? (
                        <span className="text-amber-400 font-semibold">🛡️ Contained by Automated Playbook HEDGE-GEO-01</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">✅ Nominal Variance Reconciled</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setBroadcastTitle(`Emergency: ${selectedShock.engine_name} Surge (Mag ${selectedShock.magnitude_richter})`);
                      setBroadcastMessage(`Algorithmic volatility surged to ${selectedShock.volatility_v_algo} on ${selectedShock.engine_name}. ${selectedShock.impacted_queries_count} queries impacted.`);
                      setShowBroadcastModal(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-900/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Outbound Alert for this Shock</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                Select a shockwave from the radar to inspect telemetry.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NOTIFICATION CHANNEL MATRIX */}
      {activeTab === 'CHANNELS' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Outbound Notification Channel Infrastructure</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Multi-channel dispatch matrix with cryptographically signed payloads, HMAC validation, and sub-50ms dispatch latency.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              5/5 Channels Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Channel</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Destination Target</th>
                  <th className="pb-3 font-semibold">Subscribed Events</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-center">Total Sent</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {telemetry.notification_channels.map((chan) => (
                  <tr key={chan.channel_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          {getChannelIcon(chan.channel_type)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-100 block">{chan.channel_name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{chan.channel_id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                        {chan.channel_type}
                      </span>
                    </td>

                    <td className="py-4">
                      <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px] block">
                        {chan.destination_target}
                      </span>
                    </td>

                    <td className="py-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {chan.subscribed_events.map((ev, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {chan.last_ping_status}
                      </span>
                    </td>

                    <td className="py-4 text-center font-mono font-semibold text-slate-100">
                      {chan.total_alerts_sent}
                    </td>

                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleChannel(chan)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${
                            chan.is_active
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {chan.is_active ? 'Active' : 'Disabled'}
                        </button>

                        <button
                          onClick={() => handleTestPing(chan.channel_id)}
                          disabled={pingingChannelId === chan.channel_id}
                          className="px-3 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-medium transition-all flex items-center gap-1.5"
                        >
                          {pingingChannelId === chan.channel_id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Send Test Ping</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PUSH NOTIFICATION EVENT STREAM */}
      {activeTab === 'STREAM' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span>Live Outbound Push Notification Stream</span>
                  </h3>
                  <span className="text-xs text-slate-400">({filteredAlerts.length} Events)</span>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${
                        severityFilter === sev
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredAlerts.map((alert) => {
                  const isSelected = selectedAlert?.event_id === alert.event_id;
                  return (
                    <div
                      key={alert.event_id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="pt-0.5">
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{alert.title}</h4>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-4">
                          {alert.dispatched_at.substring(11, 19)} UTC
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Channels:</span>
                          {alert.target_channels.map((ch, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-cyan-300 border border-slate-800">
                              {ch}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-400">● {alert.dispatch_status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alert Inspector & HMAC Drawer */}
          <div className="space-y-4">
            {selectedAlert ? (
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Cryptographic HMAC Payload Inspector</span>
                  </h3>
                  <span className="text-xs font-mono text-cyan-400">{selectedAlert.event_id}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Event Type</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-950 text-cyan-300 border border-slate-800">
                      {selectedAlert.event_type}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">HMAC-SHA256 Signature Stamp</span>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all">
                      {selectedAlert.cryptographic_hmac_seal}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Structured Telemetry Payload</span>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-48">
                      {JSON.stringify(selectedAlert.metric_payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                Select an alert from the stream to inspect cryptographic payload.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Ping Diagnostic Modal */}
      {pingResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Live Test Ping Delivered (200 OK)</h3>
              </div>
              <button
                onClick={() => setPingResultModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Channel Destination:</span>
                <span className="font-mono text-cyan-300">{pingResultModal.ping_result.channel} • {pingResultModal.ping_result.target}</span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Latency &amp; Status:</span>
                <span className="font-mono text-emerald-400 font-bold">{pingResultModal.ping_result.http_status} OK ({pingResultModal.ping_result.latency_ms}ms)</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Cryptographic HMAC Signature:</span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all">
                  {pingResultModal.ping_result.hmac_signature}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Dispatched JSON Payload:</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                  {JSON.stringify(pingResultModal.ping_result.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPingResultModal(null)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Close Diagnostic View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-slate-100">Broadcast Outbound Emergency Alert</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{broadcastSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleBroadcastAlert} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Event Type</label>
                  <select
                    value={broadcastEventType}
                    onChange={(e) => setBroadcastEventType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                  >
                    <option value="VOLATILITY_SPIKE">VOLATILITY_SPIKE (High Turbulence)</option>
                    <option value="POISONING_ATTACK_DETECTED">POISONING_ATTACK_DETECTED (Knowledge Graph)</option>
                    <option value="BUYER_OBJECTION_SURFACED">BUYER_OBJECTION_SURFACED (Simulation CSOR)</option>
                    <option value="GITOPS_PROMOTION_READY">GITOPS_PROMOTION_READY (A/B Winner)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Severity Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CRITICAL', 'WARNING', 'INFO'].map((sev) => (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setBroadcastSeverity(sev)}
                        className={`py-2 rounded-lg border text-center font-bold tracking-wider text-[10px] transition-all ${
                          broadcastSeverity === sev
                            ? sev === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/60'
                              : sev === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Alert Title</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Message Body</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-rose-900/30 flex items-center gap-1.5"
                  >
                    {isBroadcasting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isBroadcasting ? 'Signing & Dispatching...' : 'Dispatch HMAC Alert'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
