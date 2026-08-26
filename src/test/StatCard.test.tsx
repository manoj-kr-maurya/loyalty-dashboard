import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { StatCard } from '../components/StatCard'
import { Coins } from 'lucide-react'

function renderWithProviders(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('StatCard', () => {
  it('should render label and value', () => {
    renderWithProviders(
      <StatCard
        label="Currencies"
        value={5}
        icon={Coins}
        tone="bg-brand-50 text-brand-600"
        to="/currencies"
      />,
    )

    expect(screen.getByText('Currencies')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render as link with correct href', () => {
    renderWithProviders(
      <StatCard
        label="Campaigns"
        value={10}
        icon={Coins}
        tone="bg-amber-50 text-amber-600"
        to="/campaigns"
      />,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/campaigns')
  })

  it('should render string value', () => {
    renderWithProviders(
      <StatCard
        label="Points"
        value="1,234"
        icon={Coins}
        tone="bg-emerald-50 text-emerald-600"
        to="/currencies"
      />,
    )

    expect(screen.getByText('1,234')).toBeInTheDocument()
  })
})
