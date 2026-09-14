import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { ShieldCheck, Filter, Lock, Eye, Sparkles, User, Cpu } from 'lucide-react';

interface Props {
  logs: AuditLogEntry[];
}

export const FourTierEvidenceTable: React.FC<Props> = ({ logs }) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredLogs = filter === 'ALL' ? logs : logs.filter((l) => l.evidence_tier === filter);

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Immutable WORM Audit Vault &amp; Four-Tier Evidence Labeling (FR-EVD-01 / 02)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Every score, normalization output, and human signature is cryptographically anchored.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['ALL', 'OBSERVED', 'INFERRED', 'MODEL_GENERATED', 'USER_PROVIDED'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilter(tier)}
              className={`px-3 py-1 rounded-md font-mono text-[11px] font-medium transition-all ${
                filter === tier
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Log ID</th>
              <th className="py-3 px-4">Evidence Tier</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action Type</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">WORM Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
            {filteredLogs.map((log) => {
              const tierClass =
                log.evidence_tier === 'OBSERVED'
                  ? 'badge-observed'
                  : log.evidence_tier === 'INFERRED'
                  ? 'badge-inferred'
                  : log.evidence_tier === 'MODEL_GENERATED'
                  ? 'badge-model-gen'
                  : 'badge-user-provided';

              return (
                <tr key={log.log_id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{log.log_id}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tierClass}`}>
                      [{log.evidence_tier}]
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{log.actor_id}</td>
                  <td className="py-3 px-4 text-cyan-400 font-semibold">{log.action_type}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans truncate max-w-xs">{log.resource_target}</td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-[140px]">{log.hmac_signature}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
