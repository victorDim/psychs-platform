import React, { useEffect, useRef, useState } from 'react';
import { Archive, ExternalLink, FileText, LoaderCircle, ShieldCheck } from 'lucide-react';

import {
  ApiError,
  type AuthoritativeSource,
  type ProductionJob,
  type SourceSnapshot,
  type SourceSnapshotDetail,
  v2Api,
} from '../../services/v2Api';

interface SourceSnapshotsPanelProps {
  projectId: string;
  sources: AuthoritativeSource[];
  canCapture: boolean;
}

const TERMINAL_STATUSES = new Set<ProductionJob['status']>(['succeeded', 'dead_letter', 'cancelled']);

export const SourceSnapshotsPanel: React.FC<SourceSnapshotsPanelProps> = ({
  projectId,
  sources,
  canCapture,
}) => {
  const verifiedSources = sources.filter((source) => source.verification_status === 'verified' && source.snapshot_policy !== 'disabled');
  const [sourceId, setSourceId] = useState('');
  const [snapshots, setSnapshots] = useState<SourceSnapshot[]>([]);
  const [detail, setDetail] = useState<SourceSnapshotDetail | null>(null);
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completedJob = useRef<string | null>(null);

  const activeSourceId = verifiedSources.some((source) => source.id === sourceId)
    ? sourceId
    : verifiedSources[0]?.id || '';

  useEffect(() => {
    if (!activeSourceId) {
      setSnapshots([]);
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void v2Api.listSourceSnapshots(projectId, activeSourceId)
      .then((records) => { if (!cancelled) setSnapshots(records); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load source snapshots'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeSourceId, projectId]);

  useEffect(() => {
    if (!job || TERMINAL_STATUSES.has(job.status)) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const updated = await v2Api.getJob(job.id);
        if (!cancelled) setJob(updated);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to refresh snapshot status');
      }
    }, 2_000);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [job]);

  useEffect(() => {
    if (job?.status !== 'succeeded' || completedJob.current === job.id || !activeSourceId) return;
    completedJob.current = job.id;
    void v2Api.listSourceSnapshots(projectId, activeSourceId).then(setSnapshots).catch(() => {
      setError('Snapshot completed, but its history could not be refreshed.');
    });
  }, [activeSourceId, job, projectId]);

  useEffect(() => {
    setJob(null);
    setDetail(null);
    completedJob.current = null;
  }, [activeSourceId, projectId]);

  const capture = async () => {
    if (!activeSourceId) return;
    setError(null);
    try {
      const created = await v2Api.enqueueSourceSnapshot(projectId, activeSourceId);
      completedJob.current = null;
      setJob(created);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 503) {
        setError('Source capture is not enabled for this deployment.');
      } else {
        setError(reason instanceof Error ? reason.message : 'Unable to start source capture');
      }
    }
  };

  const viewDetail = async (snapshot: SourceSnapshot) => {
    setError(null);
    try {
      setDetail(await v2Api.getSourceSnapshot(projectId, snapshot.source_id, snapshot.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load the stored snapshot');
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-indigo-900/70 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Archive className="h-4 w-4 text-indigo-300" /> Verified source snapshots</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Capture immutable source content with redirect provenance, byte count, SHA-256 integrity, and an enforced retention date.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-900 px-3 py-1 text-xs text-indigo-300"><ShieldCheck className="h-3 w-3" /> DNS-pinned fetch</span>
      </div>
      {verifiedSources.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Verify the project domain and register an eligible source before capturing snapshots.</p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 text-xs text-slate-400">Verified source
              <select value={activeSourceId} onChange={(event) => setSourceId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                {verifiedSources.map((source) => <option key={source.id} value={source.id}>{source.owner_label} · {source.canonical_url}</option>)}
              </select>
            </label>
            {canCapture ? <button type="button" onClick={capture} disabled={Boolean(job && !TERMINAL_STATUSES.has(job.status))} className="inline-flex items-center gap-2 rounded-lg bg-indigo-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60">
              {job && !TERMINAL_STATUSES.has(job.status) ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Capture current source
            </button> : null}
          </div>
          {error ? <div role="alert" className="mt-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div> : null}
          {job ? <div aria-live="polite" className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm"><p className="font-medium">Capture {job.status.replace('_', ' ')}</p><p className="mt-1 font-mono text-xs text-slate-500">Job {job.id} · attempt {job.attempt_count}/{job.max_attempts}</p>{job.last_error ? <p className="mt-2 text-xs text-red-300">{job.last_error}</p> : null}</div> : null}
          <div className="mt-4 space-y-3">
            {loading ? <p className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading snapshots…</p> : null}
            {!loading && snapshots.length === 0 ? <p className="text-sm text-slate-500">No durable snapshots have been captured for this source.</p> : null}
            {snapshots.map((snapshot) => <article key={snapshot.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{new Date(snapshot.fetched_at).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{snapshot.content_type} · {snapshot.byte_length.toLocaleString()} bytes · HTTP {snapshot.http_status}</p></div><button type="button" onClick={() => viewDetail(snapshot)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-indigo-300 hover:bg-slate-900">Inspect stored body</button></div>
              <a href={snapshot.final_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 break-all text-xs text-cyan-400">{snapshot.final_url}<ExternalLink className="h-3 w-3 shrink-0" /></a>
              <p className="mt-3 truncate font-mono text-[10px] text-slate-600">SHA-256 {snapshot.content_sha256}</p>
              <p className="mt-1 text-[10px] text-slate-600">Retained until {new Date(snapshot.retention_expires_at).toLocaleString()}</p>
            </article>)}
          </div>
          {detail ? <div className="mt-4 rounded-xl border border-indigo-900/70 bg-slate-950 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Stored response body</p><button type="button" onClick={() => setDetail(null)} className="text-xs text-slate-400 hover:text-white">Close</button></div><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-xs text-slate-300">{detail.body_text}</pre></div> : null}
        </div>
      )}
    </section>
  );
};
