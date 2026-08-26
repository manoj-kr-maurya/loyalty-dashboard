/// <reference types="vitest" />
import { renderHook, waitFor } from '@testing-library/react'
import { useFetch } from '../lib/useFetch'

function makeFetcher<T>(result: T) {
  return vi.fn().mockResolvedValue(result)
}

function makeFailingFetcher(message: string) {
  return vi.fn().mockRejectedValue(new Error(message))
}

describe('useFetch', () => {
  it('returns loading=true initially', () => {
    const fetcher = makeFetcher('data')
    const { result } = renderHook(() => useFetch(fetcher))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('')
  })

  it('returns data on success', async () => {
    const fetcher = makeFetcher({ name: 'org' })
    const { result } = renderHook(() => useFetch(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual({ name: 'org' })
    expect(result.current.error).toBe('')
  })

  it('returns error message on failure', async () => {
    const fetcher = makeFailingFetcher('Network error')
    const { result } = renderHook(() => useFetch(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('sets loading=false after completion', async () => {
    const fetcher = makeFetcher('done')
    const { result } = renderHook(() => useFetch(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.loading).toBe(false)
  })

  it('handles non-Error exceptions', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error')
    const { result } = renderHook(() => useFetch(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to load')
    expect(result.current.data).toBeNull()
  })

  it('refetch triggers reload and returns fresh data', async () => {
    let callCount = 0
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++
      return `data-${callCount}`
    })
    const { result } = renderHook(() => useFetch(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('data-1')

    // After refetch, loading goes back to true
    result.current.refetch()
    // Then resolves
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('data-2')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
