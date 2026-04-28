import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Simple consumer that exposes context values through the DOM
function TestConsumer() {
  const { user, error, login, logout, loading } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <button onClick={() => login('test@test.com', 'DspDemoTest!')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

function renderAuth() {
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
    global.fetch = vi.fn()
  })

  it('restores session from sessionStorage without a fetch call', async () => {
    sessionStorage.setItem('user', JSON.stringify({ email: 'stored@test.com', token: 'tok' }))

    renderAuth()

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'))
    expect(screen.getByTestId('user').textContent).toBe('stored@test.com')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sets user after a successful login', async () => {
    // Suppress dev-login attempt (running in jsdom where hostname is localhost)
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // dev-login unavailable
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'jwt-xyz' }) }) // login

    renderAuth()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'))

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('test@test.com')
    )
    expect(JSON.parse(sessionStorage.getItem('user')).email).toBe('test@test.com')
  })

  it('sets error on failed login', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // dev-login unavailable
      .mockResolvedValueOnce({ ok: false, status: 401 }) // login rejected

    renderAuth()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'))

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials')
    )
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('clears user and sessionStorage on logout', async () => {
    sessionStorage.setItem('user', JSON.stringify({ email: 'a@b.com', token: 'tok' }))

    renderAuth()
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('a@b.com'))

    act(() => {
      screen.getByRole('button', { name: 'Logout' }).click()
    })

    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(sessionStorage.getItem('user')).toBeNull()
  })
})
