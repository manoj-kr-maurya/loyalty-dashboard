import { LayoutDashboard, Coins, Megaphone, Users, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAuth, getOrg } from '../lib/auth'
import type { Organization } from '../lib/types'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/currencies', label: 'Currencies', icon: Coins },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/customers', label: 'Customers', icon: Users },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const org = getOrg<Organization>()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
            {org?.name?.[0]?.toUpperCase() ?? 'L'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{org?.name ?? 'Organization'}</p>
            <p className="truncate text-xs text-slate-500">{org?.id}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}