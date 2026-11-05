import { request } from './api'
import { getOrg } from './auth'

function orgId(): string {
  return getOrg<{ id?: string }>()?.id ?? ''
}

export interface Wallet {
  id: string
  currencyCode?: string
  balance?: number
  [key: string]: unknown
}

export interface CustomerRecord {
  id: string
  name?: string | null
  phoneNumber?: string | null
  countryCode?: string | null
  isVerified?: boolean
  createdAt?: string
  [key: string]: unknown
}

export async function getCustomer(customerId: string, balances = true): Promise<CustomerRecord> {
  const res = await request<{ status: string; data: CustomerRecord }>(
    'get',
    `/customer/?customerId=${customerId}&organizationId=${orgId()}&balances=${balances}`,
  )
  const data = res.data as CustomerRecord & { customer?: CustomerRecord }
  return (data?.customer ?? data) as CustomerRecord
}

export async function updateCustomer(payload: { customerId: string; name?: string; base64Logo?: string }) {
  return await request<unknown>('post', '/customer/update', { organizationId: orgId(), ...payload })
}

export async function listCustomerWallets(customerId: string): Promise<Wallet[]> {
  const res = await request<{ status: string; data: Wallet[] }>(
    'get',
    `/customer-wallets/fetch-customer-wallets?customerId=${customerId}&organizationId=${orgId()}`,
  )
  return res.data ?? []
}

export async function broadCustomerBalance(customerId: string) {
  const res = await request<{ status: string; data: unknown }>(
    'get',
    `/customer-wallets/broad-customer-balance?customerId=${customerId}&organizationId=${orgId()}`,
  )
  return res.data
}

export async function listCustomerOrders(customerId: string): Promise<Record<string, unknown>[]> {
  const res = await request<{ status: string; data: Record<string, unknown>[] }>(
    'get',
    `/customer-organization/order/customer?customerId=${customerId}&organizationId=${orgId()}`,
  )
  return res.data ?? []
}

export async function listOrgCustomerOrders(): Promise<Record<string, unknown>[]> {
  const res = await request<{ status: string; data: Record<string, unknown>[] }>(
    'get',
    `/customer-organization/order/organization?organizationId=${orgId()}`,
  )
  return res.data ?? []
}

export async function updateCustomerOrder(orderId: string, status: string) {
  return await request<unknown>('post', '/customer-organization/order/update', {
    organizationId: orgId(),
    orderId,
    status,
  })
}
