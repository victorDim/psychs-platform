import React from 'react';
import { Clock3, ShieldCheck } from 'lucide-react';

import type { EvidenceRetentionEvent } from '../../services/v2Api';

interface RetentionHistoryProps {
  events: EvidenceRetentionEvent[];
  error?: string | null;
}

export const RetentionHistory: React.FC<RetentionHistoryProps> = ({ events, error }) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Retention history</h2>
        <p className="mt-1 text-xs text-slate-500">Append-only receipts from automated evidence expiry.</p>
      </div>
      <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400">Tenant scoped</span>
    </div>
    {error ? (
      <p role="status" className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-sm text-amber-200">{error}</p>
    ) : events.length === 0 ? (
      <p className="text-sm text-slate-500">No evidence has reached its retention deadline.</p>
    ) : (
      <div className="space-y-3">
        {events.map((event) => (
          <article key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-slate-200">{event.deleted_count.toLocaleString()} records expired</span>
              <span className="flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3 w-3" /> {new Date(event.executed_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">Cutoff {new Date(event.retention_cutoff).toLocaleString()}</p>
          </article>
        ))}
      </div>
    )}
  </section>
);
