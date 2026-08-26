import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LoadingSkeleton, CardSkeleton, StatCardSkeleton, TableSkeleton } from '../components/Skeletons'

describe('Skeletons', () => {
  it('should render LoadingSkeleton with default rows', () => {
    const { container } = render(<LoadingSkeleton />)
    const rows = container.querySelectorAll('.animate-pulse')
    expect(rows.length).toBe(3)
  })

  it('should render LoadingSkeleton with custom rows', () => {
    const { container } = render(<LoadingSkeleton rows={5} />)
    const rows = container.querySelectorAll('.animate-pulse')
    expect(rows.length).toBe(5)
  })

  it('should render CardSkeleton', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render StatCardSkeleton', () => {
    const { container } = render(<StatCardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render TableSkeleton with default cols and rows', () => {
    const { container } = render(<TableSkeleton />)
    const rows = container.querySelectorAll('.border-b')
    expect(rows.length).toBe(6) // 1 header + 5 data rows
  })

  it('should render TableSkeleton with custom cols and rows', () => {
    const { container } = render(<TableSkeleton cols={6} rows={3} />)
    const rows = container.querySelectorAll('.border-b')
    expect(rows.length).toBe(4) // 1 header + 3 data rows
  })
})
