import { useEffect, useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import {
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Button, Box,
  TablePagination, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../api/endpoints'
import { apiFetch } from '../api/apiFetch'

const PAGE_SIZE = 10
const STORAGE_KEY = 'campaign-column-widths'
const DEFAULT_WIDTHS = { name: 220, landingPage: 300, createdAt: 140, actions: 160 }

// ── Column width persistence ──────────────────────────────────────────────────

function useColumnWidths() {
  const [widths, setWidths] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULT_WIDTHS, ...JSON.parse(stored) } : DEFAULT_WIDTHS
    } catch {
      return DEFAULT_WIDTHS
    }
  })

  const updateWidth = (col, width) => {
    setWidths((prev) => {
      const next = { ...prev, [col]: Math.max(60, width) }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { widths, updateWidth }
}

// ── Resize handle logic ───────────────────────────────────────────────────────

function useResizeColumn(col, updateWidth) {
  const startX = useRef(null)
  const startWidth = useRef(null)

  return (e, currentWidth) => {
    e.preventDefault()
    startX.current = e.clientX
    startWidth.current = currentWidth

    const onMouseMove = (e) => updateWidth(col, startWidth.current + e.clientX - startX.current)
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
}

// ── Styled components ─────────────────────────────────────────────────────────

const LoadingBox = styled('div')({ display: 'flex', justifyContent: 'center', padding: 40 })

const AdvertiserSection = styled(Box)(({ theme }) => ({
  display: 'flex', flexDirection: 'column', gap: theme.spacing(1),
}))

const ResizableHeaderCell = styled(TableCell)({
  fontWeight: 700, position: 'relative', userSelect: 'none',
  overflow: 'hidden', whiteSpace: 'nowrap',
})

const ResizeHandle = styled('div')({
  position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
  cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
  '&::after': {
    content: '""', width: 2, height: '60%',
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1,
  },
  '&:hover::after': { backgroundColor: 'rgba(0,0,0,0.5)' },
})

function ColHeader({ label, colKey, width, updateWidth }) {
  const onMouseDown = useResizeColumn(colKey, updateWidth)
  return (
    <ResizableHeaderCell style={{ width, minWidth: width }}>
      {label}
      <ResizeHandle onMouseDown={(e) => onMouseDown(e, width)} />
    </ResizableHeaderCell>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CampaignManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { widths, updateWidth } = useColumnWidths()
  const [groups, setGroups] = useState([])
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState(null)
  const [pages, setPages] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const advertisers = await apiFetch(ENDPOINTS.ADVERTISERS, user.token)
        const campaignLists = await Promise.all(
          advertisers.map((adv) => apiFetch(ENDPOINTS.CAMPAIGNS(adv.id), user.token))
        )
        const loaded = advertisers.map((adv, i) => ({ advertiser: adv, campaigns: campaignLists[i] }))
        setGroups(loaded)
        if (loaded.length > 0) setSelectedAdvertiserId(loaded[0].advertiser.id)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const archiveCampaign = (advertiserId, campaignId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.advertiser.id === advertiserId
          ? { ...g, campaigns: g.campaigns.filter((c) => c.id !== campaignId) }
          : g
      )
    )
  }

  const getPage = (advertiserId) => pages[advertiserId] ?? 0
  const setPage = (advertiserId, page) => setPages((prev) => ({ ...prev, [advertiserId]: page }))

  const renderBody = () => {
    if (loading) return <LoadingBox><CircularProgress /></LoadingBox>

    if (groups.length === 0) return (
      <Typography color="text.secondary" padding={2}>No campaigns found.</Typography>
    )

    const activeGroup = groups.find((g) => g.advertiser.id === selectedAdvertiserId)
    if (!activeGroup) return null

    const { advertiser, campaigns } = activeGroup
    const page = getPage(advertiser.id)
    const paginated = campaigns.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

    return (
      <AdvertiserSection>
        <TableContainer component={Paper}>
          <Table size="small" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: widths.name }} />
              <col style={{ width: widths.landingPage }} />
              <col style={{ width: widths.createdAt }} />
              <col style={{ width: widths.actions }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <ColHeader label="Name"         colKey="name"        width={widths.name}        updateWidth={updateWidth} />
                <ColHeader label="Landing Page" colKey="landingPage"  width={widths.landingPage}  updateWidth={updateWidth} />
                <ColHeader label="Date Created" colKey="createdAt"   width={widths.createdAt}   updateWidth={updateWidth} />
                <ResizableHeaderCell style={{ width: widths.actions }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </TableCell>
                  <TableCell title={c.landingPage} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.landingPage}
                  </TableCell>
                  <TableCell>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      style={{ marginRight: 8 }}
                      onClick={() => navigate('/stats', {
                        state: {
                          advertiserId: advertiser.id,
                          campaignId: c.id,
                          advertiserName: advertiser.name,
                          campaignName: c.name,
                        }
                      })}
                    >
                      Stats
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={() => archiveCampaign(advertiser.id, c.id)}
                    >
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={campaigns.length}
            page={page}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            onPageChange={(_, newPage) => setPage(advertiser.id, newPage)}
          />
        </TableContainer>
      </AdvertiserSection>
    )
  }

  return (
    <>
      <Typography variant="h5" gutterBottom>Campaign Management</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {groups.length > 1 && (
        <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
          <InputLabel>Advertiser</InputLabel>
          <Select
            value={selectedAdvertiserId ?? ''}
            label="Advertiser"
            onChange={(e) => setSelectedAdvertiserId(e.target.value)}
          >
            {groups.map(({ advertiser }) => (
              <MenuItem key={advertiser.id} value={advertiser.id}>{advertiser.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {renderBody()}
    </>
  )
}
