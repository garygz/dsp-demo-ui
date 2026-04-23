const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const ENDPOINTS = {
  LOGIN:          `${BASE}/auth/login`,
  DEV_LOGIN:      `${BASE}/auth/dev-login`,
  ADVERTISERS:    `${BASE}/advertisers`,
  CAMPAIGNS:      (advId) => `${BASE}/advertisers/${advId}/campaigns`,
  CAMPAIGN_STATS: (advId, campId, from, to) =>
    `${BASE}/advertisers/${advId}/campaigns/${campId}/stats?from=${from}&to=${to}`,
  IMPRESSIONS:    `${BASE}/impressions`,
  CLICKS:         `${BASE}/clicks`,
}
