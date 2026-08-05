import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchCustomers } from '../lib/endpoints'
import type { Customer } from '../lib/types'

function toArray(data: unknown): Customer[] {
  if (Array.isArray(data)) return data as Customer[]
  if (data && typeof data === 'object' && Array.isArray((data as { customers?: unknown }).customers)) {
    return (data as { customers: Customer[] }).customers
  }
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Customer[] }).data
  }
  return []
}

export default function Customers() {
  const { data, loading } = useFetch<unknown>(fetchCustomers)
  const [query, setQuery] = useState('')

  const customers = useMemo(() => toArray(data), [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.name, c.phoneNumber, c.countryCode, c.id].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [customers, query])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">{customers.length} customers.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">{customers.length === 0 ? 'No customers yet.' : 'No matches.'}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name || '—'}</td>
                  <td className="px-4 py-3">
                    {c.countryCode ? `+${c.countryCode} ` : ''}
                    {c.phoneNumber || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.isVerified ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}