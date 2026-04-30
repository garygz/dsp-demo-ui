import { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChartState } from '../context/ChartStateContext'
import { ENDPOINTS } from '../api/endpoints'
import { apiFetch } from '../api/apiFetch'
import { captureError } from '../lib/sentry'
import TimeseriesChart from '../charts/TimeseriesChart'

export default function CampaignStats() {
  const { state } = useLocation()
  const { user } = useAuth()
  const {
    setLive, setRange,
    liveCampaignId,
    lastAdvertiserId, setLastAdvertiserId,
    lastAdvertiserName, setLastAdvertiserName,
    lastCampaignName, setLastCampaignName,
  } = useChartState()

  // Restore from context when navigating back via tab (no route state)
  const [advertiserId, setAdvertiserId] = useState(state?.advertiserId ?? lastAdvertiserId ?? null)
  const [campaignId, setCampaignId] = useState(state?.campaignId ?? liveCampaignId ?? null)
  const [advertiserName, setAdvertiserName] = useState(state?.advertiserName ?? lastAdvertiserName ?? null)
  const [campaignName, setCampaignName] = useState(state?.campaignName ?? lastCampaignName ?? null)

  // When navigating here from Load Generator, switch chart into live mode
  useEffect(() => {
    if (state?.initialLive) {
      setLive(true)
      setRange(1)
    }
  }, [])

  // Persist selection to context so it survives tab navigation
  useEffect(() => {
    if (advertiserId) setLastAdvertiserId(advertiserId)
  }, [advertiserId])

  useEffect(() => {
    if (advertiserName) setLastAdvertiserName(advertiserName)
  }, [advertiserName])

  useEffect(() => {
    if (campaignName) setLastCampaignName(campaignName)
  }, [campaignName])

  useEffect(() => {
    if (advertiserId && campaignId) return

    const resolveDefault = async () => {
      try {
        const advertisers = await apiFetch(ENDPOINTS.ADVERTISERS, user.token)
        if (!advertisers?.length) return

        const firstAdv = advertisers[0]
        const campaigns = await apiFetch(ENDPOINTS.CAMPAIGNS(firstAdv.id), user.token)
        if (!campaigns?.length) return

        setAdvertiserId(firstAdv.id)
        setCampaignId(campaigns[0].id)
        setAdvertiserName(firstAdv.name)
        setCampaignName(campaigns[0].name)
      } catch (err) {
        captureError(err, { page: 'CampaignStats', action: 'resolveDefault' })
        // leave chart in fallback random-data mode
      }
    }

    resolveDefault()
  }, [])

  return (
    <>
      <Typography variant="h5" gutterBottom>Campaign Stats</Typography>
      {advertiserName && campaignName && (
        <Typography variant="subtitle2" color="text.secondary">
          {advertiserName} — {campaignName}
        </Typography>
      )}
      <TimeseriesChart advertiserId={advertiserId} campaignId={campaignId} />
    </>
  )
}
