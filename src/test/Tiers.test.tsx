/// <reference types="vitest" />
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Tiers from '../pages/Tiers'
import { ToastProvider } from '../components/Toast'
import type { LoyaltyTier } from '../lib/types'

vi.mock('../lib/endpoints', () => ({
  fetchTiers: vi.fn(),
  upsertTiers: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  extractError: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Unknown error')),
}))

import { fetchTiers, upsertTiers } from '../lib/endpoints'

const mockFetchTiers = vi.mocked(fetchTiers)
const mockUpsertTiers = vi.mocked(upsertTiers)

const sampleTiers: LoyaltyTier[] = [
  { name: 'Bronze', level: 1, minPoints: 0, maxPoints: 999, multiplier: 1, color: '#CD7F32' },
  { name: 'Silver', level: 2, minPoints: 1000, maxPoints: 4999, multiplier: 1.25, color: '#C0C0C0' },
  { name: 'Gold', level: 3, minPoints: 5000, multiplier: 1.5, color: '#FFD700', benefits: { freeShipping: true } },
]

function withProviders(ui: React.ReactNode) {
  return <ToastProvider>{ui}</ToastProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchTiers.mockResolvedValue(sampleTiers)
  mockUpsertTiers.mockResolvedValue([])
})

describe('Tiers', () => {
  it('shows loading skeletons while fetching', () => {
    mockFetchTiers.mockReturnValue(new Promise(() => {}))
    render(withProviders(<Tiers />))
    expect(
      screen.getAllByRole('generic').filter((el) => el.className.includes('animate-pulse')).length,
    ).toBeGreaterThan(0)
  })

  it('renders tiers from the backend', async () => {
    render(withProviders(<Tiers />))
    await waitFor(() => {
      expect(screen.getByText('Bronze')).toBeInTheDocument()
    })
    expect(screen.getByText('Silver')).toBeInTheDocument()
    expect(screen.getByText('Gold')).toBeInTheDocument()
    expect(screen.getByText('Level 3')).toBeInTheDocument()
    expect(screen.getByText('5,000+ pts')).toBeInTheDocument()
    expect(screen.getByText('0 – 999 pts')).toBeInTheDocument()
    expect(screen.getByText('1.5×')).toBeInTheDocument()
    expect(screen.getByText('freeShipping: true')).toBeInTheDocument()
  })

  it('shows empty state when there are no tiers', async () => {
    mockFetchTiers.mockResolvedValue([])
    render(withProviders(<Tiers />))
    await waitFor(() => {
      expect(screen.getByText('No tiers configured yet.')).toBeInTheDocument()
    })
  })

  it('saves sequential tiers through the engine endpoint', async () => {
    render(withProviders(<Tiers />))
    await waitFor(() => {
      expect(screen.getByText('Bronze')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /edit tiers/i }))
    await userEvent.click(screen.getByRole('button', { name: /save tiers/i }))

    await waitFor(() => {
      expect(mockUpsertTiers).toHaveBeenCalledTimes(1)
    })
    expect(mockUpsertTiers).toHaveBeenCalledWith([
      { name: 'Bronze', level: 1, minPoints: 0, maxPoints: 999, multiplier: 1, color: '#CD7F32' },
      { name: 'Silver', level: 2, minPoints: 1000, maxPoints: 4999, multiplier: 1.25, color: '#C0C0C0' },
      { name: 'Gold', level: 3, minPoints: 5000, multiplier: 1.5, color: '#FFD700' },
    ])
  })

  it('rejects a tier without a name before calling the backend', async () => {
    mockFetchTiers.mockResolvedValue([])
    render(withProviders(<Tiers />))
    await waitFor(() => {
      expect(screen.getByText('No tiers configured yet.')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /create your first tier/i }))
    await userEvent.click(screen.getByRole('button', { name: /save tiers/i }))

    await waitFor(() => {
      expect(screen.getByText('Tier 1: name is required.')).toBeInTheDocument()
    })
    expect(mockUpsertTiers).not.toHaveBeenCalled()
  })
})
