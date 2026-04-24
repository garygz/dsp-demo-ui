import { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import {
  Typography, Box, Card, CardContent, Button, Slider,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Alert, Chip
} from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { useLoadGenerator } from '../context/LoadGeneratorContext'
import { ENDPOINTS } from '../api/endpoints'
import { apiFetch } from '../api/apiFetch'

const ControlCard = styled(Card)({ maxWidth: 600 })

const ControlRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1),
}))

const StatsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}))

const StatChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.9rem',
  padding: theme.spacing(0.5),
}))

export default function LoadGenerator() {
  const { user } = useAuth()
  const { rate, setRate, running, start, stop, registerCallbacks, getCounts } = useLoadGenerator()

  const [advertiserId, setAdvertiserId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [advertisers, setAdvertisers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [error, setError] = useState('')
  const [impressionCount, setImpressionCount] = useState(0)
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const { impressions, clicks } = getCounts()
    setImpressionCount(impressions)
    setClickCount(clicks)
    registerCallbacks({
      onImpression: () => setImpressionCount((n) => n + 1),
      onClick: () => setClickCount((n) => n + 1),
    })
    return () => registerCallbacks({ onImpression: null, onClick: null })
  }, [registerCallbacks, getCounts])

  useEffect(() => {
    const fetchAdvertisers = async () => {
      try {
        const data = await apiFetch(ENDPOINTS.ADVERTISERS, user.token)
        setAdvertisers(data)
        if (!advertiserId && data.length > 0) setAdvertiserId(data[0].id)
      } catch (err) {
        setError(err.message)
      }
    }
    fetchAdvertisers()
  }, [])

  useEffect(() => {
    if (!advertiserId) return
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true)
      setCampaigns([])
      try {
        const data = await apiFetch(ENDPOINTS.CAMPAIGNS(advertiserId), user.token)
        setCampaigns(data)
        if (!campaignId && data.length > 0) setCampaignId(data[0].id)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingCampaigns(false)
      }
    }
    fetchCampaigns()
  }, [advertiserId])

  const renderError = () => {
    if (error === '') return null
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h5" gutterBottom>Load Generator</Typography>
      {renderError()}

      <ControlCard>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={3}>
            <ControlRow>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Advertiser</InputLabel>
                <Select
                  value={advertiserId}
                  label="Advertiser"
                  onChange={(e) => setAdvertiserId(e.target.value)}
                  disabled={running}
                >
                  {advertisers.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Campaign</InputLabel>
                <Select
                  value={campaignId}
                  label="Campaign"
                  onChange={(e) => setCampaignId(e.target.value)}
                  disabled={running || loadingCampaigns}
                  endAdornment={loadingCampaigns ? <CircularProgress size={16} /> : null}
                >
                  {campaigns.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ControlRow>

            <Box>
              <Typography variant="body2" gutterBottom>
                Rate: <strong>{rate} impressions / min</strong>
              </Typography>
              <Slider
                value={rate}
                min={10}
                max={500}
                step={10}
                onChange={(_, v) => setRate(v)}
                disabled={running}
                marks={[
                  { value: 10, label: '10' },
                  { value: 500, label: '500' },
                ]}
              />
            </Box>

            <ControlRow>
              <Button
                variant="contained"
                color={running ? 'error' : 'primary'}
                onClick={running ? stop : () => {
                  setImpressionCount(0)
                  setClickCount(0)
                  start(campaignId)
                }}
                disabled={!campaignId}
                size="large"
              >
                {running ? 'Stop' : 'Start'}
              </Button>
              {running && <CircularProgress size={24} />}
              {running && (
                <Typography variant="caption" color="text.secondary">
                  Batched · 5 sec intervals · Auto-stops after 10 min
                </Typography>
              )}
            </ControlRow>

            {(impressionCount > 0 || clickCount > 0) && (
              <StatsRow>
                <StatChip label={`Impressions sent: ${impressionCount}`} color="primary" variant="outlined" />
                <StatChip label={`Clicks sent: ${clickCount}`} color="secondary" variant="outlined" />
                <StatChip
                  label={`CTR: ${impressionCount > 0 ? ((clickCount / impressionCount) * 100).toFixed(1) : 0}%`}
                  variant="outlined"
                />
              </StatsRow>
            )}
          </Box>
        </CardContent>
      </ControlCard>
    </Box>
  )
}
