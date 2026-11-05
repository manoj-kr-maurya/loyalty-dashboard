/// <reference types="vitest" />
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../components/Toast'

vi.mock('../lib/api', () => ({
  request: vi.fn(),
  extractError: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Unknown error')),
}))

vi.mock('../lib/auth', () => ({
  getOrg: vi.fn().mockReturnValue({ id: 'org-1' }),
  setOrg: vi.fn(),
  isAuthenticated: vi.fn().mockReturnValue(true),
  getToken: vi.fn().mockReturnValue('fake-token'),
  clearAuth: vi.fn(),
}))

vi.mock('../lib/endpoints', () => ({
  fetchOrganization: vi.fn(),
  fetchCurrencyBuckets: vi.fn(),
  fetchCampaigns: vi.fn(),
  fetchCustomers: vi.fn(),
  fetchPromos: vi.fn(),
}))

vi.mock('../lib/integrations', () => ({
  API_KEY_SCOPES: ['loyalty:read'],
  WEBHOOK_EVENTS: ['points.earned'],
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
  updateOrganization: vi.fn(),
  fetchShops: vi.fn(),
  updateShop: vi.fn(),
  listWebhooks: vi.fn(),
  listWebhookDeliveries: vi.fn(),
  listWebhookDeadLetters: vi.fn(),
  createWebhook: vi.fn(),
  deleteWebhook: vi.fn(),
  retryWebhookDelivery: vi.fn(),
  rotateWebhookSecret: vi.fn(),
  testWebhook: vi.fn(),
}))

vi.mock('../lib/engines', () => ({
  earnPoints: vi.fn(),
  burnPoints: vi.fn(),
  estimatePoints: vi.fn(),
  expirePoints: vi.fn(),
  generateStatement: vi.fn(),
  fetchLedger: vi.fn(),
  fetchTierStatus: vi.fn(),
}))

vi.mock('../lib/customers', () => ({
  getCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  listCustomerWallets: vi.fn(),
  broadCustomerBalance: vi.fn(),
  listCustomerOrders: vi.fn(),
  listOrgCustomerOrders: vi.fn(),
  updateCustomerOrder: vi.fn(),
}))

vi.mock('../lib/orders', () => ({
  ORG_ORDER_TYPES: ['CURRENCY_PURCHASE'],
  ORG_ORDER_STATUSES: ['PENDING', 'COMPLETED'],
  listOrgOrders: vi.fn(),
  createOrgOrder: vi.fn(),
  updateOrgOrder: vi.fn(),
}))

import Settings from '../pages/Settings'
import Webhooks from '../pages/Webhooks'
import Rewards from '../pages/Rewards'
import Shops from '../pages/Shops'
import Orders from '../pages/Orders'
import Engines from '../pages/Engines'
import Analytics from '../pages/Analytics'
import CustomerDetail from '../pages/CustomerDetail'
import { fetchOrganization, fetchCampaigns, fetchCurrencyBuckets, fetchCustomers, fetchPromos } from '../lib/endpoints'
import { fetchShops, listApiKeys, listWebhookDeadLetters, listWebhookDeliveries, listWebhooks } from '../lib/integrations'
import { getCustomer, listCustomerOrders, listCustomerWallets, listOrgCustomerOrders } from '../lib/customers'
import { listOrgOrders } from '../lib/orders'

const mockFetchOrganization = vi.mocked(fetchOrganization)
const mockFetchCampaigns = vi.mocked(fetchCampaigns)
const mockFetchCurrencyBuckets = vi.mocked(fetchCurrencyBuckets)
const mockFetchCustomers = vi.mocked(fetchCustomers)
const mockFetchPromos = vi.mocked(fetchPromos)
const mockFetchShops = vi.mocked(fetchShops)
const mockListApiKeys = vi.mocked(listApiKeys)
const mockListWebhooks = vi.mocked(listWebhooks)
const mockListDeliveries = vi.mocked(listWebhookDeliveries)
const mockListDeadLetters = vi.mocked(listWebhookDeadLetters)
const mockGetCustomer = vi.mocked(getCustomer)
const mockListWallets = vi.mocked(listCustomerWallets)
const mockListCustomerOrders = vi.mocked(listCustomerOrders)
const mockListOrgCustomerOrders = vi.mocked(listOrgCustomerOrders)
const mockListOrgOrders = vi.mocked(listOrgOrders)

function withProviders(ui: React.ReactNode) {
  return (
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchOrganization.mockResolvedValue({ organization: { id: 'org-1', name: 'Acme' }, metaFlags: {} })
  mockFetchCampaigns.mockResolvedValue([])
  mockFetchCurrencyBuckets.mockResolvedValue([])
  mockFetchCustomers.mockResolvedValue([])
  mockFetchPromos.mockResolvedValue([])
  mockFetchShops.mockResolvedValue([{ id: 's1', name: 'Main Store', address: '1 High St' }])
  mockListApiKeys.mockResolvedValue([])
  mockListWebhooks.mockResolvedValue([])
  mockListDeliveries.mockResolvedValue({ status: 'success', data: [], metadata: { total: 0, page: 1, limit: 20 } })
  mockListDeadLetters.mockResolvedValue([])
  mockGetCustomer.mockResolvedValue({ id: 'c1', name: 'Jane Doe', phoneNumber: '9999999999' })
  mockListWallets.mockResolvedValue([])
  mockListCustomerOrders.mockResolvedValue([])
  mockListOrgCustomerOrders.mockResolvedValue([])
  mockListOrgOrders.mockResolvedValue([])
})

describe('Settings', () => {
  it('renders org profile and API keys sections', async () => {
    render(withProviders(<Settings />))
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Acme')).toBeInTheDocument()
    expect(screen.getByText('API keys')).toBeInTheDocument()
  })
})

describe('Webhooks', () => {
  it('renders empty endpoint state', async () => {
    render(withProviders(<Webhooks />))
    expect(screen.getByText('Webhooks')).toBeInTheDocument()
    expect(await screen.findByText(/No webhook endpoints yet/i)).toBeInTheDocument()
  })
})

describe('Rewards', () => {
  it('renders engine tabs', () => {
    render(withProviders(<Rewards />))
    expect(screen.getByText('Rewards')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Earn' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Burn' })).toBeInTheDocument()
  })
})

describe('Shops', () => {
  it('lists shops', async () => {
    render(withProviders(<Shops />))
    expect(await screen.findByText('Main Store')).toBeInTheDocument()
  })
})

describe('Orders', () => {
  it('renders organization and customer order tables', () => {
    render(withProviders(<Orders />))
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Organization orders')).toBeInTheDocument()
    expect(screen.getByText('Customer orders')).toBeInTheDocument()
  })
})

describe('Engines', () => {
  it('renders engine console', () => {
    render(withProviders(<Engines />))
    expect(screen.getByText('Engines')).toBeInTheDocument()
    expect(screen.getByText('Response')).toBeInTheDocument()
  })
})

describe('Analytics', () => {
  it('renders analytics with stats', async () => {
    render(withProviders(<Analytics />))
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(await screen.findByText('Available points')).toBeInTheDocument()
  })
})

describe('CustomerDetail', () => {
  it('loads a customer by route param', async () => {
    render(
      <MemoryRouter initialEntries={['/customers/c1']}>
        <ToastProvider>
          <Routes>
            <Route path="/customers/:customerId" element={<CustomerDetail />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(mockGetCustomer).toHaveBeenCalledWith('c1')
  })
})
