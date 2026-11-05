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

export interface TopCustomer {
  customer_name: string | null
  total_earned: number
}

export interface LoyaltyTier {
  name: string
  level: number
  minPoints: number
  maxPoints?: number
  multiplier: number
  benefits?: Record<string, unknown>
  color?: string
  iconUrl?: string
}

export interface Promo {
  id: string
  name: string
  description?: string
  rewardType: string
  rewardCurrency?: string
  status?: string
  programType?: string
  minBankAmount?: number | null
  businessType?: string[]
  maxClaimsPerUser?: number | null
  maxClaimsTotal?: number | null
  couponValue?: number | null
  minimumCartValue?: number | null
  maxDiscountValue?: number | null
  subTitle?: string | null
  couponCode?: string | null
  attributes?: Record<string, any> | null
  channels?: string[]
  startDate?: string
  endDate?: string
  organizationId?: string
  priority?: number
  createdAt?: string
  rules?: PromoRule[]
}

export interface PromoRule {
  id?: string
  programId?: string
  name: string
  rewardType: string
  rewardMode: string
  value: number
  conditions: unknown
  threshold?: number | null
  ratioBase?: number | null
  meta?: unknown
}

export interface CouponCode {
  id: string
  programId: string
  code: string
  isUserSpecific: boolean
  customerId?: string | null
  status: 'AVAILABLE' | 'BLOCKED' | 'CLAIMED' | 'EXPIRED' | 'REVOKED'
  maxUses: number
  usedCount: number
  transactionRef?: string | null
  generatedAt: string
  claimedAt?: string | null
  expiresAt?: string | null
}

export interface ValidateCodeResponse {
  isValid: boolean
  message: string
  couponCode?: CouponCode
  program?: Promo
  discount?: number
}
