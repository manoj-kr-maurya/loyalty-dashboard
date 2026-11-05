import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchCustomers } from '../lib/endpoints'
import { TableSkeleton } from '../components/Skeletons'
import type { TopCustomer } from '../lib/types'

export default function Customers() {
  const { data, loading } = useFetch<TopCustomer[]>(fetchCustomers)
  const [query, setQuery] = useState('')

  const customers = data ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => (c.customer_name ?? '').toLowerCase().includes(q))
  }, [customers, query])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Top customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Top customers by points earned in the last 48 hours.
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
        />
      </div>

      {loading ? (
        <TableSkeleton cols={3} rows={5} />
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">{customers.length === 0 ? 'No customers yet.' : 'No matches.'}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Points earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c, i) => (
                <tr key={`${c.customer_name ?? 'customer'}-${i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.customer_name || '—'}</td>
                  <td className="px-4 py-3">{Number(c.total_earned ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
