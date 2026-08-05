import { request } from './api'
import type { ApiResponse, Campaign, Currency, CurrencyBucket, Customer, MetaFlags, Organization } from './types'

export async function requestOrgOtp(payload: { countryCode: string; phoneNumber: string; name?: string }) {
  const res = await request<ApiResponse<string>>('post', '/organization/otp/phone', payload)
  return res.data
}

export async function verifyOrgOtp(payload: { id: string; otp: string }) {
  const res = await request<ApiResponse<{ organization: Organization; metaFlags: MetaFlags }>>(
    'post',
    '/organization/otp/validate',
    payload,
  )
  return res.data
}

export async function fetchOrganization() {
  const res = await request<ApiResponse<{ organization: Organization; metaFlags: MetaFlags }>>('get', '/organization')
  return res.data
}

export async function fetchCurrencyBuckets() {
  const res = await request<ApiResponse<CurrencyBucket[]>>('get', '/currency/get-organization-currency-buckets')
  return res.data
}

export async function fetchCurrencies() {
  const res = await request<ApiResponse<Currency[]>>('get', '/currency')
  return res.data
}

export async function fetchCampaigns() {
  const res = await request<ApiResponse<Campaign[]>>('get', '/campaign/get-organization-level-campaigns')
  return res.data
}

export async function fetchCustomers() {
  const res = await request<ApiResponse<Customer[]>>('get', '/customer')
  return res.data
}
