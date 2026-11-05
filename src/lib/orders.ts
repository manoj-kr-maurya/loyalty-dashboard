import { request } from './api'
import { getOrg } from './auth'

function orgId(): string {
  return getOrg<{ id?: string }>()?.id ?? ''
}

export interface OrgOrder {
  id: string
  orderType?: string
  orderStatus?: string
  amount?: number
  paymentReference?: string | null
  details?: { currencyCode?: string } | null
  createdAt?: string
  [key: string]: unknown
}

export async function listOrgOrders(): Promise<OrgOrder[]> {
  const res = await request<{ status: string; data: OrgOrder[] }>(
    'get',
    `/organization/order?organizationId=${orgId()}`,
  )
  return res.data ?? []
}

export async function createOrgOrder(payload: {
  orderType: string
  amount?: number
  details: Record<string, unknown>
}) {
  return await request<unknown>('post', '/organization/order', { organizationId: orgId(), ...payload })
}

export async function getOrgOrder(orderId: string) {
  return await request<{ status: string; data: OrgOrder }>(
    'get',
    `/organization/order/${orderId}?organizationId=${orgId()}`,
  )
}

export async function updateOrgOrder(orderId: string, newStatus: string) {
  return await request<unknown>('put', `/organization/order/${orderId}?organizationId=${orgId()}`, {
    newStatus,
  })
}

export const ORG_ORDER_TYPES = ['CURRENCY_PURCHASE'] as const
export const ORG_ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const
