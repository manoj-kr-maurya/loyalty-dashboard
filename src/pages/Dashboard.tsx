import { Coins, Megaphone, Users, Wallet } from 'lucide-react'
import { fetchCampaigns, fetchCurrencyBuckets, fetchCustomers, fetchOrganization } from '../lib/endpoints'
import { setOrg } from '../lib/auth'
import { useFetch } from '../lib/useFetch'
import { StatCard } from '../components/StatCard'
import { StatCardSkeleton, CardSkeleton } from '../components/Skeletons'
import type { Campaign, CurrencyBucket, Customer, Organization } from '../lib/types'

export default function Dashboard() {
  const orgFetch = useFetch<{ organization: Organization }>(async () => {
    const data = await fetchOrganization()
    setOrg(data.organization)
    return data
  })
  const bucketFetch = useFetch<CurrencyBucket[]>(fetchCurrencyBuckets)
  const campaignFetch = useFetch<Campaign[]>(fetchCampaigns)
  const customerFetch = useFetch<Customer[]>(fetchCustomers)

  const org = orgFetch.data?.organization
  const buckets = bucketFetch.data ?? []
  const campaigns = campaignFetch.data ?? []
  const customers = customerFetch.data ?? []

  const totalAvailable = buckets.reduce((sum, b) => sum + (b.availableAmount ?? 0), 0)
  const totalDistributed = buckets.reduce((sum, b) => sum + (b.distributedAmount ?? 0), 0)

  if (orgFetch.loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back{org?.name ? `, ${org.name}` : ''}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening in your loyalty program.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard to="/currencies" label="Currencies" value={buckets.length} icon={Coins} tone="bg-brand-50 text-brand-600" />
        <StatCard to="/currencies" label="Available Points" value={totalAvailable.toLocaleString()} icon={Wallet} tone="bg-emerald-50 text-emerald-600" />
        <StatCard to="/campaigns" label="Campaigns" value={campaigns.length} icon={Megaphone} tone="bg-amber-50 text-amber-600" />
        <StatCard to="/customers" label="Customers" value={customers.length} icon={Users} tone="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Currency buckets</h2>
          {bucketFetch.loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : totalAvailable === 0 && buckets.length === 0 ? (
            <p className="text-sm text-slate-500">No currencies yet.</p>
          ) : (
            <div className="space-y-3">
              {buckets.map((b) => (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{b.code}</span>
                    <span className="text-slate-500">{b.availableAmount.toLocaleString()} available</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-brand-500"
                      style={{
                        width: `${b.availableAmount ? Math.min(100, (b.availableAmount / (b.availableAmount + b.distributedAmount || 1)) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Distributed points</h2>
          <p className="text-sm text-slate-500">Total rewarded to customers.</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalDistributed.toLocaleString()}</p>
        </section>
      </div>
    </div>
  )
}