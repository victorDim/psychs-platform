import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { AuthGate } from './auth/AuthGate'
import { ProductionApp } from './ProductionApp'
import './index.css'

const legacyDemoEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_LEGACY_DEMO_UI === 'true'
const LegacyDemoApp = import.meta.env.DEV
  ? React.lazy(() => import('./App').then(({ App }) => ({ default: App })))
  : null

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {legacyDemoEnabled && LegacyDemoApp
      ? <Suspense fallback={null}><LegacyDemoApp /></Suspense>
      : (
        <AuthGate>
          <ProductionApp />
        </AuthGate>
      )}
  </React.StrictMode>,
)
