import React, { useEffect, useRef, useState } from 'react';
import { Archive, ExternalLink, FileText, LoaderCircle, ShieldCheck } from 'lucide-react';

import {
  ApiError,
  type AuthoritativeSource,
  type ProductionJob,
  type SourceSnapshot,
  type SourceSnapshotDetail,
  type SourceSnapshotHistory,
  v2Api,
} from '../../services/v2Api';

interface SourceSnapshotsPanelProps {
  projectId: string;
  sources: AuthoritativeSource[];
  canCapture: boolean;
}

const TERMINAL_STATUSES = new Set<ProductionJob['status']>(['succeeded', 'dead_letter', 'cancelled']);
const CHANGE_LABELS = {
  baseline_unavailable: 'No earlier retained capture to compare',
  unchanged: 'Content and response metadata unchanged',
  content_changed: 'Source content changed',
  metadata_changed: 'Response metadata changed; content unchanged',
} satisfies Record<SourceSnapshotHistory['change_status'], string>;

export const SourceSnapshotsPanel: React.FC<SourceSnapshotsPanelProps> = ({
  projectId,
  sources,
  canCapture,
}) => {
  const [sourceId, setSourceId] = useState('');
  const activeSourceId = sources.some((source) => source.id === sourceId)
    ? sourceId : sources[0]?.id || '';
  return <SourceSnapshotScope key={`${projectId}:${activeSourceId}`} projectId={projectId}
    sources={sources} canCapture={canCapture} activeSourceId={activeSourceId} onSourceChange={setSourceId} />;
};

const SourceSnapshotScope: React.FC<SourceSnapshotsPanelProps & {
  activeSourceId: string;
  onSourceChange: (sourceId: string) => void;
}> = ({ projectId, sources, canCapture, activeSourceId, onSourceChange }) => {
  const [snapshots, setSnapshots] = useState<SourceSnapshotHistory[]>([]);
  const [detail, setDetail] = useState<SourceSnapshotDetail | null>(null);
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completedJob = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const detailRequest = useRef(0);
  const activeSource = sources.find((source) => source.id === activeSourceId);
  const eligible = activeSource?.verification_status === 'verified' && activeSource.snapshot_policy !== 'disabled';

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
    let failures = 0;
    let timer: number;
    const poll = async () => {
      try {
        const updated = await v2Api.getJob(job.id);
        if (!cancelled) { setJob(updated); setError(null); }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Unable to refresh snapshot status');
          // Terminal authorization/not-found errors need user action, not repeated polling.
          if (!(reason instanceof ApiError && [401, 403, 404].includes(reason.status))) {
            failures += 1;
            timer = window.setTimeout(poll, Math.min(5_000 * 2 ** Math.min(failures - 1, 3), 30_000));
          }
        }
      }
    };
    timer = window.setTimeout(poll, 2_000);
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
    if (!activeSourceId || !eligible || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
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
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const viewDetail = async (snapshot: SourceSnapshot) => {
    const requestId = ++detailRequest.current;
    setDetail(null);
    setError(null);
    try {
      const result = await v2Api.getSourceSnapshot(projectId, snapshot.source_id, snapshot.id);
      if (requestId === detailRequest.current) setDetail(result);
    } catch (reason) {
      if (requestId === detailRequest.current) setError(reason instanceof Error ? reason.message : 'Unable to load the stored snapshot');
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
      {sources.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Register a source to view its capture history.</p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 text-xs text-slate-400">Source history
              <select value={activeSourceId} onChange={(event) => onSourceChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                {sources.map((source) => <option key={source.id} value={source.id}>{source.owner_label} · {source.canonical_url}</option>)}
              </select>
            </label>
            {canCapture ? <button type="button" onClick={capture} disabled={submitting || !eligible || Boolean(job && !TERMINAL_STATUSES.has(job.status))} className="inline-flex items-center gap-2 rounded-lg bg-indigo-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60">
              {job && !TERMINAL_STATUSES.has(job.status) ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {submitting ? 'Queueing capture…' : 'Capture current source'}
            </button> : null}
          </div>
          {!eligible ? <p className="mt-3 text-xs text-slate-400">New captures require a verified source with capture enabled. Retained history remains available.</p> : null}
          {error ? <div role="alert" className="mt-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div> : null}
          {job ? <div aria-live="polite" className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm"><p className="font-medium">Capture {job.status.replace('_', ' ')}</p><p className="mt-1 font-mono text-xs text-slate-500">Job {job.id} · attempt {job.attempt_count}/{job.max_attempts}</p>{job.last_error ? <p className="mt-2 text-xs text-red-300">{job.last_error}</p> : null}</div> : null}
          <div className="mt-4 space-y-3">
            {loading ? <p className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading snapshots…</p> : null}
            {!loading && snapshots.length === 0 ? <p className="text-sm text-slate-500">No durable snapshots have been captured for this source.</p> : null}
            {snapshots.map((snapshot) => <article key={snapshot.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{new Date(snapshot.fetched_at).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{snapshot.content_type} · {snapshot.byte_length.toLocaleString()} bytes · HTTP {snapshot.http_status}</p></div><button type="button" onClick={() => viewDetail(snapshot)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-indigo-300 hover:bg-slate-900">Inspect stored body</button></div>
              <a href={snapshot.final_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 break-all text-xs text-cyan-400">{snapshot.final_url}<ExternalLink className="h-3 w-3 shrink-0" /></a>
              <p className="mt-3 truncate font-mono text-[10px] text-slate-600">SHA-256 {snapshot.content_sha256}</p>
              <p className="mt-2 text-xs text-indigo-200">{CHANGE_LABELS[snapshot.change_status]}</p>
              {snapshot.baseline_snapshot_id ? <p className="mt-1 break-all text-[10px] text-slate-500">Compared with retained capture {snapshot.baseline_snapshot_id}</p> : null}
              <p className="mt-1 text-[10px] text-slate-600">Retained until {new Date(snapshot.retention_expires_at).toLocaleString()}</p>
            </article>)}
          </div>
          {detail ? <div className="mt-4 rounded-xl border border-indigo-900/70 bg-slate-950 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Stored response body</p><button type="button" onClick={() => setDetail(null)} className="text-xs text-slate-400 hover:text-white">Close</button></div><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-xs text-slate-300">{detail.body_text}</pre></div> : null}
        </div>
      )}
    </section>
  );
};
