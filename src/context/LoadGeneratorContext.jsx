import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { ENDPOINTS } from '../api/endpoints'

const CLICK_RATIO = 0.3
const AUTO_STOP_MS = 10 * 60 * 1000 // 10 minutes

const LoadGeneratorContext = createContext(null)

export function LoadGeneratorProvider({ children }) {
  const { user } = useAuth()

  const [advertiserId, setAdvertiserId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [rate, setRate] = useState(60)
  const [running, setRunning] = useState(false)
  const [impressionCount, setImpressionCount] = useState(0)
  const [clickCount, setClickCount] = useState(0)

  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  // Refs so the interval callback always sees current values without re-creating the interval
  const campaignIdRef = useRef(campaignId)
  const tokenRef = useRef(user?.token)

  useEffect(() => { campaignIdRef.current = campaignId }, [campaignId])
  useEffect(() => { tokenRef.current = user?.token }, [user?.token])

  const stop = useCallback(() => {
    setRunning(false)
    clearInterval(intervalRef.current)
    clearTimeout(timeoutRef.current)
  }, [])

  const start = useCallback(() => {
    setImpressionCount(0)
    setClickCount(0)
    setRunning(true)
  }, [])

  useEffect(() => {
    if (!running) return

    const fire = async () => {
      const impressionId = crypto.randomUUID()
      try {
        await fetch(ENDPOINTS.IMPRESSIONS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ id: impressionId, campaignId: campaignIdRef.current }),
        })
        setImpressionCount((n) => n + 1)

        if (Math.random() < CLICK_RATIO) {
          await fetch(ENDPOINTS.CLICKS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
            body: JSON.stringify({ id: crypto.randomUUID(), impressionId, campaignId: campaignIdRef.current }),
          })
          setClickCount((n) => n + 1)
        }
      } catch {
        // non-fatal, keep running
      }
    }

    const intervalMs = Math.round(60_000 / rate)
    intervalRef.current = setInterval(fire, intervalMs)
    timeoutRef.current = setTimeout(stop, AUTO_STOP_MS)

    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [running, rate, stop])

  return (
    <LoadGeneratorContext.Provider value={{
      advertiserId, setAdvertiserId,
      campaignId, setCampaignId,
      rate, setRate,
      running, start, stop,
      impressionCount, clickCount,
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
