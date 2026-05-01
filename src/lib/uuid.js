/**
 * UUID v4 generator that works in both secure (HTTPS) and non-secure (HTTP) contexts.
 *
 * crypto.randomUUID() requires a secure context and throws on plain HTTP.
 * crypto.getRandomValues() is available everywhere, including HTTP origins.
 */
export function randomUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback: manually construct a UUID v4 using getRandomValues()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant bits

  return [...bytes].map((b, i) =>
    ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0')
  ).join('')
}
