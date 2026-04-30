import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { initSentry } from './lib/sentry'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

initSentry()

const SentryBoundary = Sentry.ErrorBoundary

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SentryBoundary fallback={<p>Something went wrong. The error has been reported.</p>} showDialog>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </SentryBoundary>
  </StrictMode>,
)
