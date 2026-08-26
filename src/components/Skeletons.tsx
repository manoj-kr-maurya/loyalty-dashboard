export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-slate-200 h-16 w-full" />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="mt-3 h-8 w-1/2 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse card flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-slate-200" />
      <div className="flex-1">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="mt-2 h-6 w-16 rounded bg-slate-200" />
      </div>
    </div>
  )
}

export function TableSkeleton({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="animate-pulse">
        <div className="flex gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 flex-1 rounded bg-slate-200" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b border-slate-100 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3 flex-1 rounded bg-slate-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
