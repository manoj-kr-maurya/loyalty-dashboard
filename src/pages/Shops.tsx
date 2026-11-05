import { useEffect, useState } from 'react'
import { Store } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeletons'
import { fetchShops, updateShop } from '../lib/integrations'
import type { Shop } from '../lib/integrations'

const fields: { key: keyof Shop; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address' },
  { key: 'contactUs', label: 'Contact' },
  { key: 'operationalHours', label: 'Operational hours' },
  { key: 'upiURI', label: 'UPI URI' },
  { key: 'aboutUs', label: 'About' },
]

export default function Shops() {
  const { data: shops, loading, refetch } = useFetch<Shop[]>(fetchShops)
  const [selected, setSelected] = useState<Shop | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (selected) {
      const next: Record<string, string> = {}
      fields.forEach((f) => { next[f.key as string] = (selected[f.key] as string) ?? '' })
      setForm(next)
    }
  }, [selected])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setBusy(true)
    try {
      await updateShop({ shopId: selected.id, ...form })
      addToast('success', 'Shop updated.')
      setSelected(null)
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shops</h1>
        <p className="mt-1 text-sm text-slate-500">Active shops (sub-locations) that belong to your organization.</p>
      </div>

      {loading ? (
        <TableSkeleton cols={3} rows={4} />
      ) : !shops?.length ? (
        <div className="card text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No shops found. Invite a shop from the backend to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => setSelected(shop)}
              className="card text-left transition hover:border-brand-300"
            >
              <p className="text-lg font-semibold text-slate-900">{shop.name || 'Unnamed shop'}</p>
              <p className="text-sm text-slate-500">{shop.address || 'No address'}</p>
              {shop.phoneNumber && (
                <p className="mt-1 text-xs text-slate-400">
                  {shop.countryCode ? `+${shop.countryCode} ` : ''}{shop.phoneNumber}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <form onSubmit={save} className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit {selected.name || 'shop'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key as string}>
                <label className="label">{f.label}</label>
                <input
                  className="input"
                  value={form[f.key as string] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save shop'}</button>
            <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
