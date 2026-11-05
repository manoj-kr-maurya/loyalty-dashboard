import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import { isAuthenticated } from './lib/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Currencies from './pages/Currencies'
import Campaigns from './pages/Campaigns'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import PromoCodes from './pages/PromoCodes'
import CouponTools from './pages/CouponTools'
import Tiers from './pages/Tiers'
import Settings from './pages/Settings'
import Webhooks from './pages/Webhooks'
import Rewards from './pages/Rewards'
import Shops from './pages/Shops'
import Orders from './pages/Orders'
import Engines from './pages/Engines'
import Analytics from './pages/Analytics'

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
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/currencies" element={<Currencies />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/promo-codes" element={<PromoCodes />} />
        <Route path="/coupon-tools" element={<CouponTools />} />
        <Route path="/tiers" element={<Tiers />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:customerId" element={<CustomerDetail />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/engines" element={<Engines />} />
        <Route path="/webhooks" element={<Webhooks />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}