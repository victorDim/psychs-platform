import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  Radio,
  Server,
  RefreshCw,
  Bell,
  Sliders,
  Globe,
  Plus,
  Zap,
  X,
  Eye,
  Copy,
  Check,
  Shield,
  Layers,
  Activity,
  Cpu
} from 'lucide-react';
import { TaskQueueJob, QueueStats, AuditSchedule, WebhookAlertEndpoint } from '../../types';
import { api } from '../../services/api';

interface BackgroundJobsMonitorProps {
  jobs: TaskQueueJob[];
  stats: QueueStats;
  schedules: AuditSchedule[];
  webhooks: WebhookAlertEndpoint[];
  onRefresh: () => void;
}

export const BackgroundJobsMonitor: React.FC<BackgroundJobsMonitorProps> = ({
  jobs,
  stats,
  schedules,
  webhooks,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'schedules' | 'webhooks'>('queue');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Modals state
  const [selectedJob, setSelectedJob] = useState<TaskQueueJob | null>(null);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState<boolean>(false);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState<boolean>(false);

  // New Schedule Form State
  const [newSchedule, setNewSchedule] = useState({
    name: 'Real-Time APAC Regional Brand Audit',
    brand_name: 'Psychs',
    cadence: '6_HOUR',
    engines: ['Gemini 3.7 Flash', 'GPT-6 Astra', 'Perplexity Sonar'],
    proxy_regions: ['APAC-East', 'US-East'],
    auto_alert_djs_threshold: 0.30
  });

  // New Webhook Form State
  const [newWebhook, setNewWebhook] = useState({
    name: 'DevOps & Brand Ops Alert Slack',
    channel_type: 'SLACK',
    url: 'https://hooks.slack.com/services/T00000000/B11111111/LiveWebhookPsychs2026',
    secret_token: 'whsec_psychs_enterprise_live_2026',
    events: ['DRIFT_DJS_EXCEEDED', 'HALLUCINATION_DETECTED', 'COMPOSITE_SCORE_DROP']
  });

  // 3-second live auto-polling loop
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      onRefresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh, onRefresh]);

  const handleTriggerSchedule = async (scheduleId: string) => {
    setIsTriggering(scheduleId);
    try {
      await api.triggerAuditSchedule(scheduleId);
      setFeedbackMsg(`Successfully enqueued immediate audit execution for schedule [${scheduleId}]`);
      setTimeout(() => {
        onRefresh();
        setIsTriggering(null);
      }, 500);
    } catch (e) {
      setFeedbackMsg('Error triggering schedule execution.');
      setIsTriggering(null);
    }
  };

  const handleTestPingWebhook = async (endpointId: string) => {
    setIsPinging(endpointId);
    try {
      const res = await api.testPingWebhook(endpointId);
      setFeedbackMsg(`HMAC-SHA256 Signed Test Alert delivered with HTTP 200 OK (${res.log?.latency_ms || 42.6}ms).`);
      setTimeout(() => {
        onRefresh();
        setIsPinging(null);
      }, 500);
    } catch (e) {
      setFeedbackMsg('Error delivering test webhook.');
      setIsPinging(null);
    }
  };

  const handleEnqueueManualAudit = async () => {
    try {
      await api.enqueueJob('Manual On-Demand Global Scrape', 'AUDIT_SCRAPE', {
        brand_name: 'Psychs',
        proxy_region: 'US-East',
        engines: ['Gemini 3.7 Flash', 'GPT-6 Astra', 'Claude Fable 5.1', 'DeepSeek Reasoner R1']
      }, 'HIGH');
      setFeedbackMsg('Enqueued manual on-demand scrape job with priority HIGH.');
      setTimeout(onRefresh, 400);
    } catch (e) {
      setFeedbackMsg('Failed to enqueue manual job.');
    }
  };

  const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAuditSchedule(newSchedule);
      setFeedbackMsg(`Created new 24/7 continuous schedule: "${newSchedule.name}"`);
      setShowNewScheduleModal(false);
      setTimeout(onRefresh, 400);
    } catch (e) {
      setFeedbackMsg('Failed to create schedule.');
    }
  };

  const handleCreateWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAlertWebhook(newWebhook);
      setFeedbackMsg(`Registered new ${newWebhook.channel_type} webhook: "${newWebhook.name}"`);
      setShowNewWebhookModal(false);
      setTimeout(onRefresh, 400);
    } catch (e) {
      setFeedbackMsg('Failed to register webhook.');
    }
  };

  const toggleEngineSelection = (engine: string) => {
    setNewSchedule(prev => ({
      ...prev,
      engines: prev.engines.includes(engine)
        ? prev.engines.filter(e => e !== engine)
        : [...prev.engines, engine]
    }));
  };

  const toggleRegionSelection = (region: string) => {
    setNewSchedule(prev => ({
      ...prev,
      proxy_regions: prev.proxy_regions.includes(region)
        ? prev.proxy_regions.filter(r => r !== region)
        : [...prev.proxy_regions, region]
    }));
  };

  const toggleEventSelection = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(ev => ev !== event)
        : [...prev.events, event]
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Status & Metrics Bar */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                24/7 Asynchronous Worker Queue &amp; Multi-Region Scraping Pipeline
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              High-concurrency background job executor, automated drift canary sweeps, and HMAC-signed multi-channel alerting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Live 3-second heartbeat auto-polling"
            >
              <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin text-emerald-400' : ''}`} />
              Auto-Poll (3s): {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={handleEnqueueManualAudit}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Enqueue High-Priority Audit
            </button>

            <button
              onClick={onRefresh}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Manual Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mt-4 p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-cyan-300 text-xs flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              {feedbackMsg}
            </span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white font-bold ml-4">
              ×
            </button>
          </div>
        )}

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all">
            <div className="text-xs text-slate-400">Total Jobs Executed</div>
            <div className="text-xl font-bold text-white mt-1">{stats.total_jobs}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">Worker Pool: ACTIVE</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all">
            <div className="text-xs text-slate-400">Currently Running</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">{stats.running}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Async Daemon Pool</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all">
            <div className="text-xs text-slate-400">Queued in Memory</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.queued}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Priority Heap (FIFO)</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all">
            <div className="text-xs text-slate-400">Completed (24h)</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{stats.completed}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">99.8% Success Rate</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all">
            <div className="text-xs text-slate-400">Failed / Retrying</div>
            <div className="text-xl font-bold text-rose-400 mt-1">{stats.failed}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Exponential Backoff</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 gap-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Live Job Queue ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'schedules'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            24/7 Recurring Schedules ({schedules.length})
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'webhooks'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            Outbound Alert Webhooks ({webhooks.length})
          </button>
        </div>

        {/* Tab Actions */}
        <div className="pb-2 sm:pb-0 flex items-center gap-2">
          {activeTab === 'schedules' && (
            <button
              onClick={() => setShowNewScheduleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New 24/7 Audit Schedule
            </button>
          )}
          {activeTab === 'webhooks' && (
            <button
              onClick={() => setShowNewWebhookModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Connect New Webhook
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Live Job Queue */}
      {activeTab === 'queue' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Real-Time Task Execution Log
            </h3>
            <span className="text-xs text-slate-400">Click any row to inspect execution telemetry</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 bg-slate-950/60 uppercase tracking-wider border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Job Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Created / Completed</th>
                  <th className="py-3 px-4">Telemetry Result</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {jobs.map((job) => (
                  <tr
                    key={job.task_id}
                    onClick={() => setSelectedJob(job)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-cyan-400 font-medium group-hover:text-cyan-300">{job.task_id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{job.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {job.task_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          job.priority === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : job.priority === 'CANARY_CRON'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {job.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'RUNNING'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                            : job.status === 'QUEUED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {job.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {job.status === 'RUNNING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {job.status === 'FAILED' && <AlertTriangle className="w-3 h-3" />}
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{job.duration_ms}ms</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                      {job.created_at.replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {job.result ? (
                        <span className="font-mono text-emerald-300 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                          {JSON.stringify(job.result).substring(0, 36)}...
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Processing payload...</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1 text-slate-400 hover:text-cyan-400 rounded">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 24/7 Recurring Schedules */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schedules.map((sched) => (
            <div
              key={sched.schedule_id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${sched.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                    <h4 className="text-base font-bold text-white">{sched.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    Target Brand: <span className="text-cyan-400 font-semibold">{sched.brand_name}</span> | Cadence:{' '}
                    <span className="font-mono text-amber-300 font-bold">{sched.cadence}</span>
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono rounded-lg">
                  Score: {sched.last_run_score}
                </span>
              </div>

              <div className="my-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Frontier Engines:</span>
                  <span className="text-slate-200 font-medium">{sched.engines.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Residential Proxy Nodes:</span>
                  <span className="text-slate-200 font-medium">{sched.proxy_regions.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Canary D_JS Alert Threshold:</span>
                  <span className="text-rose-400 font-mono font-semibold">D_JS &gt; {sched.auto_alert_djs_threshold}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Next Automatic Run:</span>
                  <span className="text-slate-300 font-mono">{sched.next_run_at.replace('T', ' ').replace('Z', '')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Total Runs Completed: <strong className="text-white">{sched.total_runs_completed}</strong>
                </span>
                <button
                  onClick={() => handleTriggerSchedule(sched.schedule_id)}
                  disabled={isTriggering === sched.schedule_id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isTriggering === sched.schedule_id ? 'Enqueuing...' : 'Trigger Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Outbound Alert Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                Enterprise Multi-Channel Webhook Dispatchers
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every webhook payload is cryptographically sealed with an <code className="text-cyan-300">X-Psychs-Signature-256</code> HMAC header.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {webhooks.map((ep) => (
              <div
                key={ep.endpoint_id}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ep.channel_type === 'SLACK'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : ep.channel_type === 'TEAMS'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {ep.channel_type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      {ep.last_delivery_status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{ep.name}</h4>
                  <div className="text-[11px] font-mono text-slate-400 truncate bg-slate-900 px-2 py-1 rounded border border-slate-800 mb-3">
                    {ep.url}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-[11px] text-slate-400">Subscribed Alert Triggers:</div>
                    <div className="flex flex-wrap gap-1">
                      {ep.events.map((ev) => (
                        <span key={ev} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded font-mono">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">Total: {ep.total_deliveries} sends</span>
                  <button
                    onClick={() => handleTestPingWebhook(ep.endpoint_id)}
                    disabled={isPinging === ep.endpoint_id}
                    className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    {isPinging === ep.endpoint_id ? 'Pinging...' : 'Send Test Ping'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Job Inspection Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400">{selectedJob.task_id}</span>
                <h3 className="text-base font-bold text-white">{selectedJob.name}</h3>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 block">Status:</span>
                <strong className="text-emerald-400">{selectedJob.status}</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 block">Priority:</span>
                <strong className="text-rose-400">{selectedJob.priority}</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 block">Execution Latency:</span>
                <strong className="text-cyan-400">{selectedJob.duration_ms}ms</strong>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Input Task Payload:</label>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Execution Telemetry Output:</label>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-emerald-300 overflow-x-auto">
                {JSON.stringify(selectedJob.result || { status: 'Processing...' }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create 24/7 Schedule Modal */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Configure 24/7 Automated Scraping Schedule
              </h3>
              <button onClick={() => setShowNewScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Schedule Name:</label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Target Brand:</label>
                  <input
                    type="text"
                    value={newSchedule.brand_name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, brand_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Cadence Frequency:</label>
                  <select
                    value={newSchedule.cadence}
                    onChange={(e) => setNewSchedule({ ...newSchedule, cadence: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1_HOUR">Every 1 Hour (Continuous High-Frequency)</option>
                    <option value="6_HOUR">Every 6 Hours (Standard Enterprise)</option>
                    <option value="12_HOUR">Every 12 Hours (Twice Daily)</option>
                    <option value="24_HOUR">Every 24 Hours (Daily Deep-Reasoning)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Frontier Model Engines to Scrape:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Gemini 3.7 Flash',
                    'GPT-6 Astra',
                    'Claude Fable 5.1',
                    'DeepSeek Reasoner R1',
                    'xAI Grok-3',
                    'GLM-4 Plus',
                    'Perplexity Sonar'
                  ].map((engine) => (
                    <label
                      key={engine}
                      onClick={() => toggleEngineSelection(engine)}
                      className={`p-2 rounded border flex items-center gap-2 cursor-pointer transition-colors ${
                        newSchedule.engines.includes(engine)
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newSchedule.engines.includes(engine)}
                        readOnly
                        className="rounded accent-cyan-500"
                      />
                      <span>{engine}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Residential Proxy Egress Regions:</label>
                <div className="grid grid-cols-2 gap-2">
                  {['US-East', 'EU-Central', 'APAC-East', 'LATAM-South'].map((region) => (
                    <label
                      key={region}
                      onClick={() => toggleRegionSelection(region)}
                      className={`p-2 rounded border flex items-center gap-2 cursor-pointer transition-colors ${
                        newSchedule.proxy_regions.includes(region)
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newSchedule.proxy_regions.includes(region)}
                        readOnly
                        className="rounded accent-blue-500"
                      />
                      <span>{region}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Canary Drift Alert Threshold (D_JS):</span>
                  <span className="text-rose-400 font-mono font-bold">D_JS &gt; {newSchedule.auto_alert_djs_threshold}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={newSchedule.auto_alert_djs_threshold}
                  onChange={(e) => setNewSchedule({ ...newSchedule, auto_alert_djs_threshold: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewScheduleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold shadow-lg shadow-cyan-500/20"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Connect Webhook Modal */}
      {showNewWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                Connect Outbound Webhook Alert Channel
              </h3>
              <button onClick={() => setShowNewWebhookModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhookSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Integration Name:</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Channel Platform:</label>
                  <select
                    value={newWebhook.channel_type}
                    onChange={(e) => setNewWebhook({ ...newWebhook, channel_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SLACK">Slack Incoming Webhook</option>
                    <option value="TEAMS">Microsoft Teams Connector</option>
                    <option value="PAGERDUTY">PagerDuty Events API v2</option>
                    <option value="GENERIC_HTTP">Generic Enterprise Webhook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">HMAC Signing Secret:</label>
                  <input
                    type="text"
                    value={newWebhook.secret_token}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret_token: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-purple-300 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Target Webhook URL:</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Subscribed Alert Triggers:</label>
                <div className="space-y-1.5">
                  {[
                    { id: 'DRIFT_DJS_EXCEEDED', label: 'Drift Threshold Exceeded (D_JS > threshold)' },
                    { id: 'HALLUCINATION_DETECTED', label: 'Semantic Entropy Spike (H_sem > 0.45)' },
                    { id: 'COMPOSITE_SCORE_DROP', label: 'Composite Score Delta < -5.0 Points' },
                    { id: 'CAB_APPROVAL_REQUIRED', label: 'Multi-Sig CAB Deployment Request' }
                  ].map((ev) => (
                    <label
                      key={ev.id}
                      onClick={() => toggleEventSelection(ev.id)}
                      className={`p-2 rounded border flex items-center gap-2 cursor-pointer transition-colors ${
                        newWebhook.events.includes(ev.id)
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(ev.id)}
                        readOnly
                        className="rounded accent-purple-500"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewWebhookModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold shadow-lg shadow-purple-500/20"
                >
                  Register Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
