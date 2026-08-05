import axios, { AxiosError } from 'axios'
import { getToken, clearAuth } from './auth'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuth()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) return data!.message.join(', ')
    if (typeof data?.message === 'string') return data.message
    return error.message
  }
  return error instanceof Error ? error.message : 'Unknown error'
}

export async function request<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await api.request<T>({ method, url, data: body })
  return res.data
}

export default api