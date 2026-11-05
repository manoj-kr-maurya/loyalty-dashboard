import { useMemo, useState } from 'react'
import { Award, Plus, Pencil, Trash2 } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchTiers, upsertTiers } from '../lib/endpoints'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeletons'
import type { LoyaltyTier } from '../lib/types'

interface DraftTier {
  name: string
  minPoints: string
  maxPoints: string
  multiplier: string
  color: string
}

const DEFAULT_COLORS = ['#CD7F32', '#C0C0C0', '#FFD700', '#22C55E', '#3B82F6', '#A855F7']

function toDraft(tier: LoyaltyTier, index: number): DraftTier {
  return {
    name: tier.name,
    minPoints: String(tier.minPoints),
    maxPoints: tier.maxPoints != null ? String(tier.maxPoints) : '',
    multiplier: String(tier.multiplier),
    color: tier.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }
}

function emptyDraft(index: number): DraftTier {
  return {
    name: '',
    minPoints: index === 0 ? '0' : '',
    maxPoints: '',
    multiplier: '1',
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }
}

function formatRange(tier: LoyaltyTier): string {
  const min = tier.minPoints.toLocaleString()
  if (tier.maxPoints == null) return `${min}+ pts`
  return `${min} – ${tier.maxPoints.toLocaleString()} pts`
}

export default function Tiers() {
  const { data: tiers, loading, error, refetch } = useFetch<LoyaltyTier[]>(fetchTiers)
  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<DraftTier[]>([])
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  const sorted = useMemo(
    () => [...(tiers ?? [])].sort((a, b) => a.level - b.level),
    [tiers],
  )

  function startEditing() {
    setDrafts(sorted.length ? sorted.map(toDraft) : [emptyDraft(0)])
    setEditing(true)
  }

  function updateDraft(index: number, patch: Partial<DraftTier>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function addTier() {
    setDrafts((prev) => [...prev, emptyDraft(prev.length)])
  }

  function removeTier(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  function buildPayload(): { tiers?: LoyaltyTier[]; error?: string } {
    const tiers: LoyaltyTier[] = []
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i]
      const name = d.name.trim()
      if (!name) return { error: `Tier ${i + 1}: name is required.` }

      const minPoints = Number(d.minPoints)
      if (!Number.isInteger(minPoints) || minPoints < 0) {
        return { error: `Tier "${name}": min points must be a non-negative integer.` }
      }

      const maxPoints = d.maxPoints.trim() === '' ? undefined : Number(d.maxPoints)
      if (maxPoints != null && (!Number.isInteger(maxPoints) || maxPoints <= minPoints)) {
        return { error: `Tier "${name}": max points must be an integer greater than min points.` }
      }

      const multiplier = Number(d.multiplier)
      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        return { error: `Tier "${name}": multiplier must be greater than 0.` }
      }

      if (i > 0 && minPoints <= tiers[i - 1].minPoints) {
        return {
          error: `Tier "${name}": min points must be greater than the previous tier's min points.`,
        }
      }

      tiers.push({
        name,
        level: i + 1,
        minPoints,
        ...(maxPoints != null ? { maxPoints } : {}),
        multiplier,
        color: d.color || undefined,
      })
    }
    return { tiers }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const { tiers: payload, error: validationError } = buildPayload()
    if (validationError) {
      addToast('error', validationError)
      return
    }
    setBusy(true)
    try {
      await upsertTiers(payload!)
      addToast('success', 'Tiers saved.')
      setEditing(false)
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loyalty Tiers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reward customers with multipliers and benefits as they earn more points.
          </p>
        </div>
        {!editing && (
          <button className="btn-primary" onClick={startEditing}>
            <Pencil className="h-4 w-4" /> {sorted.length ? 'Edit tiers' : 'Create tiers'}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {editing ? (
        <form onSubmit={handleSave} className="card space-y-4" noValidate>
          <h2 className="text-lg font-semibold text-slate-900">Tier definition</h2>
          <p className="text-sm text-slate-500">
            Levels are assigned in order (1, 2, 3…). Each tier must start at a higher point
            threshold than the previous one.
          </p>

          <div className="space-y-3">
            {drafts.map((d, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Level {i + 1}</span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => removeTier(i)}
                    aria-label={`Remove tier ${i + 1}`}
                    disabled={drafts.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <label className="label">Name</label>
                    <input
                      className="input"
                      value={d.name}
                      onChange={(e) => updateDraft(i, { name: e.target.value })}
                      placeholder="e.g. Gold"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Min points</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={d.minPoints}
                      onChange={(e) => updateDraft(i, { minPoints: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Max points</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={d.maxPoints}
                      onChange={(e) => updateDraft(i, { maxPoints: e.target.value })}
                      placeholder="optional"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Multiplier</label>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        step="0.05"
                        value={d.multiplier}
                        onChange={(e) => updateDraft(i, { multiplier: e.target.value })}
                        placeholder="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Color</label>
                      <input
                        className="input h-[38px] p-1"
                        type="color"
                        value={d.color}
                        onChange={(e) => updateDraft(i, { color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn-secondary" onClick={addTier}>
            <Plus className="h-4 w-4" /> Add tier
          </button>

          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save tiers'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card text-center">
          <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No tiers configured yet.</p>
          <button className="btn-primary mt-4" onClick={startEditing}>
            <Plus className="h-4 w-4" /> Create your first tier
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((tier) => (
            <div key={`${tier.level}-${tier.name}`} className="card">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: tier.color ?? '#64748b' }}
                >
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{tier.name}</p>
                  <p className="text-xs text-slate-500">Level {tier.level}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{formatRange(tier)}</p>
                  <p className="text-xs text-slate-500">Threshold</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{tier.multiplier}×</p>
                  <p className="text-xs text-slate-500">Multiplier</p>
                </div>
              </div>

              {tier.benefits && Object.keys(tier.benefits).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(tier.benefits).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
