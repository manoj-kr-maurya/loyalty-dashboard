/// <reference types="vitest" />
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Currencies from '../pages/Currencies'
import Campaigns from '../pages/Campaigns'
import Customers from '../pages/Customers'
import { ToastProvider } from '../components/Toast'
import type { CurrencyBucket, Campaign, Customer } from '../lib/types'

// ── Mocks ─────────────────────────────────────────────────

vi.mock('../lib/endpoints', () => ({
  fetchOrganization: vi.fn(),
  fetchCurrencyBuckets: vi.fn(),
  fetchCampaigns: vi.fn(),
  fetchCustomers: vi.fn(),
}))

vi.mock('../lib/actions', () => ({
  create: vi.fn(),
  addBucketBalance: vi.fn(),
  createCampaign: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  extractError: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Unknown error')),
}))

vi.mock('../lib/auth', () => ({
  setOrg: vi.fn(),
  isAuthenticated: vi.fn().mockReturnValue(true),
  getToken: vi.fn().mockReturnValue('fake-token'),
  clearAuth: vi.fn(),
}))

import { fetchOrganization, fetchCurrencyBuckets, fetchCampaigns, fetchCustomers } from '../lib/endpoints'
import { create, createCampaign } from '../lib/actions'
import { setOrg } from '../lib/auth'

const mockFetchOrganization = vi.mocked(fetchOrganization)
const mockFetchCurrencyBuckets = vi.mocked(fetchCurrencyBuckets)
const mockFetchCampaigns = vi.mocked(fetchCampaigns)
const mockFetchCustomers = vi.mocked(fetchCustomers)
const mockCreate = vi.mocked(create)
const mockCreateCampaign = vi.mocked(createCampaign)
const mockSetOrg = vi.mocked(setOrg)

function withProviders(ui: React.ReactNode) {
  return (
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  )
}

const sampleBuckets: CurrencyBucket[] = [
  { id: '1', code: 'PTS', availableAmount: 5000, distributedAmount: 2000, receivedAmount: 1000, autoTopUpEnabled: false, autoTopUpThreshold: null, autoTopUpAmount: null },
  { id: '2', code: 'REWARDS', availableAmount: 3000, distributedAmount: 1000, receivedAmount: 500, autoTopUpEnabled: true, autoTopUpThreshold: 100, autoTopUpAmount: 500 },
]

const sampleCampaigns: Campaign[] = [
  {
    id: 'c1', name: 'Summer Sale', earningPercentage: 10, currencyCode: 'PTS',
    startDate: '2025-01-01T00:00:00Z', endDate: '2026-12-31T23:59:59Z',
    earningExpiresIn: 30, isSoftDeleted: false,
  },
  {
    id: 'c2', name: 'Past Campaign', earningPercentage: 5, currencyCode: 'PTS',
    startDate: '2020-01-01T00:00:00Z', endDate: '2020-06-01T00:00:00Z',
    earningExpiresIn: 15, isSoftDeleted: false,
  },
  {
    id: 'c3', name: 'Future Campaign', earningPercentage: 8, currencyCode: 'REWARDS',
    startDate: '2028-01-01T00:00:00Z', endDate: '2028-12-31T23:59:59Z',
    earningExpiresIn: 60, isSoftDeleted: false,
  },
]

const sampleCustomers: Customer[] = [
  { id: 'u1', name: 'Alice', phoneNumber: '1234567890', countryCode: '91', isVerified: true, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'u2', name: 'Bob', phoneNumber: '9876543210', countryCode: '91', isVerified: false, createdAt: '2024-03-20T14:30:00Z' },
]

beforeEach(() => {
  vi.clearAllMocks()
  // Endpoints already unwrap res.data in their implementation,
  // so mocks return the unwrapped data directly.
  mockFetchOrganization.mockResolvedValue({ organization: { id: 'org1', name: 'Test Org' }, metaFlags: {} })
  mockFetchCurrencyBuckets.mockResolvedValue(sampleBuckets)
  mockFetchCampaigns.mockResolvedValue(sampleCampaigns)
  mockFetchCustomers.mockResolvedValue(sampleCustomers)
})

// ── Dashboard ─────────────────────────────────────────────

describe('Dashboard', () => {
  it('shows loading skeletons while fetching', () => {
    mockFetchOrganization.mockReturnValue(new Promise(() => {}))
    render(withProviders(<Dashboard />))
    expect(screen.getAllByRole('generic').filter((el) => el.className.includes('animate-pulse')).length).toBeGreaterThan(0)
  })

  it('renders stat cards with data', async () => {
    render(withProviders(<Dashboard />))
    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test Org')).toBeInTheDocument()
    })
    expect(screen.getByText('Currencies')).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Available Points')).toBeInTheDocument()
    expect(screen.getByText('8,000')).toBeInTheDocument()
    expect(screen.getByText('Campaigns')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
  })

  it('shows currency buckets with progress bars', async () => {
    render(withProviders(<Dashboard />))
    await waitFor(() => {
      expect(screen.getByText('Currency buckets')).toBeInTheDocument()
    })
    expect(screen.getByText('PTS')).toBeInTheDocument()
    expect(screen.getByText('5,000 available')).toBeInTheDocument()
    expect(screen.getByText('REWARDS')).toBeInTheDocument()
    expect(screen.getByText('3,000 available')).toBeInTheDocument()
    const bars = document.querySelectorAll('.bg-brand-500')
    expect(bars.length).toBe(2)
  })

  it('shows distributed points total', async () => {
    render(withProviders(<Dashboard />))
    await waitFor(() => {
      expect(screen.getByText('Distributed points')).toBeInTheDocument()
    })
    expect(screen.getByText('3,000')).toBeInTheDocument()
  })

  it('calls setOrg with organization data', async () => {
    render(withProviders(<Dashboard />))
    await waitFor(() => {
      expect(mockSetOrg).toHaveBeenCalledWith({ id: 'org1', name: 'Test Org' })
    })
  })
})

// ── Currencies ────────────────────────────────────────────

describe('Currencies', () => {
  it('shows loading while fetching', () => {
    mockFetchCurrencyBuckets.mockReturnValue(new Promise(() => {}))
    render(withProviders(<Currencies />))
    expect(screen.getAllByRole('generic').filter((el) => el.className.includes('animate-pulse')).length).toBeGreaterThan(0)
  })

  it('renders currency bucket cards', async () => {
    render(withProviders(<Currencies />))
    await waitFor(() => {
      expect(screen.getByText('PTS')).toBeInTheDocument()
    })
    expect(screen.getByText('REWARDS')).toBeInTheDocument()
    expect(screen.getByText('8,000 points available across all buckets.')).toBeInTheDocument()
  })

  it('shows create form when button clicked', async () => {
    render(withProviders(<Currencies />))
    await waitFor(() => {
      expect(screen.getByText('PTS')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /create currency/i }))
    expect(screen.getByText('New currency')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. PTS')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Points')).toBeInTheDocument()
  })

  it('calls create action on form submit', async () => {
    mockCreate.mockResolvedValue({} as never)
    render(withProviders(<Currencies />))
    await waitFor(() => {
      expect(screen.getByText('PTS')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /create currency/i }))
    await userEvent.type(screen.getByPlaceholderText('e.g. PTS'), 'NEW')
    await userEvent.type(screen.getByPlaceholderText('e.g. Points'), 'New Coin')
    await userEvent.click(screen.getByRole('button', { name: /^Create$/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith('NEW', 'New Coin')
    })
  })

  it('shows success toast on create', async () => {
    mockCreate.mockResolvedValue({} as never)
    render(withProviders(<Currencies />))
    await waitFor(() => {
      expect(screen.getByText('PTS')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /create currency/i }))
    await userEvent.type(screen.getByPlaceholderText('e.g. PTS'), 'NEW')
    await userEvent.type(screen.getByPlaceholderText('e.g. Points'), 'New Coin')
    await userEvent.click(screen.getByRole('button', { name: /^Create$/i }))

    await waitFor(() => {
      expect(screen.getByText('Currency created.')).toBeInTheDocument()
    })
  })

  it('hides empty state when buckets exist', async () => {
    render(withProviders(<Currencies />))
    await waitFor(() => {
      expect(screen.getByText('PTS')).toBeInTheDocument()
    })
    expect(screen.queryByText(/No currency buckets yet/)).not.toBeInTheDocument()
  })

  it('shows empty state when no buckets', async () => {
    mockFetchCurrencyBuckets.mockResolvedValue([])
    render(withProviders(<Currencies />))
    await waitFor(() => {
      expect(screen.getByText(/No currency buckets yet/)).toBeInTheDocument()
    })
  })
})

// ── Campaigns ─────────────────────────────────────────────

describe('Campaigns', () => {
  it('shows loading while fetching', () => {
    mockFetchCampaigns.mockReturnValue(new Promise(() => {}))
    render(withProviders(<Campaigns />))
    expect(screen.getAllByRole('generic').filter((el) => el.className.includes('animate-pulse')).length).toBeGreaterThan(0)
  })

  it('renders campaign table', async () => {
    render(withProviders(<Campaigns />))
    await waitFor(() => {
      expect(screen.getByText('Summer Sale')).toBeInTheDocument()
    })
    expect(screen.getByText('Past Campaign')).toBeInTheDocument()
    expect(screen.getByText('Future Campaign')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
  })

  it('shows correct status badges (Active/Scheduled/Expired)', async () => {
    render(withProviders(<Campaigns />))
    await waitFor(() => {
      expect(screen.getByText('Summer Sale')).toBeInTheDocument()
    })
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
  })

  it('shows create form on button click', async () => {
    render(withProviders(<Campaigns />))
    await waitFor(() => {
      expect(screen.getByText('Summer Sale')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /new campaign/i }))
    expect(screen.getAllByText('New campaign').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByPlaceholderText('e.g. Monsoon Sale')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. PTS')).toBeInTheDocument()
  })

  it('calls createCampaign on form submit', async () => {
    const { container } = render(withProviders(<Campaigns />))
    mockCreateCampaign.mockResolvedValue({} as never)
    await waitFor(() => {
      expect(screen.getByText('Summer Sale')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /new campaign/i }))
    await userEvent.type(screen.getByPlaceholderText('e.g. Monsoon Sale'), 'Winter Deal')
    await userEvent.type(screen.getByPlaceholderText('e.g. PTS'), 'PTS')
    const dateInputs = container.querySelectorAll('input[type="datetime-local"]')
    await userEvent.type(dateInputs[0], '2026-06-01T00:00')
    await userEvent.type(dateInputs[1], '2026-12-31T23:59')
    await userEvent.click(screen.getByRole('button', { name: /create campaign/i }))

    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalledWith({
        name: 'Winter Deal',
        earningPercentage: 5,
        currencyCode: 'PTS',
        startDate: '2026-06-01T00:00',
        endDate: '2026-12-31T23:59',
        earningExpiresIn: 30,
      })
    })
  })

  it('shows success toast on campaign create', async () => {
    const { container } = render(withProviders(<Campaigns />))
    mockCreateCampaign.mockResolvedValue({} as never)
    await waitFor(() => {
      expect(screen.getByText('Summer Sale')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /new campaign/i }))
    await userEvent.type(screen.getByPlaceholderText('e.g. Monsoon Sale'), 'Flash Sale')
    await userEvent.type(screen.getByPlaceholderText('e.g. PTS'), 'PTS')
    const dateInputs = container.querySelectorAll('input[type="datetime-local"]')
    await userEvent.type(dateInputs[0], '2026-01-01T00:00')
    await userEvent.type(dateInputs[1], '2026-06-01T00:00')
    await userEvent.click(screen.getByRole('button', { name: /create campaign/i }))

    await waitFor(() => {
      expect(screen.getByText('Campaign created.')).toBeInTheDocument()
    })
  })

  it('shows empty state when no campaigns', async () => {
    mockFetchCampaigns.mockResolvedValue([])
    render(withProviders(<Campaigns />))
    await waitFor(() => {
      expect(screen.getByText('No campaigns yet.')).toBeInTheDocument()
    })
  })
})

// ── Customers ─────────────────────────────────────────────

describe('Customers', () => {
  it('shows loading while fetching', () => {
    mockFetchCustomers.mockReturnValue(new Promise(() => {}))
    render(withProviders(<Customers />))
    expect(screen.getAllByRole('generic').filter((el) => el.className.includes('animate-pulse')).length).toBeGreaterThan(0)
  })

  it('renders customer table', async () => {
    render(withProviders(<Customers />))
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('+91 1234567890')).toBeInTheDocument()
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument()
    expect(screen.getAllByText('Verified').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Unverified')).toBeInTheDocument()
    expect(screen.getByText('2 customers.')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(4)
  })

  it('filters customers by search query', async () => {
    render(withProviders(<Customers />))
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by name or phone/i)
    await userEvent.type(searchInput, 'Alice')

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
  })

  it('filters by phone number', async () => {
    render(withProviders(<Customers />))
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by name or phone/i)
    await userEvent.type(searchInput, '98765')

    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows "No customers yet" when empty', async () => {
    mockFetchCustomers.mockResolvedValue([])
    render(withProviders(<Customers />))
    await waitFor(() => {
      expect(screen.getByText('No customers yet.')).toBeInTheDocument()
    })
  })

  it('shows "No matches" when filter yields nothing', async () => {
    render(withProviders(<Customers />))
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by name or phone/i)
    await userEvent.type(searchInput, 'zzzzzzz')

    expect(screen.getByText('No matches.')).toBeInTheDocument()
  })

  it('shows "No matches" but not "No customers yet" for non-empty filter miss', async () => {
    render(withProviders(<Customers />))
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by name or phone/i)
    await userEvent.type(searchInput, 'zzzzz')

    expect(screen.queryByText('No customers yet.')).not.toBeInTheDocument()
    expect(screen.getByText('No matches.')).toBeInTheDocument()
  })
})
