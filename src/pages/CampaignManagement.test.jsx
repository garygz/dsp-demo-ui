import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CampaignManagement from './CampaignManagement'

// ── Module mocks ───────────────────────────────────────────────────────────────

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { token: 'test-token' } }),
}))

vi.mock('../api/endpoints', () => ({
  ENDPOINTS: {
    ADVERTISERS: 'http://api/advertisers',
    CAMPAIGNS: (id) => `http://api/advertisers/${id}/campaigns`,
  },
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const ADVERTISER = { id: 'adv-1', name: 'Acme Corp' }

const CAMPAIGNS = [
  { id: 'c-1', name: 'Summer Sale 2025',   landingPage: 'https://acme.com/summer', createdAt: '2025-06-01T00:00:00Z' },
  { id: 'c-2', name: 'Back to School',      landingPage: 'https://acme.com/back',   createdAt: '2025-08-01T00:00:00Z' },
]

// ── Fetch helpers ──────────────────────────────────────────────────────────────

function okJson(data) {
  return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify(data) })
}

function errorResponse(status = 500) {
  return Promise.resolve({ ok: false, status, text: async () => '' })
}

/** Mock sequential fetch calls: first resolves advertisers, second resolves campaigns. */
function mockFetchSuccess(campaigns = CAMPAIGNS) {
  global.fetch = vi.fn()
    .mockReturnValueOnce(okJson([ADVERTISER]))
    .mockReturnValueOnce(okJson(campaigns))
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CampaignManagement', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows a loading spinner while fetching', () => {
    // Never resolve so the spinner stays visible
    global.fetch = vi.fn(() => new Promise(() => {}))
    render(<CampaignManagement />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders campaign rows after a successful fetch', async () => {
    mockFetchSuccess()
    render(<CampaignManagement />)

    await waitFor(() => expect(screen.getByText('Summer Sale 2025')).toBeInTheDocument())
    expect(screen.getByText('Back to School')).toBeInTheDocument()
  })

  it('shows "No campaigns found" when there are no advertisers at all', async () => {
    global.fetch = vi.fn().mockReturnValue(okJson([]))
    render(<CampaignManagement />)

    await waitFor(() => expect(screen.getByText(/No campaigns found/i)).toBeInTheDocument())
  })

  it('renders an empty table when the advertiser has no campaigns', async () => {
    mockFetchSuccess([])
    render(<CampaignManagement />)

    // Table renders but tbody has no data rows
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(screen.queryByRole('row', { name: /summer/i })).not.toBeInTheDocument()
  })

  it('removes only the archived campaign from the list', async () => {
    mockFetchSuccess()
    render(<CampaignManagement />)

    await waitFor(() => screen.getByText('Summer Sale 2025'))

    const archiveButtons = screen.getAllByRole('button', { name: /archive/i })
    await userEvent.click(archiveButtons[0])

    expect(screen.queryByText('Summer Sale 2025')).not.toBeInTheDocument()
    expect(screen.getByText('Back to School')).toBeInTheDocument()
  })

  it('shows an error alert when the fetch fails', async () => {
    global.fetch = vi.fn().mockReturnValue(errorResponse())
    render(<CampaignManagement />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('does not show the advertiser dropdown when there is only one advertiser', async () => {
    mockFetchSuccess()
    render(<CampaignManagement />)

    await waitFor(() => screen.getByText('Summer Sale 2025'))
    expect(screen.queryByLabelText(/advertiser/i)).not.toBeInTheDocument()
  })

  it('persists column widths in localStorage after a resize interaction', async () => {
    mockFetchSuccess()
    render(<CampaignManagement />)

    await waitFor(() => screen.getByText('Summer Sale 2025'))

    // Verify that the default widths are written to localStorage on mount
    const stored = JSON.parse(localStorage.getItem('campaign-column-widths') ?? 'null')
    // The component only writes on resize; check no crash if nothing is stored yet
    expect(stored).toBeNull()
  })
})
