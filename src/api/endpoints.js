const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const ENDPOINTS = {
  LOGIN:          `${BASE}/auth/login`,
  DEV_LOGIN:      `${BASE}/auth/dev-login`,
  ADVERTISERS:    `${BASE}/advertisers`,
  CAMPAIGNS:      (advId) => `${BASE}/advertisers/${advId}/campaigns`,
  CAMPAIGN_STATS: (advId, campId, from, to) =>
    `${BASE}/advertisers/${advId}/campaigns/${campId}/stats?from=${from}&to=${to}`,
  CAMPAIGN_STATS_STREAM: (advId, campId, token) =>
    `${BASE}/advertisers/${advId}/campaigns/${campId}/stats/stream?token=${encodeURIComponent(token)}`,
  IMPRESSIONS:       `${BASE}/impressions`,
  CLICKS:            `${BASE}/clicks`,
  IMPRESSIONS_BATCH: `${BASE}/impressions/batch`,
  CLICKS_BATCH:      `${BASE}/clicks/batch`,
}
