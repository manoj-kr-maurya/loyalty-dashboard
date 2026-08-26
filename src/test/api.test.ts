import { describe, it, expect } from 'vitest'
import { extractError } from '../lib/api'

describe('extractError', () => {
  it('should extract message from AxiosError', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: 'Something went wrong' },
      },
      message: 'Request failed',
    }
    expect(extractError(error)).toBe('Something went wrong')
  })

  it('should extract array message from AxiosError', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: ['Error 1', 'Error 2'] },
      },
      message: 'Request failed',
    }
    expect(extractError(error)).toBe('Error 1, Error 2')
  })

  it('should return error message for AxiosError without response data', () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
    }
    expect(extractError(error)).toBe('Network Error')
  })

  it('should extract message from Error instance', () => {
    const error = new Error('Test error')
    expect(extractError(error)).toBe('Test error')
  })

  it('should return "Unknown error" for unknown errors', () => {
    expect(extractError('unknown')).toBe('Unknown error')
  })

  it('should return "Unknown error" for null', () => {
    expect(extractError(null)).toBe('Unknown error')
  })
})
