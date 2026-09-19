import React, { useState } from 'react';
import { Check, Copy, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';

import {
  StepUpAuthenticationRequiredError,
  requestStepUpAuthentication,
} from '../../auth/oidc';
import {
  type DomainVerificationChallenge,
  type DomainVerificationResult,
  type Project,
  v2Api,
} from '../../services/v2Api';

interface DomainVerificationPanelProps {
  project: Project;
  canManage: boolean;
}

export const DomainVerificationPanel: React.FC<DomainVerificationPanelProps> = ({ project, canManage }) => {
  const [challenge, setChallenge] = useState<DomainVerificationChallenge | null>(null);
  const [result, setResult] = useState<DomainVerificationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleError = async (reason: unknown) => {
    if (reason instanceof StepUpAuthenticationRequiredError) {
      await requestStepUpAuthentication();
      return;
    }
    setError(reason instanceof Error ? reason.message : 'Domain verification failed');
  };

  const createChallenge = async () => {
    setBusy(true);
    setError(null);
    try {
      const nextChallenge = await v2Api.createDomainVerificationChallenge(project.id);
      setChallenge(nextChallenge);
      setResult(null);
    } catch (reason) {
      await handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await v2Api.verifyDomain(project.id, challenge.challenge_id));
    } catch (reason) {
      await handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setError('Clipboard access is unavailable; select and copy the value manually.');
    }
  };

  const verified = result?.status === 'verified';
  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-cyan-400" /> Domain ownership</h2>
          <p className="mt-1 text-sm text-slate-400">Prove control of <span className="font-mono text-slate-300">{project.canonical_domain}</span> with a short-lived DNS TXT challenge.</p>
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800 px-3 py-1 text-xs text-emerald-300"><Check className="h-3 w-3" /> Verified</span>
        ) : canManage && !challenge ? (
          <button type="button" disabled={busy} onClick={() => void createChallenge()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Start verification
          </button>
        ) : null}
      </div>
      {error && <div role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
      {!canManage && <p className="mt-4 text-sm text-slate-500">A project administrator with recent MFA must complete verification.</p>}
      {challenge && !verified && (
        <div className="mt-5 border-t border-slate-800 pt-5">
          <p className="mb-4 text-xs text-amber-300">This token is displayed only in this session and expires {new Date(challenge.expires_at).toLocaleString()}.</p>
          {[['Record name', challenge.dns_record_name], ['TXT value', challenge.dns_record_value]].map(([label, value]) => (
            <div key={label} className="mb-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span><button type="button" onClick={() => void copy(label, value)} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">{copied === label ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied === label ? 'Copied' : 'Copy'}</button></div>
              <code className="break-all text-sm text-slate-200">{value}</code>
            </div>
          ))}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy} onClick={() => void verify()} className="inline-flex items-center gap-2 rounded-lg border border-cyan-800 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-950/40 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Check DNS</button>
            {result && <span role="status" className="text-sm text-slate-400">Status: <strong className="text-slate-200">{result.status}</strong> · {result.attempt_count} attempt{result.attempt_count === 1 ? '' : 's'}</span>}
          </div>
        </div>
      )}
    </section>
  );
};
