import { styled } from '@mui/material/styles'
import { Container, Box, Typography, Button, Divider, Stack, Avatar, Tooltip, Tabs, Tab, CircularProgress } from '@mui/material'
import { AccountCircle } from '@mui/icons-material'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LoadGeneratorProvider, useLoadGenerator } from './context/LoadGeneratorContext'
import Login from './components/Login'
import CampaignManagement from './pages/CampaignManagement'
import CampaignStats from './pages/CampaignStats'
import LoadGenerator from './pages/LoadGenerator'

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

const LiveDot = styled('span')(({ theme }) => ({
  display: 'inline-block',
  width: 7,
  height: 7,
  borderRadius: '50%',
  backgroundColor: theme.palette.error.main,
  marginRight: 6,
  verticalAlign: 'middle',
  animation: 'pulse 1.4s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.2 },
  },
}))

const ROUTES = [
  { label: 'Campaign Management', path: '/' },
  { label: 'Campaign Stats', path: '/stats' },
  { label: 'Load Generator', path: '/load' },
]

function AppShell() {
  const { user, logout } = useAuth()
  const { running } = useLoadGenerator()
  const navigate = useNavigate()
  const { pathname } = useLocation()

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
            <Tab
              key={path}
              value={path}
              label={
                path === '/load' && running
                  ? <span><LiveDot />Load Generator</span>
                  : label
              }
            />
          ))}
        </Tabs>

        <Divider />

        <Routes>
          <Route path="/" element={<CampaignManagement />} />
          <Route path="/stats" element={<CampaignStats />} />
          <Route path="/load" element={<LoadGenerator />} />
        </Routes>
      </PageContent>
    </PageContainer>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return (
    <CenteredBox>
      <CircularProgress />
    </CenteredBox>
  )
  if (!user) return <Login />
  return (
    <LoadGeneratorProvider>
      <AppShell />
    </LoadGeneratorProvider>
  )
}
