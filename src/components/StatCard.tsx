import type { Coins } from 'lucide-react'
import { Link } from 'react-router-dom'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  to,
}: {
  label: string
  value: string | number
  icon: typeof Coins
  tone: string
  to: string
}) {
  return (
    <Link to={to} className="card flex items-center gap-4 transition-shadow hover:shadow">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
    </Link>
  )
}
