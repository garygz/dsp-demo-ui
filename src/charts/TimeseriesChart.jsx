import { useEffect, useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import { LineChart } from '@mui/x-charts/LineChart'
import { Alert, Box, Card, CardContent, CircularProgress, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../api/endpoints'

const LIVE_INTERVAL_MS = 60_000

const generateSeries = (days, baseOffset = 0, phaseShift = 0) => {
  const now = Date.now()
  const msPerDay = 86400000
  const points = days * 24
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - i) * (msPerDay / 24)
    const base = 50 + baseOffset + 20 * Math.sin((i / points) * 2 * Math.PI + phaseShift)
    const noise = (Math.random() - 0.5) * 10
    return { date: new Date(t), value: +(base + noise).toFixed(2) }
  })
}

const toDateParam = (daysAgo) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

const RANGES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
]

const ChartCard = styled(Card)({
  width: '80vw',
  maxWidth: 900,
})

const ChartHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

const RangeControls = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})

const UtcLabel = styled(Typography)({
  fontWeight: 500,
})

const LiveDot = styled('span')(({ theme }) => ({
  display: 'inline-block',
  width: 7,
  height: 7,
  borderRadius: '50%',
  backgroundColor: theme.palette.error.main,
  marginRight: 4,
  animation: 'pulse 1.4s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.3 },
  },
}))

const chartWrapperStyle = { position: 'relative', width: '100%' }

const LoadingOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1,
})

const ErrorAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}))

export default function TimeseriesChart({ advertiserId, campaignId }) {
  const { user } = useAuth()
  const [range, setRange] = useState(7)
  const [live, setLive] = useState(false)
  const [impressions, setImpressions] = useState([])
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chartWidth, setChartWidth] = useState(600)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setChartWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!advertiserId || !campaignId) return

    const fetchData = async (signal) => {
      setLoading(true)
      setError('')
      try {
        const from = toDateParam(range)
        const to = toDateParam(0)
        const r = await fetch(
          ENDPOINTS.CAMPAIGN_STATS(advertiserId, campaignId, from, to),
          { headers: { Authorization: `Bearer ${user.token}` }, signal }
        )
        if (r.status === 403) throw new Error('Session expired. Please sign out and log in again.')
        if (!r.ok) throw new Error(`Request failed: ${r.status}`)
        const { impressionsPerDay, clicksPerDay } = await r.json()
        setImpressions(impressionsPerDay.map((d) => ({ date: new Date(d.date), value: d.count })))
        setClicks(clicksPerDay.map((d) => ({ date: new Date(d.date), value: d.count })))
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    const controller = new AbortController()
    fetchData(controller.signal)

    let interval = null
    if (live) {
      interval = setInterval(() => fetchData(new AbortController().signal), LIVE_INTERVAL_MS)
    }

    return () => {
      controller.abort()
      if (interval) clearInterval(interval)
    }
  }, [advertiserId, campaignId, range, live])

  const handleRangeChange = (_, value) => {
    if (!value) return
    setRange(value)
    setLive(false)
  }

  const handleLiveToggle = () => {
    setLive((prev) => {
      if (!prev) setRange(1)
      return !prev
    })
  }

  const renderError = () => {
    if (error === '') return null
    return <ErrorAlert severity="error">{error}</ErrorAlert>
  }

  const fallback1 = generateSeries(range, 0, 0)
  const fallback2 = generateSeries(range, -10, Math.PI / 2)
  const impData = impressions.length ? impressions : fallback1
  const clickData = clicks.length ? clicks : fallback2

  return (
    <ChartCard>
      <CardContent>
        <ChartHeader>
          <Typography variant="h6">Campaign Stats</Typography>
          <RangeControls>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={live ? null : range}
              onChange={handleRangeChange}
            >
              {RANGES.map(({ label, days }) => (
                <ToggleButton key={days} value={days}>{label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ToggleButton
              size="small"
              value="live"
              selected={live}
              onChange={handleLiveToggle}
            >
              {live && <LiveDot />}Live
            </ToggleButton>
            <UtcLabel variant="caption" color="text.secondary">UTC</UtcLabel>
          </RangeControls>
        </ChartHeader>
        {renderError()}
        <div ref={containerRef} style={chartWrapperStyle}>
          {loading && (
            <LoadingOverlay>
              <CircularProgress size={28} />
            </LoadingOverlay>
          )}
          <LineChart
            width={chartWidth}
            xAxis={[{
              data: impData.map((d) => d.date),
              scaleType: 'time',
              valueFormatter: (v) =>
                new Date(v).toLocaleString(undefined, {
                  month: 'short', day: 'numeric',
                  hour: range === 1 ? '2-digit' : undefined,
                  minute: range === 1 ? '2-digit' : undefined,
                }),
            }]}
            series={[
              { data: impData.map((d) => d.value), label: 'Impressions', showMark: false },
              { data: clickData.map((d) => d.value), label: 'Clicks', showMark: false },
            ]}
            height={300}
          />
        </div>
      </CardContent>
    </ChartCard>
  )
}
