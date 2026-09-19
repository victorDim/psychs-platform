import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthGate } from './auth/AuthGate'
import { ProductionApp } from './ProductionApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <ProductionApp />
    </AuthGate>
  </React.StrictMode>,
)
