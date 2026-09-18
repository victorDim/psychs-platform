import React, { useCallback, useEffect, useState } from 'react';
import { Database, ExternalLink, LoaderCircle, Plus, ShieldCheck } from 'lucide-react';

import { AuthSessionControl } from './auth/AuthGate';
import { type AuthoritativeSource, type Project, v2Api } from './services/v2Api';

export const ProductionApp: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [sources, setSources] = useState<AuthoritativeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void v2Api.listProjects()
      .then((result) => {
        setProjects(result);
        setSelectedProjectId(result[0]?.id || '');
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const loadSources = useCallback(async (projectId: string) => {
    if (!projectId) {
      setSources([]);
      return;
    }
    setError(null);
    try {
      setSources(await v2Api.listSources(projectId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load authoritative sources');
    }
  }, []);

  useEffect(() => { void loadSources(selectedProjectId); }, [loadSources, selectedProjectId]);

  const addSource = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId) return;
    setError(null);
    setSaving(true);
    try {
      await v2Api.createSource(selectedProjectId, {
        canonical_url: url,
        source_type: 'website',
        owner_label: owner,
        snapshot_policy: 'on_collection',
      });
      setUrl('');
      setOwner('');
      await loadSources(selectedProjectId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to register source');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060913] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-emerald-400"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Authenticated control plane</span></div>
            <h1 className="text-3xl font-semibold">Authoritative sources</h1>
            <p className="mt-2 text-sm text-slate-400">Only observed, tenant-isolated records from the production API are displayed here.</p>
          </div>
          <select aria-label="Active project" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.canonical_domain}</option>)}
          </select>
        </header>

        {error && <div role="alert" className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading tenant data…</div>
        ) : projects.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <Database className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <h2 className="font-semibold">No projects are available</h2>
            <p className="mt-2 text-sm text-slate-400">Ask a tenant administrator to provision your first project.</p>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="mb-4 font-semibold">Registered sources</h2>
              <div className="space-y-3">
                {sources.length === 0 && <p className="text-sm text-slate-500">No authoritative sources registered.</p>}
                {sources.map((source) => (
                  <article key={source.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="font-medium">{source.owner_label}</p><p className="mt-1 text-xs text-slate-500">{source.source_type} · {source.snapshot_policy}</p></div>
                      <span className="rounded-full border border-amber-800 px-2 py-1 text-[10px] uppercase text-amber-300">{source.verification_status}</span>
                    </div>
                    <a href={source.canonical_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 break-all text-sm text-cyan-400 hover:text-cyan-300">{source.canonical_url}<ExternalLink className="h-3 w-3 shrink-0" /></a>
                  </article>
                ))}
              </div>
            </section>
            <form onSubmit={addSource} className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><Plus className="h-4 w-4" /> Register source</h2>
              <label className="mb-4 block text-xs text-slate-400">Public HTTP(S) URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/docs" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              <label className="mb-5 block text-xs text-slate-400">Owner label<input required value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Product documentation" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              <button disabled={saving} className="w-full rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Registering…' : 'Register authoritative source'}</button>
            </form>
          </div>
        )}
      </div>
      <AuthSessionControl />
    </main>
  );
};
