import { captureError } from '../lib/sentry'

const SESSION_EXPIRED = 'Session expired. Please sign out and log in again.'

export async function apiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (res.status === 403) throw new Error(SESSION_EXPIRED)
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`)
    captureError(err, { url, status: res.status })
    throw err
  }
  // Return null for empty responses (e.g. 201 No Content)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
