import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, LoaderCircle, Search } from 'lucide-react';

import { ApiError, type ProductionJob, v2Api } from '../../services/v2Api';

interface EvidenceCollectionPanelProps {
  projectId: string;
  canCollect: boolean;
  onEvidenceUpdated: () => Promise<void>;
}

const TERMINAL_STATUSES = new Set<ProductionJob['status']>([
  'succeeded',
  'dead_letter',
  'cancelled',
]);

export const EvidenceCollectionPanel: React.FC<EvidenceCollectionPanelProps> = ({
  projectId,
  canCollect,
  onEvidenceUpdated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completedJob = useRef<string | null>(null);

  useEffect(() => {
    if (!job || TERMINAL_STATUSES.has(job.status)) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const updated = await v2Api.getJob(job.id);
        if (!cancelled) setJob(updated);
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Unable to refresh collection status');
        }
      }
    }, 2_000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [job]);

  useEffect(() => {
    if (job?.status !== 'succeeded' || completedJob.current === job.id) return;
    completedJob.current = job.id;
    void onEvidenceUpdated();
  }, [job, onEvidenceUpdated]);

  useEffect(() => {
    setPrompt('');
    setJob(null);
    setError(null);
    completedJob.current = null;
  }, [projectId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await v2Api.enqueueEvidenceCollection(projectId, prompt);
      completedJob.current = null;
      setJob(created);
      setPrompt('');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 503) {
        setError('Live AI collection is not configured for this deployment. Ask an operator to enable the worker provider integration.');
      } else {
        setError(reason instanceof Error ? reason.message : 'Unable to start evidence collection');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-cyan-900/70 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Search className="h-4 w-4 text-cyan-400" /> Collect live AI evidence</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Run a real, web-enabled provider request. The prompt, response, citations, provider request ID, and content hash are retained as observed evidence.</p>
        </div>
        <span className="rounded-full border border-cyan-900 px-3 py-1 text-xs text-cyan-300">Durable job</span>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-900/70 bg-amber-950/20 p-3 text-xs text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This sends the prompt to the configured OpenAI account and may incur provider charges. Do not submit secrets or regulated personal data.</p>
      </div>
      {canCollect ? (
        <form onSubmit={submit} className="mt-4">
          <label className="block text-xs text-slate-400">Observation prompt
            <textarea required minLength={1} maxLength={8_000} rows={4} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="How does our product compare for enterprise buyers? Cite current public sources." className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white" />
          </label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{prompt.length.toLocaleString()} / 8,000 characters</span>
            <button disabled={submitting || !prompt.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              {submitting ? 'Queueing…' : 'Collect observed evidence'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Your current role can inspect evidence but cannot start provider collection.</p>
      )}
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
      {job && (
        <div aria-live="polite" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
          <div>
            <p className="font-medium">Collection {job.status.replace('_', ' ')}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">Job {job.id} · attempt {job.attempt_count}/{job.max_attempts}</p>
          </div>
          {!TERMINAL_STATUSES.has(job.status) && <LoaderCircle className="h-4 w-4 animate-spin text-cyan-400" />}
          {job.last_error && <p className="w-full text-xs text-red-300">{job.last_error}</p>}
        </div>
      )}
    </section>
  );
};
