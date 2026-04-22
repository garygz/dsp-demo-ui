import { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Box, Button, Card, CardContent, CircularProgress, TextField, Typography, Alert } from '@mui/material'
import { useAuth } from '../context/AuthContext'

const CenteredBox = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
})

const LoginCard = styled(Card)({
  width: 360,
})

const LoginCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(4),
}))

const LoginTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(3),
  textAlign: 'center',
}))

const LoginForm = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}))

const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
}))

export default function Login() {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    login(email, password)
  }

  return (
    <CenteredBox>
      <LoginCard>
        <LoginCardContent>
          <LoginTitle variant="h5">Sign in to DSP Demo</LoginTitle>
          <LoginForm component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <SubmitButton type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
            </SubmitButton>
          </LoginForm>
        </LoginCardContent>
      </LoginCard>
    </CenteredBox>
  )
}
