import { styled } from '@mui/material/styles'
import { Container, Box, Typography, Button, Divider, Stack, Chip, CircularProgress, Avatar, Tooltip } from '@mui/material'
import { AccountCircle } from '@mui/icons-material'
import TimeseriesChart from './charts/TimeseriesChart.jsx'
import { useAuth } from './context/AuthContext'
import Login from './components/Login'

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
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(6),
}))

const PageContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 24,
  flexGrow: 1,
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

export default function App() {
  const { user, loading, logout } = useAuth()

  if (loading) return (
    <CenteredBox>
      <CircularProgress />
    </CenteredBox>
  )

  if (!user) return <Login />

  return (
    <PageContainer maxWidth="md">
      <PageContent>
        <Header>
          <Title variant="h3">DSP Demo</Title>
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

        <TimeseriesChart />

        <Divider flexItem />

      </PageContent>
    </PageContainer>
  )
}
