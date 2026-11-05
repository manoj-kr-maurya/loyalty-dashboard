import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeletons'
import { ORG_ORDER_STATUSES, ORG_ORDER_TYPES, createOrgOrder, listOrgOrders, updateOrgOrder } from '../lib/orders'
import type { OrgOrder } from '../lib/orders'
import { listOrgCustomerOrders, updateCustomerOrder } from '../lib/customers'

function OrdersTable({
  rows,
  onStatus,
}: {
  rows: Record<string, unknown>[]
  onStatus?: (id: string, status: string) => void
}) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">No orders yet.</p>
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Created</th>
            {onStatus && <th className="px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((o, i) => (
            <tr key={(o.id as string) ?? i} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{String(o.id).slice(0, 12)}…</td>
              <td className="px-4 py-3">{String(o.orderType ?? '—')}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {String(o.orderStatus ?? o.status ?? '—')}
                </span>
              </td>
              <td className="px-4 py-3">{o.amount != null ? String(o.amount) : '—'}</td>
              <td className="px-4 py-3 text-slate-500">
                {o.createdAt ? new Date(String(o.createdAt)).toLocaleDateString() : '—'}
              </td>
              {onStatus && (
                <td className="px-4 py-3">
                  <select
                    className="input py-1 text-xs"
                    defaultValue=""
                    onChange={(e) => e.target.value && onStatus(String(o.id), e.target.value)}
                  >
                    <option value="">Set status…</option>
                    {ORG_ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Orders() {
  const { data: orgOrders, loading, refetch } = useFetch<OrgOrder[]>(listOrgOrders)
  const { data: customerOrders, loading: loadingCustomer, refetch: refetchCustomer } =
    useFetch<Record<string, unknown>[]>(listOrgCustomerOrders)
  const [orderType, setOrderType] = useState<string>(ORG_ORDER_TYPES[0])
  const [amount, setAmount] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await createOrgOrder({
        orderType,
        ...(amount ? { amount: Number(amount) } : {}),
        details: currencyCode ? { currencyCode } : {},
      })
      addToast('success', 'Order created.')
      setAmount('')
      setCurrencyCode('')
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await updateOrgOrder(id, status)
      addToast('success', 'Order status updated.')
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  async function setCustomerStatus(id: string, status: string) {
    try {
      await updateCustomerOrder(id, status)
      addToast('success', 'Customer order updated.')
      await refetchCustomer()
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Organization purchase orders and customer reward orders.</p>
      </div>

      <form onSubmit={create} className="card grid gap-3 sm:grid-cols-3">
        <h2 className="text-lg font-semibold text-slate-900 sm:col-span-3">New organization order</h2>
        <div>
          <label className="label">Type</label>
          <select className="input" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
            {ORG_ORDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Amount</label>
          <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" />
        </div>
        <div>
          <label className="label">Currency code</label>
          <input className="input" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} placeholder="e.g. PTS" />
        </div>
        <div className="sm:col-span-3">
          <button className="btn-primary" disabled={busy}>
            <Plus className="h-4 w-4" /> {busy ? 'Creating…' : 'Create order'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Organization orders</h2>
          <button className="btn-secondary" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
        {loading ? <TableSkeleton cols={5} rows={3} /> : (
          <OrdersTable rows={(orgOrders ?? []) as unknown as Record<string, unknown>[]} onStatus={setStatus} />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Customer orders</h2>
          <button className="btn-secondary" onClick={() => refetchCustomer()}><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
        {loadingCustomer ? <TableSkeleton cols={5} rows={3} /> : (
          <OrdersTable rows={customerOrders ?? []} onStatus={setCustomerStatus} />
        )}
      </section>
    </div>
  )
}
