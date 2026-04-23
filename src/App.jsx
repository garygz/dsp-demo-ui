import { styled } from '@mui/material/styles'
import { Container, Box, Typography, Button, Divider, Stack, Avatar, Tooltip, Tabs, Tab, CircularProgress } from '@mui/material'
import { AccountCircle } from '@mui/icons-material'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './components/Login'
import CampaignManagement from './pages/CampaignManagement'
import CampaignStats from './pages/CampaignStats'

const CenteredBox = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
})

const PageContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
}))

const PageContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  gap: 24,
})

const Header = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
})

const Title = styled(Typography)({
  fontWeight: 500,
  letterSpacing: -1,
})

const UserStack = styled(Stack)({
  alignItems: 'center',
})

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: theme.palette.primary.main,
}))

const ROUTES = [
  { label: 'Campaign Management', path: '/' },
  { label: 'Campaign Stats', path: '/stats' },
]

export default function App() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (loading) return (
    <CenteredBox>
      <CircularProgress />
    </CenteredBox>
  )

  if (!user) return <Login />

  return (
    <PageContainer maxWidth="lg">
      <PageContent>
        <Header>
          <Title variant="h4">DSP Demo</Title>
          <UserStack direction="row" spacing={2}>
            <Tooltip title={user.email}>
              <Stack direction="row" spacing={1} alignItems="center">
                <UserAvatar>
                  <AccountCircle fontSize="small" />
                </UserAvatar>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Stack>
            </Tooltip>
            <Button variant="outlined" size="small" onClick={logout}>Sign out</Button>
          </UserStack>
        </Header>

        <Tabs value={pathname} onChange={(_, path) => navigate(path)}>
          {ROUTES.map(({ label, path }) => (
            <Tab key={path} label={label} value={path} />
          ))}
        </Tabs>

        <Divider />

        <Routes>
          <Route path="/" element={<CampaignManagement />} />
          <Route path="/stats" element={<CampaignStats />} />
        </Routes>

      </PageContent>
    </PageContainer>
  )
}
