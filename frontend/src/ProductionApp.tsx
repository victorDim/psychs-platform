import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Database, ExternalLink, FolderPlus, LoaderCircle, Plus, ShieldCheck } from 'lucide-react';

import { AuthSessionControl, useAuthentication } from './auth/AuthGate';
import { ProjectOnboarding } from './components/production/ProjectOnboarding';
import { DomainVerificationPanel } from './components/production/DomainVerificationPanel';
import { RetentionHistory } from './components/production/RetentionHistory';
import { EvidenceCollectionPanel } from './components/production/EvidenceCollectionPanel';
import { SourceSnapshotsPanel } from './components/production/SourceSnapshotsPanel';
import {
  type AuthoritativeSource,
  type EvidenceObservation,
  type EvidenceRetentionEvent,
  type Project,
  type ProjectCreate,
  v2Api,
} from './services/v2Api';

export const ProductionApp: React.FC = () => {
  const { user } = useAuthentication();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectData, setProjectData] = useState<{
    projectId: string; sources: AuthoritativeSource[]; observations: EvidenceObservation[];
  }>({ projectId: '', sources: [], observations: [] });
  const sources = projectData.projectId === selectedProjectId ? projectData.sources : [];
  const observations = projectData.projectId === selectedProjectId ? projectData.observations : [];
  const loadGeneration = useRef(0);
  const activeProjectRef = useRef('');
  const [retentionEvents, setRetentionEvents] = useState<EvidenceRetentionEvent[]>([]);
  const [retentionError, setRetentionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [saving, setSaving] = useState(false);
  const [snapshotPolicy, setSnapshotPolicy] = useState<'manual' | 'daily'>('manual');
  const [updatingPolicy, setUpdatingPolicy] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const canWriteProjects = user.scopes.includes('projects:write');
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  useEffect(() => {
    void v2Api.listProjects()
      .then((projectRecords) => {
        setProjects(projectRecords);
        setSelectedProjectId(projectRecords[0]?.id || '');
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load projects'))
      .finally(() => setLoading(false));
    void v2Api.listRetentionEvents()
      .then(setRetentionEvents)
      .catch(() => setRetentionError('Retention history is temporarily unavailable.'));
  }, []);

  const createProject = useCallback(async (command: ProjectCreate) => {
    const project = await v2Api.createProject(command);
    setProjects((current) => [...current, project]);
    setSelectedProjectId(project.id);
    setShowProjectForm(false);
    return project;
  }, []);

  const loadSources = useCallback(async (projectId: string) => {
    // Completion callbacks from an unmounted project must not replace its successor's data.
    if (projectId !== activeProjectRef.current) return;
    const generation = ++loadGeneration.current;
    if (!projectId) {
      setProjectData({ projectId, sources: [], observations: [] });
      return;
    }
    setError(null);
    try {
      const [sourceRecords, evidenceRecords] = await Promise.all([
        v2Api.listSources(projectId),
        v2Api.listEvidence(projectId),
      ]);
      if (generation === loadGeneration.current) {
        setProjectData({ projectId, sources: sourceRecords, observations: evidenceRecords });
      }
    } catch (reason) {
      if (generation === loadGeneration.current) setError(reason instanceof Error ? reason.message : 'Unable to load project evidence');
    }
  }, []);

  useEffect(() => {
    activeProjectRef.current = selectedProjectId;
    void loadSources(selectedProjectId);
    return () => { loadGeneration.current += 1; activeProjectRef.current = ''; };
  }, [loadSources, selectedProjectId]);

  const refreshVerifiedProject = useCallback(async (projectId: string) => {
    const [projectRecords] = await Promise.all([
      v2Api.listProjects(),
      loadSources(projectId),
    ]);
    setProjects(projectRecords);
  }, [loadSources]);

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
        snapshot_policy: snapshotPolicy,
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

  const updateSnapshotPolicy = async (source: AuthoritativeSource, policy: 'manual' | 'daily' | 'disabled') => {
    setUpdatingPolicy(source.id);
    setError(null);
    try {
      const updated = await v2Api.updateSnapshotPolicy(source.project_id, source.id, policy);
      setProjectData((current) => current.projectId === updated.project_id
        ? { ...current, sources: current.sources.map((record) => record.id === updated.id ? updated : record) }
        : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update capture policy');
    } finally {
      setUpdatingPolicy(null);
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
          <div className="flex flex-wrap items-center gap-3">
            {projects.length > 0 && <select aria-label="Active project" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.canonical_domain}</option>)}
            </select>}
            {canWriteProjects && projects.length > 0 && <button type="button" onClick={() => setShowProjectForm((visible) => !visible)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-300 hover:bg-emerald-950/40"><FolderPlus className="h-4 w-4" /> New project</button>}
          </div>
        </header>

        {error && <div role="alert" className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}
        {showProjectForm && <div className="mb-6"><ProjectOnboarding onCreate={createProject} onCancel={() => setShowProjectForm(false)} /></div>}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading tenant data…</div>
        ) : projects.length === 0 ? (
          canWriteProjects ? <ProjectOnboarding onCreate={createProject} /> : (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
              <Database className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <h2 className="font-semibold">No projects are available</h2>
              <p className="mt-2 text-sm text-slate-400">A tenant administrator must provision your first project.</p>
            </section>
          )
        ) : (
          <>
            {selectedProject && <DomainVerificationPanel
              project={selectedProject}
              canManage={canWriteProjects}
              onVerified={() => refreshVerifiedProject(selectedProject.id)}
            />}
            <EvidenceCollectionPanel
              key={selectedProjectId}
              projectId={selectedProjectId}
              canCollect={canWriteProjects}
              onEvidenceUpdated={() => loadSources(selectedProjectId)}
            />
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
                    {canWriteProjects ? <label className="mt-3 block text-xs text-slate-400">Capture policy
                      <select value={source.snapshot_policy} disabled={updatingPolicy !== null} onChange={(event) => void updateSnapshotPolicy(source, event.target.value as 'manual' | 'daily' | 'disabled')} className="ml-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                        {source.snapshot_policy === 'on_collection' ? <option value="on_collection" disabled>On collection (pending implementation)</option> : null}
                        <option value="manual">Manual</option><option value="daily">Daily (UTC)</option><option value="disabled">Disabled</option>
                      </select>
                    </label> : null}
                  </article>
                ))}
              </div>
              </section>
              {canWriteProjects ? <form onSubmit={addSource} className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><Plus className="h-4 w-4" /> Register source</h2>
              <label className="mb-4 block text-xs text-slate-400">Capture policy<select value={snapshotPolicy} onChange={(event) => setSnapshotPolicy(event.target.value as 'manual' | 'daily')} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="manual">Manual</option><option value="daily">Daily (UTC)</option></select></label>
              <p className="mb-4 text-xs text-slate-500">Daily capture starts after domain verification and requires capture to be enabled by your operator. Up to 30 scheduled captures per workspace per UTC day.</p>
              <label className="mb-4 block text-xs text-slate-400">Public HTTP(S) URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/docs" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              <label className="mb-5 block text-xs text-slate-400">Owner label<input required value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Product documentation" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              <button disabled={saving} className="w-full rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Registering…' : 'Register authoritative source'}</button>
              </form> : <section className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-6"><h2 className="font-semibold">Read-only access</h2><p className="mt-2 text-sm text-slate-400">Your current role can inspect sources and evidence but cannot register new sources.</p></section>}
            </div>
            <SourceSnapshotsPanel key={selectedProjectId} projectId={selectedProjectId} sources={sources} canCapture={canWriteProjects} />
            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-semibold">Observed AI evidence</h2>
                <span className="text-xs text-slate-500">Immutable service-collected records</span>
              </div>
              <div className="space-y-3">
                {observations.length === 0 && <p className="text-sm text-slate-500">No observed evidence has been collected for this project.</p>}
                {observations.map((observation) => (
                  <article key={observation.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{observation.provider} · {observation.model_identifier}</p>
                        <p className="mt-1 text-xs text-slate-500">Observed {new Date(observation.observed_at).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full border border-emerald-800 px-2 py-1 text-[10px] uppercase text-emerald-300">{observation.evidence_class}</span>
                    </div>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Prompt</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{observation.prompt_text}</p>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Response</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{observation.response_text}</p>
                    {observation.citations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {observation.citations.map((citation) => (
                          <a key={citation} href={citation} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-slate-800 px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300">
                            {citation}<ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="mt-4 truncate font-mono text-[10px] text-slate-600">SHA-256 {observation.content_hash}</p>
                    <details className="mt-4 text-xs text-slate-400">
                      <summary className="cursor-pointer">Source versions available at collection start</summary>
                      {observation.snapshot_context ? <div className="mt-2 space-y-2">
                        <p>Recorded {new Date(observation.snapshot_context.selected_at).toLocaleString()}. These references show available source versions; they do not establish which content the provider read.</p>
                        {observation.snapshot_context.snapshots.length === 0 ? <p>No eligible retained source snapshots were available.</p> : null}
                        {observation.snapshot_context.truncated ? <p>Showing the first {observation.snapshot_context.selection_limit} sources; additional sources were omitted.</p> : null}
                        {observation.snapshot_context.snapshots.map((reference) => <div key={reference.snapshot_id} className="rounded-lg border border-slate-800 p-2">
                          <p className="break-all">Snapshot {reference.snapshot_id}</p>
                          <p>Captured {new Date(reference.fetched_at).toLocaleString()} · body retention ends {new Date(reference.retention_expires_at).toLocaleString()}</p>
                          <p className="break-all font-mono">SHA-256 {reference.content_sha256}</p>
                        </div>)}
                      </div> : <p className="mt-2">Source version context was not recorded for this observation.</p>}
                    </details>
                  </article>
                ))}
              </div>
            </section>
            <div className="mt-6"><RetentionHistory events={retentionEvents} error={retentionError} /></div>
          </>
        )}
      </div>
      <AuthSessionControl />
    </main>
  );
};
