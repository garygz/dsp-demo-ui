import { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import {
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Button, Box,
  TablePagination
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

const LoadingBox = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  padding: 40,
})

const BoldHeaderCell = styled(TableCell)({
  fontWeight: 700,
})

const TruncatedCell = styled(TableCell)({
  maxWidth: 200,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

const AdvertiserSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

export default function CampaignManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([]) // [{ advertiser, campaigns }]
  const [pages, setPages] = useState({})   // { [advertiserId]: page }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const advertisersRes = await fetch('http://localhost:8080/advertisers', {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        if (advertisersRes.status === 403) throw new Error('Session expired. Please sign out and log in again.')
        if (!advertisersRes.ok) throw new Error(`Request failed: ${advertisersRes.status}`)
        const advertisers = await advertisersRes.json()

        const campaignLists = await Promise.all(
          advertisers.map((adv) =>
            fetch(`http://localhost:8080/advertisers/${adv.id}/campaigns`, {
              headers: { Authorization: `Bearer ${user.token}` },
            }).then((r) => {
              if (r.status === 403) throw new Error('Session expired. Please sign out and log in again.')
              if (!r.ok) throw new Error(`Request failed: ${r.status}`)
              return r.json()
            })
          )
        )
        setGroups(advertisers.map((adv, i) => ({ advertiser: adv, campaigns: campaignLists[i] })))
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

  const setPage = (advertiserId, page) =>
    setPages((prev) => ({ ...prev, [advertiserId]: page }))

  const renderError = () => {
    if (error === '') return null
    return <Alert severity="error">{error}</Alert>
  }

  const renderBody = () => {
    if (loading) return (
      <LoadingBox>
        <CircularProgress />
      </LoadingBox>
    )
    const totalCampaigns = groups.reduce((sum, g) => sum + g.campaigns.length, 0)
    if (groups.length === 0 || totalCampaigns === 0) return (
      <Typography color="text.secondary" padding={2}>No campaigns found.</Typography>
    )
    return groups.map(({ advertiser, campaigns }) => {
      const page = getPage(advertiser.id)
      const paginated = campaigns.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
      return (
        <AdvertiserSection key={advertiser.id}>
          <Typography variant="subtitle1" fontWeight={600}>Showing results for advertiser: {advertiser.name}</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <BoldHeaderCell>Name</BoldHeaderCell>
                  <BoldHeaderCell>Landing Page</BoldHeaderCell>
                  <BoldHeaderCell>Date Created</BoldHeaderCell>
                  <BoldHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name}</TableCell>
                    <TruncatedCell title={c.landingPage}>{c.landingPage}</TruncatedCell>
                    <TableCell>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        style={{ marginRight: 8 }}
                        onClick={() => navigate('/stats', { state: { advertiserId: advertiser.id, campaignId: c.id, advertiserName: advertiser.name, campaignName: c.name } })}
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
    })
  }

  return (
    <>
      <Typography variant="h5" gutterBottom>Campaign Management</Typography>
      {renderError()}
      {renderBody()}
    </>
  )
}
