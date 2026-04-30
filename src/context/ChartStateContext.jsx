import { createContext, useContext, useState } from 'react'

const ChartStateContext = createContext(null)

export function ChartStateProvider({ children }) {
  const [live, setLive] = useState(false)
  const [range, setRange] = useState(7)

  // Persisted live data — survives navigation
  const [liveImpressions, setLiveImpressions] = useState([])
  const [liveClicks, setLiveClicks] = useState([])
  const [liveCampaignId, setLiveCampaignId] = useState(null)

  return (
    <ChartStateContext.Provider value={{
      live, setLive,
      range, setRange,
      liveImpressions, setLiveImpressions,
      liveClicks, setLiveClicks,
      liveCampaignId, setLiveCampaignId,
    }}>
      {children}
    </ChartStateContext.Provider>
  )
}

export function useChartState() {
  const ctx = useContext(ChartStateContext)
  if (!ctx) throw new Error('useChartState must be used within ChartStateProvider')
  return ctx
}
