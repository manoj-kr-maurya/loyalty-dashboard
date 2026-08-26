import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import { isAuthenticated } from './lib/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Currencies from './pages/Currencies'
import Campaigns from './pages/Campaigns'
import Customers from './pages/Customers'
import PromoCodes from './pages/PromoCodes'

function Protected({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/currencies" element={<Currencies />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/promo-codes" element={<PromoCodes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}