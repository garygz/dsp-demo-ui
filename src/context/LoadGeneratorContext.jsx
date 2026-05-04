import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { ENDPOINTS } from '../api/endpoints'
import { apiFetch } from '../api/apiFetch'
import { captureError } from '../lib/sentry'
import { randomUUID } from '../lib/uuid'

const CLICK_RATIO = 0.3
const AUTO_STOP_MS = 10 * 60 * 1000 // 10 minutes
const BATCH_INTERVAL_MS = 5_000

const LoadGeneratorContext = createContext(null)

export function LoadGeneratorProvider({ children }) {
  const { user } = useAuth()

  const [rate, setRate] = useState(200)
  const [running, setRunning] = useState(false)

  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const campaignIdRef = useRef('')
  const tokenRef = useRef(user?.token)
  const onImpressionRef = useRef(null)
  const onClickRef = useRef(null)
  const impressionTotalRef = useRef(0)
  const clickTotalRef = useRef(0)

  useEffect(() => { tokenRef.current = user?.token }, [user?.token])

  const stop = useCallback(() => {
    setRunning(false)
    clearInterval(intervalRef.current)
    clearTimeout(timeoutRef.current)
  }, [])

  const registerCallbacks = useCallback(({ onImpression, onClick }) => {
    onImpressionRef.current = onImpression ?? null
    onClickRef.current = onClick ?? null
  }, [])

  const start = useCallback((campaignId) => {
    campaignIdRef.current = campaignId
    impressionTotalRef.current = 0
    clickTotalRef.current = 0
    setRunning(true)
  }, [])

  const getCounts = useCallback(() => ({
    impressions: impressionTotalRef.current,
    clicks: clickTotalRef.current,
  }), [])

  useEffect(() => {
    if (!running) return

    const fire = async () => {
      const campaignId = campaignIdRef.current
      const batchSize  = Math.max(1, Math.round(rate * BATCH_INTERVAL_MS / 60_000))

      const impressionsBatch = Array.from({ length: batchSize }, () => ({
        id: randomUUID(),
        campaignId,
      }))

      const clicksBatch = impressionsBatch
        .filter(() => Math.random() < CLICK_RATIO)
        .map(({ id: impressionId }) => ({
          id: randomUUID(),
          impressionId,
          campaignId,
        }))

      try {
        await apiFetch(ENDPOINTS.IMPRESSIONS_BATCH, tokenRef.current, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(impressionsBatch),
        })
        impressionTotalRef.current += impressionsBatch.length
        impressionsBatch.forEach(() => onImpressionRef.current?.())

        if (clicksBatch.length > 0) {
          await apiFetch(ENDPOINTS.CLICKS_BATCH, tokenRef.current, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clicksBatch),
          })
          clickTotalRef.current += clicksBatch.length
          clicksBatch.forEach(() => onClickRef.current?.())
        }
      } catch (err) {
        captureError(err, { context: 'LoadGeneratorContext', action: 'fire' })
        console.error('[LoadGenerator] batch failed:', err.message)
      }
    }

    fire()
    intervalRef.current = setInterval(fire, BATCH_INTERVAL_MS)
    timeoutRef.current = setTimeout(stop, AUTO_STOP_MS)

    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [running, rate, stop])

  return (
    <LoadGeneratorContext.Provider value={{
      rate, setRate,
      running, start, stop, registerCallbacks, getCounts,
    }}>
      {children}
    </LoadGeneratorContext.Provider>
  )
}

export function useLoadGenerator() {
  const ctx = useContext(LoadGeneratorContext)
  if (!ctx) throw new Error('useLoadGenerator must be used within LoadGeneratorProvider')
  return ctx
}
