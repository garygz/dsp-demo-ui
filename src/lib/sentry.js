import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return // no-op in local dev unless DSN is set

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Capture 100% of transactions in production; tune down under load
    tracesSampleRate: 1.0,
    // Don't send noise: aborted fetches and session expiry are expected
    beforeSend(event, hint) {
      const err = hint?.originalException
      if (!err) return event
      if (err.name === 'AbortError') return null
      if (err.message?.includes('Session expired')) return null
      return event
    },
  })
}

/**
 * Report a caught error with optional structured context.
 * Safe to call even if Sentry was not initialized (no DSN in dev).
 */
export function captureError(err, context = {}) {
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v))
    Sentry.captureException(err)
  })
}
