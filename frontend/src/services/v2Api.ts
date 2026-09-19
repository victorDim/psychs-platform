import {
  AuthenticationRequiredError,
  getAccessToken,
  getUserManager,
  StepUpAuthenticationRequiredError,
} from '../auth/oidc';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const BASE_URL = (configuredBaseUrl || '/api/v2').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (response.status === 401) {
    await getUserManager().removeUser();
    throw new AuthenticationRequiredError('Your session has expired');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 403 && body?.detail === 'step_up_authentication_required') {
      throw new StepUpAuthenticationRequiredError();
    }
    throw new ApiError(response.status, body?.detail || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  canonical_domain: string;
  description?: string;
  created_at: string;
}

export interface ProjectCreate {
  name: string;
  slug: string;
  canonical_domain: string;
  description?: string;
}

export interface AuthoritativeSource {
  id: string;
  project_id: string;
  canonical_url: string;
  source_type: string;
  owner_label: string;
  snapshot_policy: string;
  verification_status: string;
  created_at: string;
}

export interface EvidenceObservation {
  id: string;
  project_id: string;
  evidence_class: 'observed';
  provider: string;
  model_identifier: string;
  provider_request_id?: string;
  collection_job_id?: string;
  prompt_text: string;
  response_text: string;
  citations: string[];
  observed_at: string;
  content_hash: string;
  retention_expires_at: string;
  created_at: string;
}

export interface ProductionJob {
  id: string;
  project_id: string;
  job_type: 'domain_verification' | 'evidence_collection';
  status: 'queued' | 'running' | 'retry_wait' | 'succeeded' | 'dead_letter' | 'cancelled';
  priority: number;
  result?: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
  available_at: string;
  cancellation_requested_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface EvidenceRetentionEvent {
  id: string;
  deleted_count: number;
  retention_cutoff: string;
  oldest_observed_at: string;
  newest_observed_at: string;
  executed_at: string;
}

export interface DomainVerificationChallenge {
  challenge_id: string;
  domain: string;
  verification_method: 'dns_txt';
  dns_record_name: string;
  dns_record_value: string;
  expires_at: string;
}

export interface DomainVerificationResult {
  challenge_id: string;
  status: 'pending' | 'verified' | 'expired' | 'superseded' | 'failed';
  attempt_count: number;
  last_checked_at?: string;
  verified_at?: string;
  expires_at: string;
}

export const v2Api = {
  listProjects: () => request<Project[]>('/projects'),
  createProject: (project: ProjectCreate) => request<Project>('/projects', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(project),
  }),
  listSources: (projectId: string) => request<AuthoritativeSource[]>(`/projects/${encodeURIComponent(projectId)}/sources`),
  listEvidence: (projectId: string) => request<EvidenceObservation[]>(`/projects/${encodeURIComponent(projectId)}/evidence-observations`),
  listRetentionEvents: () => request<EvidenceRetentionEvent[]>('/evidence-retention-events'),
  enqueueEvidenceCollection: (projectId: string, prompt: string) =>
    request<ProductionJob>(`/projects/${encodeURIComponent(projectId)}/evidence-collection-jobs`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ prompt }),
    }),
  getJob: (jobId: string) => request<ProductionJob>(`/jobs/${encodeURIComponent(jobId)}`),
  createDomainVerificationChallenge: (projectId: string) =>
    request<DomainVerificationChallenge>(`/projects/${encodeURIComponent(projectId)}/domain-verification-challenges`, {
      method: 'POST',
    }),
  verifyDomain: (projectId: string, challengeId: string) =>
    request<DomainVerificationResult>(`/projects/${encodeURIComponent(projectId)}/domain-verification-challenges/${encodeURIComponent(challengeId)}/verify`, {
      method: 'POST',
    }),
  createSource: (projectId: string, source: Pick<AuthoritativeSource, 'canonical_url' | 'source_type' | 'owner_label' | 'snapshot_policy'>) =>
    request<AuthoritativeSource>(`/projects/${encodeURIComponent(projectId)}/sources`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(source),
    }),
};
