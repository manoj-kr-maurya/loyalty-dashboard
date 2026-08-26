/// <reference types="vitest" />
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Coins, Wallet, Megaphone } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { LoadingSkeleton, CardSkeleton, StatCardSkeleton, TableSkeleton } from '../components/Skeletons'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ToastProvider, useToast } from '../components/Toast'

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

// ── StatCard ──────────────────────────────────────────────

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Currencies" value={5} icon={Coins} tone="bg-brand-50 text-brand-600" to="/currencies" />, { wrapper })
    expect(screen.getByText('Currencies')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('links to the correct path', () => {
    render(<StatCard label="Customers" value={12} icon={Wallet} tone="bg-emerald-50 text-emerald-600" to="/customers" />, { wrapper })
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/customers')
  })

  it('renders with different tones', () => {
    render(
      <StatCard label="Test" value={1} icon={Coins} tone="bg-brand-50 text-brand-600" to="/" />,
      { wrapper },
    )
    const span = screen.getByText('1').closest('a')!.querySelector('span')
    expect(span?.className).toContain('bg-brand-50')
  })

  it('renders with amber tone', () => {
    render(
      <StatCard label="Test" value={1} icon={Megaphone} tone="bg-amber-50 text-amber-600" to="/" />,
      { wrapper },
    )
    const span = screen.getByText('1').closest('a')!.querySelector('span')
    expect(span?.className).toContain('bg-amber-50')
  })
})

// ── Skeletons ─────────────────────────────────────────────

describe('LoadingSkeleton', () => {
  it('renders correct number of rows', () => {
    const { container } = render(<LoadingSkeleton rows={4} />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })

  it('defaults to 3 rows', () => {
    const { container } = render(<LoadingSkeleton />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
  })

  it('has animate-pulse class', () => {
    const { container } = render(<LoadingSkeleton rows={1} />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('CardSkeleton', () => {
  it('renders a single skeleton card', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(1)
  })

  it('has animate-pulse class', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('StatCardSkeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<StatCardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('TableSkeleton', () => {
  it('renders correct number of header and data rows', () => {
    const { container } = render(<TableSkeleton cols={3} rows={4} />)
    const animatePulse = container.querySelector('.animate-pulse')!
    const flexRows = animatePulse.querySelectorAll(':scope > div')
    expect(flexRows).toHaveLength(5) // 1 header + 4 data
    flexRows.forEach((row) => {
      expect(row.children).toHaveLength(3)
    })
  })

  it('defaults to 4 cols and 5 rows', () => {
    const { container } = render(<TableSkeleton />)
    const animatePulse = container.querySelector('.animate-pulse')!
    const flexRows = animatePulse.querySelectorAll(':scope > div')
    expect(flexRows).toHaveLength(6) // 1 header + 5 data
    flexRows.forEach((row) => {
      expect(row.children).toHaveLength(4)
    })
  })
})

// ── ErrorBoundary ─────────────────────────────────────────

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Child content</div>
}

describe('ErrorBoundary', () => {
  const originalError = console.error
  beforeEach(() => { console.error = vi.fn() })
  afterEach(() => { console.error = originalError })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('shows error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('has a reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })
})

// ── Toast / ToastProvider ─────────────────────────────────

function ToastTestConsumer() {
  const { addToast } = useToast()
  return (
    <div>
      <button onClick={() => addToast('success', 'Created!')}>show success</button>
      <button onClick={() => addToast('error', 'Oops!')}>show error</button>
      <button onClick={() => addToast('info', 'FYI')}>show info</button>
    </div>
  )
}

describe('Toast / ToastProvider', () => {
  it('shows toast on addToast call', async () => {
    render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /show success/i }))
    expect(screen.getByText('Created!')).toBeInTheDocument()
  })

  it('auto-dismisses after timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /show success/i }))
    expect(screen.getByText('Created!')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(4500)
    })

    expect(screen.queryByText('Created!')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('multiple toasts stack', async () => {
    render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /show success/i }))
    await userEvent.click(screen.getByRole('button', { name: /show error/i }))
    expect(screen.getByText('Created!')).toBeInTheDocument()
    expect(screen.getByText('Oops!')).toBeInTheDocument()
  })

  it('close button removes toast', async () => {
    render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /show success/i }))
    expect(screen.getByText('Created!')).toBeInTheDocument()

    const closeButtons = screen.getAllByRole('button', { name: '×' })
    await userEvent.click(closeButtons[0])
    expect(screen.queryByText('Created!')).not.toBeInTheDocument()
  })

  it('throws when useToast used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function BadConsumer() {
      useToast()
      return null
    }
    expect(() => render(<BadConsumer />)).toThrow('useToast must be used within ToastProvider')
    spy.mockRestore()
  })
})
