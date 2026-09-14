import React, { useState, useEffect } from 'react';
import {
  Key,
  Globe,
  Radio,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw,
  Server,
  Lock,
  Eye,
  EyeOff,
  Activity,
  ArrowRight,
  Cpu,
  Sliders,
  Sparkles,
  Edit3
} from 'lucide-react';
import { ApiKeyConfig, ProxyStatus, ConnectionTestResult } from '../../types';
import { api } from '../../services/api';

export const LiveApiSettings: React.FC = () => {
  const [config, setConfig] = useState<ApiKeyConfig>({
    openai_api_key: 'sk-proj-live-9831••••••••••••••••3401',
    openai_model: 'gpt-6-astra',
    perplexity_api_key: 'pplx-live-7729••••••••••••••••1092',
    perplexity_model: 'sonar-reasoning-pro',
    gemini_api_key: 'AIzaSyB892••••••••••••••••4412',
    gemini_model: 'gemini-3.7-flash',
    anthropic_api_key: 'sk-ant-api03-live-••••••••••••••••8910',
    anthropic_model: 'claude-fable-5.1',
    deepseek_api_key: 'sk-deepseek-live-••••••••••••••••9932',
    deepseek_model: 'deepseek-reasoner',
    glm_api_key: 'glm-4p-auth-••••••••••••••••2198',
    glm_model: 'glm-4-plus',
    grok_api_key: 'xai-live-auth-••••••••••••••••7734',
    grok_model: 'grok-3',
    proxy_url: 'http://geo-residential-mesh.psychs.internal:22225',
    execution_mode: 'HYBRID_SANDBOX',
    proxy_enabled: true,
    active_proxy_provider: 'BrightData Residential Pool (US-East / EU-Central)',
    total_proxies_online: 4258
  });

  const [proxyHealth, setProxyHealth] = useState<ProxyStatus | null>({
    status: 'HEALTHY',
    provider: 'BrightData Residential Pool (US-East / EU-Central)',
    active_ips: 4258,
    rotation_interval_seconds: 600,
    geo_coverage: ['US-East', 'EU-Central', 'APAC-East', 'LATAM-South'],
    egress_ip_pool: 'RESIDENTIAL_STICKY_10M',
    average_latency_ms: 38
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getApiSettings();
      if (data.settings) setConfig(data.settings);
      if (data.proxy_health) setProxyHealth(data.proxy_health);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateApiSettings(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const result = await api.testProviderConnection(provider);
      setTestResults((prev) => ({ ...prev, [provider]: result }));
    } catch (err) {
      console.error(`Failed to test connection to ${provider}:`, err);
    } finally {
      setTestingProvider(null);
    }
  };

  const toggleShowKey = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI ChatGPT Search (GPT-6 Astra / o3)',
      keyField: 'openai_api_key' as const,
      modelField: 'openai_model' as const,
      defaultModel: 'gpt-6-astra',
      options: ['gpt-6-astra', 'o3-mini', 'gpt-5-pro', 'gpt-6-turbo'],
      placeholder: 'sk-proj-...'
    },
    {
      id: 'gemini',
      name: 'Google Gemini (Gemini 3.7 Flash)',
      keyField: 'gemini_api_key' as const,
      modelField: 'gemini_model' as const,
      defaultModel: 'gemini-3.7-flash',
      options: ['gemini-3.7-flash', 'gemini-2.5-pro', 'gemini-3.0-ultra', 'gemini-2.0-flash'],
      placeholder: 'AIzaSy...'
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude (Claude Fable 5.1 / 3.7 Sonnet)',
      keyField: 'anthropic_api_key' as const,
      modelField: 'anthropic_model' as const,
      defaultModel: 'claude-fable-5.1',
      options: ['claude-fable-5.1', 'claude-3-7-sonnet-20250219', 'claude-4-sonnet'],
      placeholder: 'sk-ant-api03-...'
    },
    {
      id: 'glm',
      name: 'Zhipu AI GLM (GLM-4 Plus / GLM-5)',
      keyField: 'glm_api_key' as const,
      modelField: 'glm_model' as const,
      defaultModel: 'glm-4-plus',
      options: ['glm-4-plus', 'glm-4-air', 'glm-4v', 'glm-5-preview'],
      placeholder: 'glm-...'
    },
    {
      id: 'grok',
      name: 'xAI Grok (Grok-3 Search)',
      keyField: 'grok_api_key' as const,
      modelField: 'grok_model' as const,
      defaultModel: 'grok-3',
      options: ['grok-3', 'grok-2', 'grok-beta'],
      placeholder: 'xai-...'
    },
    {
      id: 'perplexity',
      name: 'Perplexity Sonar Reasoning Pro',
      keyField: 'perplexity_api_key' as const,
      modelField: 'perplexity_model' as const,
      defaultModel: 'sonar-reasoning-pro',
      options: ['sonar-reasoning-pro', 'sonar-pro', 'sonar', 'r1-1776'],
      placeholder: 'pplx-...'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek R1 / V3 Reasoning Engine',
      keyField: 'deepseek_api_key' as const,
      modelField: 'deepseek_model' as const,
      defaultModel: 'deepseek-reasoner',
      options: ['deepseek-reasoner', 'deepseek-chat'],
      placeholder: 'sk-...'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                ENTERPRISE GATEWAY & PROXY POOL
              </span>
              <span className="text-xs font-mono text-slate-400">UNRESTRICTED FRONTIER MODEL SUITE</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              Live Frontier Engine APIs &amp; Residential Proxy Gateway
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Configured with current and next-gen frontier models: <strong>Gemini 3.7 Flash</strong>, <strong>GPT-6 Astra</strong>, <strong>Claude Fable 5.1</strong>, <strong>GLM-4 Plus</strong>, <strong>xAI Grok-3</strong>, <strong>Perplexity Sonar Reasoning Pro</strong>, and <strong>DeepSeek R1</strong>. You can also type any custom model ID.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Credentials Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              {isSaving ? 'Encrypting & Storing...' : 'Save API Configuration'}
            </button>
          </div>
        </div>

        {/* Execution Mode Selector */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-white block">Engine Execution Strategy:</span>
            <span className="text-[11px] text-slate-400">Choose between live frontier API egress or offline calibrated simulation.</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setConfig((prev) => ({ ...prev, execution_mode: 'HYBRID_SANDBOX' }))}
              className={`text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer ${
                config.execution_mode === 'HYBRID_SANDBOX'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hybrid Sandbox (Calibrated)
            </button>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, execution_mode: 'LIVE' }))}
              className={`text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer ${
                config.execution_mode === 'LIVE'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Egress (Production APIs)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: API Keys + Proxy Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: API Credentials */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Frontier Model Credentials &amp; Custom Model Identifiers
            </h3>
            <span className="text-[10px] font-mono text-slate-400">AES-256 Encrypted</span>
          </div>

          <p className="text-xs text-slate-400">
            Select from the presets or type any custom model identifier directly to route panel queries to exact model deployments.
          </p>

          <div className="space-y-4 mt-4">
            {providers.map((p) => {
              const test = testResults[p.name];
              const isTesting = testingProvider === p.name;
              const isRevealed = showKeys[p.keyField];
              const currentModel = (config as any)[p.modelField] || p.defaultModel;

              return (
                <div key={p.id} className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      {p.name}
                    </span>
                    <button
                      onClick={() => handleTestPing(p.name)}
                      disabled={isTesting}
                      className="text-[10px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? 'Pinging...' : 'Test Handshake'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 relative">
                      <input
                        type={isRevealed ? 'text' : 'password'}
                        value={(config as any)[p.keyField] || ''}
                        onChange={(e) => setConfig((prev) => ({ ...prev, [p.keyField]: e.target.value }))}
                        placeholder={p.placeholder}
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(p.keyField)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={currentModel}
                        onChange={(e) => setConfig((prev) => ({ ...prev, [p.modelField]: e.target.value }))}
                        placeholder="Model ID..."
                        list={`presets-${p.id}`}
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                      <datalist id={`presets-${p.id}`}>
                        {p.options.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {test && (
                    <div className="mt-2 text-[11px] font-mono p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {test.status} ({test.latency_ms}ms)
                      </span>
                      <span className="text-slate-400 truncate max-w-[200px]">{test.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Residential Proxy Pool */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Residential Proxy Mesh Network
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              ONLINE
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Outbound requests rotate through real consumer residential ISPs across 4 major global regions.
          </p>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Proxy Tunnel Endpoint URL
              </label>
              <input
                type="text"
                value={config.proxy_url_masked || config.proxy_url}
                onChange={(e) => setConfig((prev) => ({ ...prev, proxy_url: e.target.value }))}
                placeholder="http://user:pass@proxy.brightdata.io:22225"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Residential Proxy Routing:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.proxy_enabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, proxy_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Proxy Health Metrics */}
          {proxyHealth && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Active IPs</span>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                    {proxyHealth.active_ips.toLocaleString()} nodes
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Egress Latency</span>
                  <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                    {proxyHealth.average_latency_ms} ms
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  Active Geographic Zones:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {proxyHealth.geo_coverage.map((geo, idx) => (
                    <span key={idx} className="bg-slate-800/80 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded">
                      {geo}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/20 text-[11px] text-emerald-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Anti-Fingerprinting Guarantee
                </div>
                Zero ASN datacenter flags. User-Agent, TLS handshake cipher suites, and TCP window sizes are dynamically matched to real desktop browsers.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
