export interface ApiResponse<T> {
  status: string
  code: string
  data: T
}

export interface Organization {
  id: string
  name?: string
  address?: string
  logo?: string
  phoneNumber?: string
  countryCode?: string
  isVerified?: boolean
  token?: string
  metaFlags?: MetaFlags
  createdAt?: string
}

export interface MetaFlags {
  initJourneyCompleted?: boolean
  [key: string]: unknown
}

export interface CurrencyBucket {
  id: string
  code: string
  availableAmount: number
  distributedAmount: number
  receivedAmount: number
  autoTopUpEnabled: boolean
  autoTopUpThreshold?: number | null
  autoTopUpAmount?: number | null
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  exchangeRate?: number | null
  isSoftDeleted?: boolean
}

export interface Campaign {
  id: string
  name: string
  earningPercentage: number
  currencyCode: string
  startDate: string
  endDate: string
  earningExpiresIn: number
  isSoftDeleted?: boolean
  status?: string
}

export interface Customer {
  id: string
  name?: string
  phoneNumber?: string
  countryCode?: string
  isVerified?: boolean
  createdAt?: string
}
