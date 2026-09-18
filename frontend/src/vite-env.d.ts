/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_OIDC_AUTHORITY?: string
  readonly VITE_OIDC_CLIENT_ID?: string
  readonly VITE_OIDC_AUDIENCE?: string
  readonly VITE_OIDC_SCOPE?: string
  readonly VITE_ENABLE_LEGACY_DEMO_UI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
