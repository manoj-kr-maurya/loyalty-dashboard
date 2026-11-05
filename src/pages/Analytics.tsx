import { useMemo } from 'react'
import { Download } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchCampaigns, fetchCurrencyBuckets, fetchCustomers, fetchPromos } from '../lib/endpoints'
import { StatCard } from '../components/StatCard'
import { StatCardSkeleton } from '../components/Skeletons'
import { Coins, Megaphone, Tag, Users } from 'lucide-react'
import type { Campaign, CurrencyBucket, Promo, TopCustomer } from '../lib/types'

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))]
  const escape = (v: unknown) => {
    const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
}

function download(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows)
  if (!csv) return
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Analytics() {
  const buckets = useFetch<CurrencyBucket[]>(fetchCurrencyBuckets)
  const campaigns = useFetch<Campaign[]>(fetchCampaigns)
  const promos = useFetch<Promo[]>(fetchPromos)
  const customers = useFetch<TopCustomer[]>(fetchCustomers)

  const totals = useMemo(() => {
    const b = buckets.data ?? []
    const c = campaigns.data ?? []
    const now = Date.now()
    return {
      available: b.reduce((s, x) => s + (x.availableAmount ?? 0), 0),
      distributed: b.reduce((s, x) => s + (x.distributedAmount ?? 0), 0),
      activeCampaigns: c.filter(
        (x) => !x.isSoftDeleted && new Date(x.startDate).getTime() <= now && new Date(x.endDate).getTime() >= now,
      ).length,
    }
  }, [buckets.data, campaigns.data])

  const loading = buckets.loading || campaigns.loading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Program health and CSV exports of your loyalty data.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard to="/currencies" label="Available points" value={totals.available.toLocaleString()} icon={Coins} tone="bg-emerald-50 text-emerald-600" />
          <StatCard to="/currencies" label="Distributed points" value={totals.distributed.toLocaleString()} icon={Coins} tone="bg-brand-50 text-brand-600" />
          <StatCard to="/campaigns" label="Active campaigns" value={totals.activeCampaigns} icon={Megaphone} tone="bg-amber-50 text-amber-600" />
          <StatCard to="/promo-codes" label="Promos" value={(promos.data ?? []).length} icon={Tag} tone="bg-violet-50 text-violet-600" />
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Exports</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => download('campaigns.csv', (campaigns.data ?? []) as unknown as Record<string, unknown>[])}>
            <Download className="h-4 w-4" /> Campaigns CSV
          </button>
          <button className="btn-secondary" onClick={() => download('promos.csv', (promos.data ?? []) as unknown as Record<string, unknown>[])}>
            <Download className="h-4 w-4" /> Promos CSV
          </button>
          <button className="btn-secondary" onClick={() => download('currency-buckets.csv', (buckets.data ?? []) as unknown as Record<string, unknown>[])}>
            <Download className="h-4 w-4" /> Buckets CSV
          </button>
          <button className="btn-secondary" onClick={() => download('top-customers.csv', (customers.data ?? []) as unknown as Record<string, unknown>[])}>
            <Download className="h-4 w-4" /> Top customers CSV
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Top customers</h2>
        {customers.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (customers.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">No customer activity yet.</p>
        ) : (
          <div className="space-y-2">
            {(customers.data ?? []).map((c, i) => (
              <div key={`${c.customer_name}-${i}`} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <Users className="h-4 w-4 text-slate-400" /> {c.customer_name || '—'}
                </span>
                <span className="font-medium text-slate-900">{Number(c.total_earned ?? 0).toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
