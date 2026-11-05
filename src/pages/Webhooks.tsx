import { useState } from 'react'
import { Copy, Check, Plus, RefreshCw, Send, Trash2 } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeletons'
import {
  WEBHOOK_EVENTS,
  createWebhook,
  deleteWebhook,
  listWebhookDeadLetters,
  listWebhookDeliveries,
  listWebhooks,
  retryWebhookDelivery,
  rotateWebhookSecret,
  testWebhook,
} from '../lib/integrations'
import type { WebhookDelivery, WebhookEndpoint } from '../lib/integrations'

function SecretBanner({ secret, label }: { secret: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <p className="text-xs font-semibold text-emerald-800">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-slate-800">{secret}</code>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => { void navigator.clipboard?.writeText(secret); setCopied(true) }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function Webhooks() {
  const { data: endpoints, loading, refetch } = useFetch<WebhookEndpoint[]>(() => listWebhooks(true))
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const [selected, setSelected] = useState<WebhookEndpoint | null>(null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [deadLetters, setDeadLetters] = useState<WebhookDelivery[]>([])
  const [deliveriesLoading, setDeliveriesLoading] = useState(false)
  const { addToast } = useToast()

  function toggleEvent(ev: string) {
    setEvents((prev) => (prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]))
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const created = await createWebhook({
        url,
        description: description || undefined,
        events,
        isActive,
      })
      if (created.secret) setNewSecret(created.secret)
      addToast('success', 'Webhook endpoint created.')
      setUrl('')
      setDescription('')
      setEvents([])
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this webhook endpoint?')) return
    try {
      await deleteWebhook(id)
      addToast('success', 'Webhook deleted.')
      if (selected?.id === id) setSelected(null)
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  async function rotate(id: string) {
    try {
      const res = await rotateWebhookSecret(id)
      setNewSecret(res.secret)
      addToast('success', 'Signing secret rotated.')
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  async function test(id: string) {
    try {
      await testWebhook(id)
      addToast('success', 'Test delivery sent.')
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  async function openDeliveries(ep: WebhookEndpoint) {
    setSelected(ep)
    setDeliveriesLoading(true)
    try {
      const [d, dead] = await Promise.all([
        listWebhookDeliveries(ep.id, 1, 20),
        listWebhookDeadLetters(50),
      ])
      setDeliveries(d.data ?? [])
      setDeadLetters((dead ?? []).filter((x) => x.endpointId === ep.id))
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setDeliveriesLoading(false)
    }
  }

  async function retry(id: string) {
    try {
      await retryWebhookDelivery(id)
      addToast('success', 'Delivery requeued.')
      if (selected) await openDeliveries(selected)
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webhooks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Receive signed HTTP callbacks for loyalty events such as points earned or tier upgrades.
        </p>
      </div>

      {newSecret && <SecretBanner secret={newSecret} label="Signing secret — store it now" />}

      <form onSubmit={create} className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Add endpoint</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">URL</label>
            <input
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/hooks/loyalty"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. CRM sync"
            />
          </div>
        </div>
        <div>
          <label className="label">Events (empty = all events)</label>
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((ev) => (
              <button
                type="button"
                key={ev}
                onClick={() => toggleEvent(ev)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  events.includes(ev) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ev}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
        <button className="btn-primary" disabled={busy}>
          <Plus className="h-4 w-4" /> {busy ? 'Creating…' : 'Create webhook'}
        </button>
      </form>

      {loading ? (
        <TableSkeleton cols={4} rows={3} />
      ) : !endpoints?.length ? (
        <p className="text-sm text-slate-500">No webhook endpoints yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {endpoints.map((ep) => (
                <tr key={ep.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button className="font-medium text-brand-700 hover:underline" onClick={() => openDeliveries(ep)}>
                      {ep.url}
                    </button>
                    {ep.description && <p className="text-xs text-slate-400">{ep.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{ep.events.length ? ep.events.join(', ') : 'all'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      ep.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ep.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 text-slate-400">
                      <button onClick={() => test(ep.id)} aria-label="Send test" title="Send test"><Send className="h-4 w-4 hover:text-brand-600" /></button>
                      <button onClick={() => rotate(ep.id)} aria-label="Rotate secret" title="Rotate secret"><RefreshCw className="h-4 w-4 hover:text-brand-600" /></button>
                      <button onClick={() => remove(ep.id)} aria-label="Delete" title="Delete"><Trash2 className="h-4 w-4 hover:text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Deliveries · {selected.url}</h2>
          {deliveriesLoading ? (
            <TableSkeleton cols={4} rows={3} />
          ) : deliveries.length === 0 ? (
            <p className="text-sm text-slate-500">No deliveries recorded.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Attempts</th>
                    <th className="px-3 py-2">Last error</th>
                    <th className="px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.status === 'SUCCESS' || d.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.status === 'EXHAUSTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>{d.status}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{d.attempts}</td>
                      <td className="px-3 py-2 text-slate-500">{d.lastError || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{new Date(d.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {deadLetters.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Dead letters</h3>
              <div className="space-y-2">
                {deadLetters.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                    <span className="text-red-700">{d.lastError || d.status} · {new Date(d.updatedAt).toLocaleString()}</span>
                    <button className="btn-secondary" onClick={() => retry(d.id)}>
                      <RefreshCw className="h-4 w-4" /> Retry
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
