import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider, useToast } from '../components/Toast'

function TestComponent() {
  const { addToast } = useToast()
  return (
    <div>
      <button onClick={() => addToast('success', 'Success!')}>Success</button>
      <button onClick={() => addToast('error', 'Error!')}>Error</button>
      <button onClick={() => addToast('info', 'Info!')}>Info</button>
    </div>
  )
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <ToastProvider>{ui}</ToastProvider>
    </BrowserRouter>,
  )
}

describe('Toast', () => {
  it('should render toast provider', () => {
    renderWithProviders(<TestComponent />)
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('should show success toast on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Success'))
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('should show error toast on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Error'))
    expect(screen.getByText('Error!')).toBeInTheDocument()
  })

  it('should auto-dismiss toast after timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Success'))
    expect(screen.getByText('Success!')).toBeInTheDocument()

    vi.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument()
    }, { timeout: 2000 })

    vi.useRealTimers()
  })
})
