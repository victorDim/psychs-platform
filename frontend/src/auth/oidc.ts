import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

export class AuthenticationRequiredError extends Error {
  constructor(message = 'An authenticated session is required') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

export class StepUpAuthenticationRequiredError extends Error {
  constructor(message = 'Additional authentication is required for this action') {
    super(message);
    this.name = 'StepUpAuthenticationRequiredError';
  }
}

let manager: UserManager | undefined;

function requiredEnvironmentValue(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name} is required for the production frontend`);
  return normalized;
}

function buildSettings(): UserManagerSettings {
  const authority = requiredEnvironmentValue('VITE_OIDC_AUTHORITY', import.meta.env.VITE_OIDC_AUTHORITY);
  const clientId = requiredEnvironmentValue('VITE_OIDC_CLIENT_ID', import.meta.env.VITE_OIDC_CLIENT_ID);
  const authorityUrl = new URL(authority);
  if (authorityUrl.protocol !== 'https:' && !(import.meta.env.DEV && authorityUrl.hostname === 'localhost')) {
    throw new Error('VITE_OIDC_AUTHORITY must use HTTPS outside local development');
  }

  const scope = (import.meta.env.VITE_OIDC_SCOPE || 'openid profile email offline_access projects:read projects:write').trim();
  if (!scope.split(/\s+/).includes('openid')) throw new Error('VITE_OIDC_SCOPE must include openid');

  const settings: UserManagerSettings = {
    authority: authorityUrl.toString().replace(/\/$/, ''),
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: window.location.origin,
    response_type: 'code',
    scope,
    automaticSilentRenew: true,
    monitorSession: false,
    loadUserInfo: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  };

  const audience = import.meta.env.VITE_OIDC_AUDIENCE?.trim();
  if (audience) settings.extraQueryParams = { audience };
  return settings;
}

export function getUserManager(): UserManager {
  if (!manager) manager = new UserManager(buildSettings());
  return manager;
}

export function getAuthenticationConfigurationError(): string | null {
  try {
    getUserManager();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid OIDC configuration';
  }
}

export async function getAccessToken(): Promise<string> {
  const user = await getUserManager().getUser();
  if (!user || user.expired || !user.access_token) throw new AuthenticationRequiredError();
  return user.access_token;
}

export async function requestStepUpAuthentication(): Promise<void> {
  const acrValues = import.meta.env.VITE_OIDC_STEP_UP_ACR_VALUES?.trim();
  await getUserManager().signinRedirect({
    extraQueryParams: {
      prompt: 'login',
      max_age: 0,
      ...(acrValues ? { acr_values: acrValues } : {}),
    },
  });
}
