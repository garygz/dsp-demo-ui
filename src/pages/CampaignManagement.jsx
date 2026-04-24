import { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import {
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Button, Box,
  TablePagination
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ENDPOINTS } from '../api/endpoints'
import { apiFetch } from '../api/apiFetch'

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
        const advertisers = await apiFetch(ENDPOINTS.ADVERTISERS, user.token)

        const campaignLists = await Promise.all(
          advertisers.map((adv) => apiFetch(ENDPOINTS.CAMPAIGNS(adv.id), user.token))
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
      const startIx = page * PAGE_SIZE
      const endIx = startIx + PAGE_SIZE;
      const paginated = campaigns.slice(startIx, endIx);
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
