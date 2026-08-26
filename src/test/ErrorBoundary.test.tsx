import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '../components/Toast'
import { ErrorBoundary } from '../components/ErrorBoundary'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>{ui}</ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>,
  )
}

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    renderWithProviders(<div>Test content</div>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render error UI when child throws', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error')
    }

    renderWithProviders(<ThrowingComponent />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should have reload button', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error')
    }

    renderWithProviders(<ThrowingComponent />)
    expect(screen.getByText('Reload page')).toBeInTheDocument()
  })
})
