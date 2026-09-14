import React from 'react';
import { WebhookEndpoint } from '../../types';
import { Send, CheckCircle2, Shield, RefreshCw, Key } from 'lucide-react';

interface Props {
  webhooks: WebhookEndpoint[];
  onTestWebhook: (name: string) => void;
}

export const WebhookManager: React.FC<Props> = ({ webhooks, onTestWebhook }) => {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            Closed-Loop Native CMS Webhook Deployment (FR-OPT-03)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Direct OAuth2 and HMAC-SHA256 authenticated publishing connectors for enterprise content management.
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded border border-emerald-800">
          Level 4 Approved Execution Guardrail Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {webhooks.map((wh) => (
          <div key={wh.platform_name} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{wh.platform_name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  {wh.status}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono mb-2 truncate">
                Env: <span className="text-cyan-400 font-bold">{wh.environment}</span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono mb-4 truncate bg-slate-950 p-2 rounded border border-slate-800/80">
                {wh.endpoint_url}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Last Synced:</span>
                <span>{wh.last_sync_timestamp}</span>
              </div>

              <button
                onClick={() => onTestWebhook(wh.platform_name)}
                className="w-full text-center text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg border border-slate-700 active:scale-95 transition-all"
              >
                Test Endpoint Ping
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
