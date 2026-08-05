import { request } from './api'

export async function create(currencyCode: string, name: string) {
  const res = await request('post', '/currency/create', { currencyCode, name })
  return res
}

export async function addBucketBalance(currencyCode: string, amount: number) {
  const res = await request('post', '/currency/add-balance-to-organization-currency-bucket', { currencyCode, amount })
  return res
}

export async function createCampaign(payload: {
  name: string
  earningPercentage: number
  currencyCode: string
  startDate: string
  endDate: string
  earningExpiresIn: number
}) {
  const res = await request('post', '/campaign/create-organization-level-campaign', payload)
  return res
}