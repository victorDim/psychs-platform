import React, { useState } from 'react';
import { FolderPlus, LoaderCircle } from 'lucide-react';

import type { Project, ProjectCreate } from '../../services/v2Api';

interface ProjectOnboardingProps {
  onCreate: (project: ProjectCreate) => Promise<Project>;
  onCancel?: () => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export const ProjectOnboarding: React.FC<ProjectOnboardingProps> = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onCreate({
        name,
        slug,
        canonical_domain: domain,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setName('');
      setSlug('');
      setDomain('');
      setDescription('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-emerald-900/60 bg-slate-900/70 p-6 shadow-2xl shadow-emerald-950/10">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-400"><FolderPlus className="h-5 w-5" /></div>
        <div>
          <h2 className="font-semibold text-white">Create a monitored brand project</h2>
          <p className="mt-1 text-sm text-slate-400">This creates a tenant-isolated PostgreSQL record and immutable audit event.</p>
        </div>
      </div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs text-slate-400">Project name
          <input required maxLength={255} value={name} onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            setSlug(slugify(nextName));
          }} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" placeholder="Acme AI visibility" />
        </label>
        <label className="text-xs text-slate-400">Project slug
          <input required minLength={2} maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm text-white" placeholder="acme-ai-visibility" />
        </label>
        <label className="text-xs text-slate-400 md:col-span-2">Canonical domain
          <input required maxLength={255} value={domain} onChange={(event) => setDomain(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" placeholder="acme.example" />
        </label>
        <label className="text-xs text-slate-400 md:col-span-2">Description <span className="text-slate-600">(optional)</span>
          <textarea maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" placeholder="What this project monitors and who owns it." />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancel</button>}
        <button disabled={saving || slug.length < 2} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
          {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Creating…' : 'Create project'}
        </button>
      </div>
    </form>
  );
};
