const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const V1 = `${BASE}/v1`

export const ENDPOINTS = {
  LOGIN:          `${V1}/auth/login`,
  DEV_LOGIN:      `${V1}/auth/dev-login`,
  ADVERTISERS:    `${V1}/advertisers`,
  CAMPAIGNS:      (advId) => `${V1}/advertisers/${advId}/campaigns`,
  CAMPAIGN_STATS: (advId, campId, from, to) =>
    `${V1}/advertisers/${advId}/campaigns/${campId}/stats?from=${from}&to=${to}`,
  CAMPAIGN_STATS_STREAM: (advId, campId, token) =>
    `${V1}/advertisers/${advId}/campaigns/${campId}/stats/stream?token=${encodeURIComponent(token)}`,
  IMPRESSIONS:       `${V1}/impressions`,
  CLICKS:            `${V1}/clicks`,
  IMPRESSIONS_BATCH: `${V1}/impressions/batch`,
  CLICKS_BATCH:      `${V1}/clicks/batch`,
}
