import { AuthenticationRequiredError, getAccessToken, getUserManager } from '../auth/oidc';

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

export const v2Api = {
  listProjects: () => request<Project[]>('/projects'),
  listSources: (projectId: string) => request<AuthoritativeSource[]>(`/projects/${encodeURIComponent(projectId)}/sources`),
  createSource: (projectId: string, source: Pick<AuthoritativeSource, 'canonical_url' | 'source_type' | 'owner_label' | 'snapshot_policy'>) =>
    request<AuthoritativeSource>(`/projects/${encodeURIComponent(projectId)}/sources`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(source),
    }),
};
